import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });
config();

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('Falta DIRECT_URL (o DATABASE_URL) en .env.local');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  verbose: true,
  strict: false,
});
