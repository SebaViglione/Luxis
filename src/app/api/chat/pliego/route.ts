import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { chatMensajes } from '@/db/schema';
import { IANoConfigurada, verificarIA } from '@/lib/ia/estructurado';
import { modeloFuerte } from '@/lib/ia/modelos';
import { obtenerSesion } from '@/server/auth/sesion';
import { armarContextoPliego, buscarParrafo, instruccionesChatPliego, resumenContextoPliego } from '@/server/ia/chat-pliego';
import { leerPrecios } from '@/server/ia/precio';
import { leerPerfil } from '@/server/onboarding/guardar-perfil';

// Con un pliego largo completo en el contexto (hasta ~350k caracteres), la respuesta puede pasar el minuto.
export const maxDuration = 120;

const MAX_MENSAJES_HISTORIAL = 20;

interface CuerpoChat {
  idCompra?: string;
  messages?: UIMessage[];
  trigger?: 'submit-message' | 'regenerate-message';
}

/** POST { idCompra, messages } → stream de UI messages del AI SDK. Guarda la conversación en chat_mensajes. */
export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: 'Tu sesión venció. Ingresá de nuevo.' }, { status: 401 });

  try {
    verificarIA();
  } catch (error) {
    if (error instanceof IANoConfigurada) return Response.json({ error: error.message }, { status: 503 });
    throw error;
  }

  let cuerpo: CuerpoChat;
  try {
    cuerpo = (await request.json()) as CuerpoChat;
  } catch {
    return Response.json({ error: 'Mensaje inválido.' }, { status: 400 });
  }
  const { idCompra, messages, trigger } = cuerpo;
  if (!idCompra || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Falta la licitación o el mensaje.' }, { status: 400 });
  }

  const ultimo = messages[messages.length - 1];
  const pregunta = textoDe(ultimo);
  // Para pliegos grandes se buscan los párrafos relevantes: la pregunta actual + la anterior (repreguntas tipo "¿y el monto?").
  const preguntasUsuario = messages.filter((m) => m.role === 'user').map(textoDe).filter(Boolean);
  const consulta = preguntasUsuario.slice(-2).join('\n');

  // El perfil deja que el chat diga qué ítems puede ofertar la empresa, y los precios históricos, a cuánto cotizar;
  // si alguno falla, responde solo con el pliego.
  const [contexto, perfil, precios] = await Promise.all([
    armarContextoPliego(idCompra, consulta),
    leerPerfil(sesion.empresaId).catch(() => null),
    leerPrecios(idCompra).catch(() => []),
  ]);
  if (!contexto) return Response.json({ error: 'No encontramos esa licitación.' }, { status: 404 });
  if (ultimo.role === 'user' && pregunta && trigger !== 'regenerate-message') {
    // Sin await: guardar la pregunta no tiene que demorar la primera palabra de la respuesta.
    void db.insert(chatMensajes).values({ empresaId: sesion.empresaId, idCompra, rol: 'user', contenido: pregunta }).catch(() => null);
  }

  const resultado = streamText({
    model: modeloFuerte,
    temperature: 0,
    // DeepSeek V4 razona por defecto: tarda hasta 1 min en escribir y además ignora temperature.
    // Sin razonamiento el primer texto llega en ~5 s y las citas siguen igual de precisas.
    providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
    instructions: instruccionesChatPliego(contexto, { perfil, precios }),
    messages: await convertToModelMessages(messages.slice(-MAX_MENSAJES_HISTORIAL)),
    onFinish: async ({ text, usage }) => {
      console.info(
        `[chat-pliego] ${idCompra} modo=${contexto.modo} tokens entrada=${usage.inputTokens} cache_lectura=${usage.inputTokenDetails?.cacheReadTokens ?? 0} salida=${usage.outputTokens}`,
      );
      if (text.trim()) {
        await db.insert(chatMensajes).values({ empresaId: sesion.empresaId, idCompra, rol: 'assistant', contenido: text });
      }
    },
  });

  return resultado.toUIMessageStreamResponse({
    onError: (error) => {
      console.error('[chat-pliego]', error);
      return 'No pudimos responder ahora. Probá de nuevo en unos segundos.';
    },
  });
}

/**
 * GET ?idCompra=X → historial del chat + qué archivos del pliego se leyeron.
 * GET ?idCompra=X&archivo=Y&p=N → texto del párrafo citado.
 */
export async function GET(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: 'Tu sesión venció. Ingresá de nuevo.' }, { status: 401 });

  const parametros = new URL(request.url).searchParams;
  const idCompra = parametros.get('idCompra');
  if (!idCompra) return Response.json({ error: 'Falta la licitación.' }, { status: 400 });

  const archivo = parametros.get('archivo');
  const numero = Number(parametros.get('p'));
  if (archivo && Number.isInteger(numero) && numero > 0) {
    const parrafo = await buscarParrafo(idCompra, archivo, numero);
    return Response.json({ texto: parrafo?.texto ?? null, archivo: parrafo?.archivo ?? null });
  }

  const [contexto, historial] = await Promise.all([
    resumenContextoPliego(idCompra),
    db
      .select()
      .from(chatMensajes)
      .where(and(eq(chatMensajes.empresaId, sesion.empresaId), eq(chatMensajes.idCompra, idCompra)))
      .orderBy(asc(chatMensajes.createdAt), asc(chatMensajes.id)),
  ]);
  if (!contexto) return Response.json({ error: 'No encontramos esa licitación.' }, { status: 404 });

  const mensajes: UIMessage[] = historial.map((m) => ({
    id: `db-${m.id}`,
    role: m.rol === 'assistant' ? 'assistant' : 'user',
    parts: [{ type: 'text', text: m.contenido }],
  }));

  return Response.json({
    mensajes,
    basadoEn: contexto.basadoEn,
    archivos: contexto.archivos,
    omitidos: contexto.omitidos,
    emailContacto: contexto.emailContacto,
  });
}

function textoDe(mensaje: UIMessage) {
  return mensaje.parts
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
    .trim();
}
