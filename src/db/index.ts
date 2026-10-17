import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DB = PostgresJsDatabase<typeof schema>;

// Conexión perezosa: no falla al importar (build sin .env), sí al primer uso.
const globalForDb = globalThis as unknown as { __luxisDb?: DB };

function crear(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL en .env.local');
  // idle_timeout menor al del pooler de Supabase (si no, reusa conexiones ya cortadas: ECONNRESET).
  const conn = postgres(url, { prepare: false, max: 10, idle_timeout: 30, max_lifetime: 60 * 10 });
  return drizzle(conn, { schema });
}

export function getDb(): DB {
  if (!globalForDb.__luxisDb) globalForDb.__luxisDb = crear();
  return globalForDb.__luxisDb;
}

export const db: DB = new Proxy({} as DB, {
  get(_t, prop) {
    const real = getDb();
    const v = Reflect.get(real as object, prop);
    return typeof v === 'function' ? v.bind(real) : v;
  },
});

export { schema };
