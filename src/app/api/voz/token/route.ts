import { obtenerSesion } from '@/server/auth/sesion';
import { primerMensajeVoz, promptEntrevista } from '@/server/ia/perfil';
import { DURACION_MAXIMA_VOZ_S } from '@/server/onboarding/constantes';
import { leerPerfil } from '@/server/onboarding/guardar-perfil';

/**
 * Token de conversación (WebRTC) para el agente privado de ElevenLabs, con el prompt y el saludo
 * armados acá con el perfil guardado: las mismas reglas que la entrevista por chat.
 * La API key nunca sale del servidor.
 */
export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: 'Tu sesión venció. Ingresá de nuevo.' }, { status: 401 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return Response.json({ error: 'Voz no disponible en este momento.' }, { status: 503 });
  }

  try {
    const [respuesta, perfil] = await Promise.all([
      fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`, {
        headers: { 'xi-api-key': apiKey },
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      }),
      leerPerfil(sesion.empresaId),
    ]);
    if (!respuesta.ok) {
      console.error('[voz] ElevenLabs respondió', respuesta.status, await respuesta.text().catch(() => ''));
      return Response.json({ error: 'Voz no disponible en este momento.' }, { status: 503 });
    }
    const { token } = (await respuesta.json()) as { token?: string };
    if (!token) return Response.json({ error: 'Voz no disponible en este momento.' }, { status: 503 });
    return Response.json(
      {
        token,
        prompt: promptEntrevista(perfil, { canal: 'voz', minutos: DURACION_MAXIMA_VOZ_S / 60 }),
        primerMensaje: primerMensajeVoz(perfil),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[voz] token', error);
    return Response.json({ error: 'Voz no disponible en este momento.' }, { status: 503 });
  }
}
