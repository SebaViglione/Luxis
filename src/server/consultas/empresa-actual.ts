import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';

/**
 * empresaId del usuario logueado, para las rutas de seba.
 * Mínimo e independiente de src/server/auth/sesion.ts (rafa); cuando exista, se puede reemplazar por obtenerSesion().
 */
export async function empresaIdActual(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: { getAll: () => store.getAll(), setAll: () => {} },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const [p] = await db.select({ empresaId: schema.perfilesUsuario.empresaId }).from(schema.perfilesUsuario).where(eq(schema.perfilesUsuario.id, data.user.id));
  return p?.empresaId ?? null;
}
