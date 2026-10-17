import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };

/** Procesa archivos (si falta) y analiza el pliego de todas las licitaciones abiertas del rubro sin análisis. */
async function main() {
  const { db } = await import('@/db');
  const { sql } = await import('drizzle-orm');
  const { procesarArchivos } = await import('@/server/arce/procesar-archivos');
  const { analizarLicitacion } = await import('@/server/ia/analisis-pliego');
  const { enParalelo, verificarIA } = await import('@/lib/ia/estructurado');
  verificarIA();
  const filas = await db.execute<{ id_compra: string; procesados: boolean }>(sql`
    select l.id_compra, l.archivos_procesados as procesados from licitaciones l left join analisis_licitacion a using (id_compra)
    where l.es_rubro and l.fecha_tope_ofertas > now() and a.id_compra is null
    order by l.fecha_tope_ofertas limit ${Number(arg('limite') ?? 100)}`);
  console.log(`Analizando ${filas.length} licitaciones`);
  let i = 0;
  await enParalelo([...filas], Number(arg('concurrencia') ?? 3), async (f) => {
    try {
      if (!f.procesados) await procesarArchivos(f.id_compra);
      const a = await analizarLicitacion(f.id_compra);
      console.log(`  [${++i}/${filas.length}] ${f.id_compra}: ${a.basadoEn} · confianza ${a.confianza} · ${a.requisitosDocumentales.length} requisitos · ${a.fechasClave.length} fechas`);
    } catch (e) { console.log(`  [${++i}/${filas.length}] ${f.id_compra}: ✗ ${(e as Error).message}`); }
  });
  process.exit(0);
}
main().catch((e) => { console.error('✗', (e as Error).message); process.exit(1); });
