import { config } from 'dotenv';
config({ path: '.env.local' }); config();

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };

async function main() {
  const { ingestarAdjudicaciones } = await import('@/server/arce/ingesta');
  const desde = new Date(`${arg('desde') ?? '2024-01-01'}T00:00:00-03:00`);
  const hasta = arg('hasta') ? new Date(`${arg('hasta')}T23:59:59-03:00`) : new Date();
  console.log(`Ingesta de adjudicaciones del rubro: ${desde.toISOString().slice(0, 10)} → ${hasta.toISOString().slice(0, 10)}`);
  const r = await ingestarAdjudicaciones(desde, hasta, console.log, Number(arg('concurrencia') ?? 4));
  console.log(`✓ ${r.compras} compras con ítems del rubro, ${r.adjudicaciones} filas, ${r.oferentes} oferentes, ${r.errores} ventanas con error`);
  process.exit(0);
}
main().catch((e) => { console.error('✗', e); process.exit(1); });
