import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });

/** Carga inicial: vectores de artículos y párrafos de pliegos ya procesados. Idempotente. */
const arg = (n: string) => process.argv.includes(`--${n}`);
async function main() {
  const { sql } = await import('drizzle-orm');
  const { db } = await import('@/db');
  const { sincronizarArticulos, indexarParrafos } = await import('@/server/ia/vectores');
  const { enParalelo } = await import('@/lib/ia/estructurado');
  if (!arg('solo-parrafos')) {
    const t = Date.now();
    const r = await sincronizarArticulos({ log: console.log });
    console.log(`✓ artículos: ${r.nuevos} nuevos (${Math.round((Date.now() - t) / 1000)} s)`);
  }
  if (!arg('solo-articulos')) {
    const ids = await db.execute<{ id_compra: string }>(sql`
      select distinct a.id_compra from licitacion_archivos a
      where a.estado_extraccion = 'ok' and not exists (select 1 from licitacion_parrafos p where p.id_compra = a.id_compra)`);
    console.log(`Licitaciones a fragmentar: ${ids.length}`);
    let n = 0; let total = 0;
    await enParalelo([...ids], 4, async (r) => {
      try { const x = await indexarParrafos(r.id_compra); total += x.parrafos; console.log(`  [${++n}/${ids.length}] ${r.id_compra}: ${x.parrafos} párrafos`); }
      catch (e) { console.log(`  [${++n}/${ids.length}] ${r.id_compra}: ✗ ${(e as Error).message.slice(0, 120)}`); }
    });
    console.log(`✓ párrafos: ${total}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error('✗', e); process.exit(1); });
