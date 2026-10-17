import { redirect } from 'next/navigation';
import { cache } from 'react';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearCuenta } from './cuenta';
import { RUTAS } from './rutas';

export interface Sesion {
  usuarioId: string;
  email: string;
  empresaId: string;
  estadoOnboarding: string;
}

/** Sesión actual (usuario + empresa) o null. Se memoiza por request. */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const metadata = (claims.user_metadata ?? {}) as { nombre?: string; empresa?: string };
  // crearCuenta devuelve la cuenta existente o la crea si el registro quedó a medias.
  const cuenta = await crearCuenta({
    usuarioId: claims.sub,
    email: claims.email ?? '',
    nombre: metadata.nombre ?? null,
    nombreEmpresa: metadata.empresa ?? null,
  });

  return {
    usuarioId: cuenta.usuarioId,
    email: claims.email ?? cuenta.email,
    empresaId: cuenta.empresaId,
    estadoOnboarding: cuenta.estadoOnboarding,
  };
});

/**
 * Igual que obtenerSesion, pero redirige a /login si no hay sesión y a /onboarding si el
 * onboarding no está completo (salvo que la página sea parte del onboarding).
 */
export async function requerirSesion(opciones: { permitirOnboardingIncompleto?: boolean } = {}): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect(RUTAS.login);
  if (!opciones.permitirOnboardingIncompleto && sesion.estadoOnboarding !== 'completo') redirect(RUTAS.onboarding);
  return sesion;
}
