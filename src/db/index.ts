import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL en .env.local');

// Reutilizar la conexión entre recargas en desarrollo.
const globalForDb = globalThis as unknown as { __luxisConn?: postgres.Sql };
const conn = globalForDb.__luxisConn ?? postgres(url, { prepare: false, max: 10, idle_timeout: 20 });
if (process.env.NODE_ENV !== 'production') globalForDb.__luxisConn = conn;

export const db = drizzle(conn, { schema });
export { schema };
