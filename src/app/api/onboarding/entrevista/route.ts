import { convertToModelMessages, isStepCount, streamText, type UIMessage } from 'ai';
import { modeloRapido } from '@/lib/ia/modelos';
import { IANoConfigurada, verificarIA } from '@/lib/ia/estructurado';
import { obtenerSesion } from '@/server/auth/sesion';
import { herramientasEntrevista, promptEntrevista } from '@/server/ia/perfil';
import { ultimaAnotacion } from '@/server/onboarding/entrevista';
import { guardarPerfil, leerPerfil } from '@/server/onboarding/guardar-perfil';
import { fusionarPerfil } from '@/server/onboarding/perfil';

// Cada turno puede anotar la respuesta (herramienta) y después preguntar; al cerrar, guarda y se despide.
export const maxDuration = 120;

export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: 'Tu sesión venció. Ingresá de nuevo.' }, { status: 401 });

  try {
    verificarIA();
  } catch (error) {
    if (error instanceof IANoConfigurada) return Response.json({ error: error.message }, { status: 503 });
    throw error;
  }

  let messages: UIMessage[];
  try {
    ({ messages } = (await request.json()) as { messages: UIMessage[] });
    if (!Array.isArray(messages)) throw new Error('messages inválido');
  } catch {
    return Response.json({ error: 'Mensaje inválido.' }, { status: 400 });
  }

  // El perfil se relee en cada turno: las anotaciones anteriores ya están guardadas, así la agenda se achica sola.
  const perfil = await leerPerfil(sesion.empresaId);
  const preguntasHechas = messages.filter((m) => m.role === 'assistant').length;
  // Lo que no está en el perfil (temas preguntados sin dato, lo extraído para contradicciones) viaja en el historial.
  const anterior = ultimaAnotacion(messages);
  const estado = { tratados: anterior?.tratados ?? [], extraido: anterior?.extraido ?? {} };

  const tools = herramientasEntrevista({
    estado,
    preguntasHechas,
    alGuardar: async (datos) => {
      // Releemos por si el perfil cambió durante la conversación. La descripción que vino de los documentos no se pisa.
      const base = await leerPerfil(sesion.empresaId);
      const actualizado = fusionarPerfil(base, base.descripcion ? { ...datos, descripcion: undefined } : datos);
      await guardarPerfil(sesion.empresaId, actualizado, { completo: false });
      return actualizado;
    },
  });

  const resultado = streamText({
    // Modelo rápido: cada turno son dos pasos (anotar y preguntar) y con el fuerte tardaba 13-15 s; con el
    // rápido, 3 s, y en las pruebas siguió la agenda y las herramientas igual de bien.
    model: modeloRapido,
    instructions: promptEntrevista(perfil, { canal: 'chat', preguntasHechas, tratados: estado.tratados }),
    // Con `tools`, los resultados anteriores de la herramienta le llegan al modelo como el texto corto de toModelOutput.
    messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    // Paso 1: anota (herramienta) o pregunta. Paso 2 (solo si anotó): confirma y hace la siguiente pregunta,
    // o se despide si la herramienta dijo que terminó; sin herramientas.
    // No se fuerza tool_choice: DeepSeek en modo thinking lo rechaza. Si el modelo no anota ni cierra,
    // la UI arma el perfil desde la transcripción.
    stopWhen: isStepCount(2),
    // Respuestas de chat cortas: sin el razonamiento de DeepSeek V4 cada turno sale en pocos segundos.
    providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
    prepareStep: ({ stepNumber }) => (stepNumber > 0 ? { activeTools: [] } : {}),
  });

  return resultado.toUIMessageStreamResponse({
    onError: (error) => {
      console.error('[entrevista]', error);
      return 'Se cortó la conexión con la IA. Probá de nuevo.';
    },
  });
}
