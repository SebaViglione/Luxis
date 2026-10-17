import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };

async function main() {
  const { db } = await import('@/db');
  const { sql } = await import('drizzle-orm');
  const { procesarArchivos } = await import('@/server/arce/procesar-archivos');
  const { enParalelo } = await import('@/lib/ia/estructurado');
  const ids = arg('id') ? [arg('id')!] : (await db.execute<{ id_compra: string }>(sql`
    select id_compra from licitaciones where es_rubro and not archivos_procesados and fecha_tope_ofertas > now()
    order by fecha_tope_ofertas limit ${Number(arg('limite') ?? 200)}`)).map((r) => r.id_compra);
  console.log(`Procesando archivos de ${ids.length} licitaciones`);
  let i = 0;
  await enParalelo(ids, Number(arg('concurrencia') ?? 3), async (id) => {
    try {
      const r = await procesarArchivos(id);
      console.log(`  [${++i}/${ids.length}] ${id}: ${r.archivos} archivos · ${r.ok} ok · ${r.noSoportados} no soportados · ${r.errores} errores`);
    } catch (e) { console.log(`  [${++i}/${ids.length}] ${id}: ✗ ${(e as Error).message}`); }
  });
  process.exit(0);
}
main().catch((e) => { console.error('✗', e); process.exit(1); });
