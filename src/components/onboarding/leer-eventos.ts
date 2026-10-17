import type { EventoExtraccion } from '@/server/onboarding/tipos';

/**
 * POST a /api/onboarding/extraer y lectura del stream NDJSON de progreso.
 * Siempre termina con un evento `listo` o `error` (si el stream se corta, emite uno de error).
 */
export async function extraerDesdeFuentes(
  formData: FormData,
  alRecibir: (evento: EventoExtraccion) => void,
  signal?: AbortSignal,
): Promise<void> {
  let respuesta: Response;
  try {
    respuesta = await fetch('/api/onboarding/extraer', { method: 'POST', body: formData, signal });
  } catch {
    if (!signal?.aborted) alRecibir({ tipo: 'error', mensaje: 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.' });
    return;
  }

  if (!respuesta.ok || !respuesta.body) {
    const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null;
    alRecibir({ tipo: 'error', mensaje: cuerpo?.error ?? `El servidor respondió con un error (${respuesta.status}).` });
    return;
  }

  const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader();
  let pendiente = '';
  let terminado = false;

  try {
    while (true) {
      const { value, done } = await lector.read();
      if (done) break;
      pendiente += value;
      const lineas = pendiente.split('\n');
      pendiente = lineas.pop() ?? '';
      for (const linea of lineas) {
        if (!linea.trim()) continue;
        const evento = JSON.parse(linea) as EventoExtraccion;
        if (evento.tipo === 'listo' || evento.tipo === 'error') terminado = true;
        alRecibir(evento);
      }
    }
  } catch {
    // Se cortó la conexión a mitad del stream: lo reporta el bloque de abajo.
  }

  if (!terminado && !signal?.aborted) {
    alRecibir({ tipo: 'error', mensaje: 'Se cortó la conexión antes de terminar. Probá de nuevo.' });
  }
}
