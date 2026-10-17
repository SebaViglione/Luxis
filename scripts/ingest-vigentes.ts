import { config } from 'dotenv';
config({ path: '.env.local' }); config();

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };

async function main() {
  const { ingestarVigentes } = await import('@/server/arce/ingesta');
  const dias = Number(arg('dias') ?? 60);
  const hasta = new Date(); const desde = new Date(hasta.getTime() - dias * 864e5);
  console.log(`Ingesta de llamados vigentes: últimos ${dias} días`);
  const r = await ingestarVigentes(desde, hasta, console.log);
  console.log(`✓ ${r.compras} compras, ${r.items} ítems, ${r.rubro} del rubro`);
  process.exit(0);
}
main().catch((e) => { console.error('✗', e); process.exit(1); });
