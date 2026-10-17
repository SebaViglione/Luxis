import { obtenerSesion } from '@/server/auth/sesion';

/**
 * empresaId del usuario logueado para las rutas de API de seba.
 * Usa obtenerSesion (rafa): valida el JWT localmente con getClaims, sin ida y vuelta a Supabase Auth.
 */
export async function empresaIdActual(): Promise<string | null> {
  const s = await obtenerSesion();
  return s?.empresaId ?? null;
}
