import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { chatMensajes } from '@/db/schema';
import { IANoConfigurada, verificarIA } from '@/lib/ia/estructurado';
import { modeloFuerte } from '@/lib/ia/modelos';
import { obtenerSesion } from '@/server/auth/sesion';
import { armarContextoPliego, buscarParrafo, instruccionesChatPliego } from '@/server/ia/chat-pliego';

export const maxDuration = 60;

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

  const contexto = await armarContextoPliego(idCompra);
  if (!contexto) return Response.json({ error: 'No encontramos esa licitación.' }, { status: 404 });

  const ultimo = messages[messages.length - 1];
  const pregunta = textoDe(ultimo);
  if (ultimo.role === 'user' && pregunta && trigger !== 'regenerate-message') {
    await db.insert(chatMensajes).values({ empresaId: sesion.empresaId, idCompra, rol: 'user', contenido: pregunta });
  }

  const resultado = streamText({
    model: modeloFuerte,
    temperature: 0,
    instructions: instruccionesChatPliego(contexto),
    messages: await convertToModelMessages(messages.slice(-MAX_MENSAJES_HISTORIAL)),
    onFinish: async ({ text, usage }) => {
      console.info(
        `[chat-pliego] ${idCompra} tokens entrada=${usage.inputTokens} cache_lectura=${usage.inputTokenDetails?.cacheReadTokens ?? 0} salida=${usage.outputTokens}`,
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
    const texto = await buscarParrafo(idCompra, archivo, numero);
    return Response.json({ texto });
  }

  const [contexto, historial] = await Promise.all([
    armarContextoPliego(idCompra),
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
