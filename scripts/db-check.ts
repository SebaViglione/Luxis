import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('✗ Falta DATABASE_URL en .env.local');
    process.exit(1);
  }
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });
  try {
    const [{ ok }] = await sql`select 1 as ok`;
    const tablas = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`;
    console.log(`✓ Conexión OK (select ${ok}). Host: ${new URL(url).host}`);
    console.log(`✓ ${tablas.length} tablas: ${tablas.map((t) => t.table_name).join(', ') || '(ninguna todavía: seba corre db:push)'}`);
    for (const t of ['licitaciones', 'adjudicaciones', 'empresas', 'matches']) {
      if (tablas.some((x) => x.table_name === t)) {
        const [{ n }] = await sql.unsafe<{ n: string }[]>(`select count(*)::text as n from ${t}`);
        console.log(`  ${t}: ${n} filas`);
      }
    }
  } catch (e) {
    console.error('✗ No se pudo conectar:', (e as Error).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}
main();
