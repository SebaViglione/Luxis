import { after } from 'next/server';
import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { scrapeDetalle, idDesdeUrl } from '@/server/arce/scraper';
import { upsertLlamados } from '@/server/arce/guardar';
import { procesarArchivos } from '@/server/arce/procesar-archivos';
import { indexarParrafos } from '@/server/ia/vectores';
import { analizarLicitacion } from '@/server/ia/analisis-pliego';
import { cargarPerfil, evaluarLicitacion } from '@/server/ia/matching';
import { calcularPrecios } from '@/server/ia/precio';
import { calcularGapParaMatch } from '@/server/ia/gap-documental';
import { empresaIdActual } from '@/server/consultas/empresa-actual';

export const maxDuration = 300;
// ARCE corta conexiones desde datacenters de EE. UU.; São Paulo es la región de Vercel más cercana a Uruguay.
export const preferredRegion = 'gru1';

/**
 * Analiza cualquier llamado de ARCE a partir de su URL o id.
 * Respuesta en streaming NDJSON: una línea por etapa { etapa, estado, mensaje } y al final { listo: true, idCompra } o { error }.
 * Etapas: buscando → archivos → analizando → matching → precios.
 */
export async function POST(req: NextRequest) {
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  const idCompra = url ? idDesdeUrl(url) : null;
  const empresaId = await empresaIdActual();
  if (!empresaId) return Response.json({ error: 'Iniciá sesión para analizar licitaciones.' }, { status: 401 });
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const enviar = (o: object) => ctrl.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      const etapa = async <T,>(nombre: string, mensaje: string, fn: () => Promise<T>) => {
        enviar({ etapa: nombre, estado: 'en_curso', mensaje });
        const r = await fn();
        enviar({ etapa: nombre, estado: 'ok' });
        return r;
      };
      try {
        if (!idCompra) throw new Error('No reconozco esa URL. Pegá el link de un llamado de comprasestatales.gub.uy o su número de id.');
        await etapa('buscando', 'Buscando el llamado en ARCE…', async () => {
          const c = await scrapeDetalle(idCompra);
          if (!c) throw new Error('ARCE no tiene un llamado con ese id.');
          const [existe] = await db.select({ fuente: schema.licitaciones.fuente, objeto: schema.licitaciones.objeto }).from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra));
          // Nueva, o cargada antes por scraping con datos incompletos: guardar lo scrapeado ahora.
          if (!existe || (existe.fuente === 'scrape' && !existe.objeto)) await upsertLlamados([c]);
          if ((c.raw as { esAdjudicacion?: boolean }).esAdjudicacion) {
            enviar({ etapa: 'buscando', estado: 'aviso', mensaje: 'Esta publicación es una adjudicación: completamos los datos desde la compra original (ya cerrada).' });
          }
        });
        // Precios solo necesita los ítems: arranca ya, en paralelo con la lectura y el análisis del pliego.
        const precios = calcularPrecios(idCompra).catch(() => null);
        // Pliego ya leído y analizado (por el refresh, el análisis del detalle u otro usuario): se reutiliza. Rehacerlo tarda,
        // gasta IA y reemplazaba un análisis del modelo fuerte por uno del rápido. Si el pliego cambió, el upsert lo marca sin leer.
        const [previo] = await db.select({ leido: schema.licitaciones.archivosProcesados, basadoEn: schema.analisisLicitacion.basadoEn })
          .from(schema.licitaciones).leftJoin(schema.analisisLicitacion, eq(schema.analisisLicitacion.idCompra, schema.licitaciones.idCompra))
          .where(eq(schema.licitaciones.idCompra, idCompra));
        const yaAnalizada = !!previo?.leido && previo.basadoEn === 'pliego';
        if (yaAnalizada) {
          await etapa('archivos', 'El pliego ya estaba leído.', async () => {});
          await etapa('analizando', 'Ya lo habíamos analizado.', () => analizarLicitacion(idCompra));
        } else {
          await etapa('archivos', 'Descargando y leyendo el pliego…', () => procesarArchivos(idCompra, { indexarDespues: true }));
          // Párrafos + embeddings (para el chat de pliegos grandes) no frenan al usuario.
          after(() => indexarParrafos(idCompra).catch(() => null));
          await etapa('analizando', 'Analizando el pliego con IA…', () => analizarLicitacion(idCompra, { forzar: true }));
        }
        await etapa('matching', 'Comparando con tus productos…', async () => {
          const perfil = await cargarPerfil(empresaId);
          if (perfil) await evaluarLicitacion(perfil, idCompra, { sinExtras: true });
        });
        await etapa('precios', 'Buscando precios históricos…', async () => {
          await precios;
          await calcularGapParaMatch(empresaId, idCompra).catch(() => null);
        });
        enviar({ listo: true, idCompra });
      } catch (e) {
        const err = e as Error & { cause?: { code?: string; message?: string } };
        const causa = err.cause?.code ?? err.cause?.message;
        console.error('[analizar-url]', idCompra, err.message, causa ?? '');
        enviar({ error: /fetch failed|ECONNRESET|ETIMEDOUT|UND_ERR/i.test(`${err.message} ${causa}`)
          ? `No pudimos conectarnos con ARCE desde el servidor (${causa ?? err.message}). Probá de nuevo en un momento.`
          : err.message });
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } });
}
