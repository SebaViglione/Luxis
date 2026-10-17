import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });
config();

/** Extensiones e índices que drizzle-kit no maneja. Se corre después de `db:push`. Idempotente. */
async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DIRECT_URL o DATABASE_URL en .env.local');
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    await sql`create extension if not exists pg_trgm`;
    await sql`create extension if not exists vector`;
    await sql`create index if not exists adjudicaciones_desc_trgm_idx on adjudicaciones using gin (desc_normalizada gin_trgm_ops)`;
    await sql`create index if not exists licitacion_items_desc_trgm_idx on licitacion_items using gin (desc_normalizada gin_trgm_ops)`;
    // RLS en todas las tablas (sin políticas): la API REST de Supabase con la anon key no devuelve nada.
    // La app entra como postgres por DATABASE_URL y no se ve afectada.
    await sql`do $$ declare t record; begin
      for t in select tablename from pg_tables where schemaname = 'public' loop
        execute format('alter table public.%I enable row level security', t.tablename);
      end loop; end $$`;
    const t = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
    console.log(`✓ pg_trgm e índices listos. ${t.length} tablas: ${t.map((x) => x.table_name).join(', ')}`);
  } finally {
    await sql.end();
  }
}
main().catch((e) => { console.error('✗', e.message); process.exit(1); });
