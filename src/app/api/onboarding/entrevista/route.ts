import { convertToModelMessages, isStepCount, streamText, type UIMessage } from 'ai';
import { modeloFuerte } from '@/lib/ia/modelos';
import { IANoConfigurada, verificarIA } from '@/lib/ia/estructurado';
import { obtenerSesion } from '@/server/auth/sesion';
import { herramientasEntrevista, promptEntrevista } from '@/server/ia/perfil';
import { MAX_PREGUNTAS_ENTREVISTA } from '@/server/onboarding/constantes';
import { guardarPerfil, leerPerfil } from '@/server/onboarding/guardar-perfil';
import { fusionarPerfil } from '@/server/onboarding/perfil';

export const maxDuration = 60;

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

  const perfil = await leerPerfil(sesion.empresaId);
  const preguntasHechas = Math.min(messages.filter((m) => m.role === 'assistant').length, MAX_PREGUNTAS_ENTREVISTA);

  const resultado = streamText({
    model: modeloFuerte,
    instructions: promptEntrevista(perfil, preguntasHechas),
    messages: await convertToModelMessages(messages),
    tools: herramientasEntrevista(async (datos) => {
      // Releemos por si el perfil cambió durante la conversación.
      const actualizado = fusionarPerfil(await leerPerfil(sesion.empresaId), datos);
      await guardarPerfil(sesion.empresaId, actualizado, { completo: false });
      return actualizado;
    }),
    // Paso 1: pregunta o guarda. Paso 2 (solo si guardó): despedida, sin herramientas.
    // No se fuerza tool_choice: DeepSeek en modo thinking lo rechaza. El cierre lo pide el prompt
    // y, si el modelo no guarda, la UI arma el perfil desde la transcripción.
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
