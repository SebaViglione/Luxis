import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });

/** Recalcula licitaciones.es_rubro con la lista actual de src/config/rubro-barraca.ts (no acumula valores viejos). */
async function main() {
  const { db, schema } = await import('@/db');
  const { eq, inArray } = await import('drizzle-orm');
  const { esRubro } = await import('@/server/arce/rubro');
  const lics = await db.select({ id: schema.licitaciones.idCompra, objeto: schema.licitaciones.objeto, antes: schema.licitaciones.esRubro }).from(schema.licitaciones);
  const items = await db.select({ id: schema.licitacionItems.idCompra, d: schema.licitacionItems.descArticulo }).from(schema.licitacionItems);
  const porLic = new Map<string, string[]>();
  for (const i of items) porLic.set(i.id, [...(porLic.get(i.id) ?? []), i.d]);
  const si: string[] = [], no: string[] = [];
  for (const l of lics) ((porLic.get(l.id) ?? []).some(esRubro) || esRubro(l.objeto) ? si : no).push(l.id);
  for (let k = 0; k < si.length; k += 500) await db.update(schema.licitaciones).set({ esRubro: true }).where(inArray(schema.licitaciones.idCompra, si.slice(k, k + 500)));
  for (let k = 0; k < no.length; k += 500) await db.update(schema.licitaciones).set({ esRubro: false }).where(inArray(schema.licitaciones.idCompra, no.slice(k, k + 500)));
  const antes = lics.filter((l) => l.antes).length;
  const salen = lics.filter((l) => l.antes && no.includes(l.id)).map((l) => l.id);
  const entran = lics.filter((l) => !l.antes && si.includes(l.id)).map((l) => l.id);
  console.log(`es_rubro: antes ${antes}, ahora ${si.length} · salen ${salen.length} · entran ${entran.length}`);
  if (entran.length) console.log('  entran:', entran.slice(0, 20).join(', '));
  void eq;
  process.exit(0);
}
main().catch((e) => { console.error('✗', e.message); process.exit(1); });
