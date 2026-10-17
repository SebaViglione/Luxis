import { UA_NAVEGADOR } from './xml';

const MAX_BYTES = 40 * 1024 * 1024;

export interface Descarga { buffer: Buffer; contentType: string | null; nombreFinal: string }

/** Descarga un archivo de ARCE (u organismo) con headers de navegador, límite de tamaño y reintentos. */
export async function descargarArchivo(url: string, intentos = 2): Promise<Descarga> {
  let ultimo: unknown;
  for (let i = 1; i <= intentos; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 120_000);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA_NAVEGADOR, Referer: 'https://www.comprasestatales.gub.uy/consultas', 'Accept-Language': 'es-UY,es;q=0.9' },
        redirect: 'follow', signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const largo = Number(res.headers.get('content-length') ?? 0);
      if (largo > MAX_BYTES) throw new Error(`Archivo demasiado grande (${Math.round(largo / 1e6)} MB)`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_BYTES) throw new Error('Archivo demasiado grande');
      const nombreFinal = decodeURIComponent(new URL(res.url).pathname.split('/').pop() ?? 'archivo');
      return { buffer, contentType: res.headers.get('content-type'), nombreFinal };
    } catch (e) {
      ultimo = e;
      if (i < intentos) await new Promise((r) => setTimeout(r, 1500 * i));
    } finally { clearTimeout(t); }
  }
  throw new Error(`No se pudo descargar: ${(ultimo as Error)?.message}`);
}
