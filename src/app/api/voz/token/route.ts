import { obtenerSesion } from '@/server/auth/sesion';

/**
 * Token de conversación (WebRTC) para el agente privado de ElevenLabs.
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
    const respuesta = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { 'xi-api-key': apiKey }, signal: AbortSignal.timeout(10_000), cache: 'no-store' },
    );
    if (!respuesta.ok) {
      console.error('[voz] ElevenLabs respondió', respuesta.status, await respuesta.text().catch(() => ''));
      return Response.json({ error: 'Voz no disponible en este momento.' }, { status: 503 });
    }
    const { token } = (await respuesta.json()) as { token?: string };
    if (!token) return Response.json({ error: 'Voz no disponible en este momento.' }, { status: 503 });
    return Response.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[voz] token', error);
    return Response.json({ error: 'Voz no disponible en este momento.' }, { status: 503 });
  }
}
