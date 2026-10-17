import { type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { scrapeDetalle, idDesdeUrl } from '@/server/arce/scraper';
import { upsertLlamados } from '@/server/arce/guardar';
import { procesarArchivos } from '@/server/arce/procesar-archivos';
import { analizarLicitacion } from '@/server/ia/analisis-pliego';
import { cargarPerfil, evaluarLicitacion } from '@/server/ia/matching';
import { calcularPrecios } from '@/server/ia/precio';
import { calcularGapParaMatch } from '@/server/ia/gap-documental';
import { empresaIdActual } from '@/server/consultas/empresa-actual';

export const maxDuration = 300;

/**
 * Analiza cualquier llamado de ARCE a partir de su URL o id.
 * Respuesta en streaming NDJSON: una línea por etapa { etapa, estado, mensaje } y al final { listo: true, idCompra } o { error }.
 * Etapas: buscando → archivos → analizando → matching → precios.
 */
export async function POST(req: NextRequest) {
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  const idCompra = url ? idDesdeUrl(url) : null;
  const empresaId = await empresaIdActual();
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
          const [existe] = await db.select({ id: schema.licitaciones.idCompra, items: schema.licitaciones.fuente }).from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra));
          if (!existe) await upsertLlamados([c]);
        });
        await etapa('archivos', 'Descargando y leyendo el pliego…', () => procesarArchivos(idCompra));
        await etapa('analizando', 'Analizando el pliego con IA…', () => analizarLicitacion(idCompra, { forzar: true }));
        if (empresaId) {
          await etapa('matching', 'Comparando con tus productos…', async () => {
            const perfil = await cargarPerfil(empresaId);
            if (perfil) await evaluarLicitacion(perfil, idCompra);
          });
        }
        await etapa('precios', 'Buscando precios históricos…', async () => {
          await calcularPrecios(idCompra);
          if (empresaId) await calcularGapParaMatch(empresaId, idCompra).catch(() => null);
        });
        enviar({ listo: true, idCompra });
      } catch (e) {
        enviar({ error: (e as Error).message });
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } });
}
