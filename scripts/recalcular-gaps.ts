import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });

/** Recalcula gap documental y estado de todos los matches con análisis (tras cambiar las reglas de plazos). */
async function main() {
  const { db } = await import('@/db'); const { sql } = await import('drizzle-orm');
  const { calcularGapParaMatch } = await import('@/server/ia/gap-documental');
  const { enParalelo } = await import('@/lib/ia/estructurado');
  const filas = await db.execute<{ empresa_id: string; id_compra: string }>(sql`
    select m.empresa_id, m.id_compra from matches m join analisis_licitacion a using (id_compra)`);
  let n = 0;
  await enParalelo([...filas], 8, async (f) => { await calcularGapParaMatch(f.empresa_id, f.id_compra).catch(() => null); n++; });
  const dist = await db.execute(sql`select estado_documental, count(*)::int from matches group by 1 order by 2 desc`);
  console.log(`✓ ${n} gaps recalculados`, [...dist]);
  process.exit(0);
}
main().catch((e) => { console.error('✗', e.message); process.exit(1); });
