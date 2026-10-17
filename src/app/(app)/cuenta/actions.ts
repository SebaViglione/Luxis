'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/db';
import { perfilesUsuario } from '@/db/schema';
import type { PerfilEmpresa } from '@/lib/types';
import { crearClienteAdmin, crearClienteServidor } from '@/lib/supabase/server';
import { erroresDeCampos, mensajeErrorAuth } from '@/server/auth/formularios';
import { RUTAS } from '@/server/auth/rutas';
import { obtenerSesion } from '@/server/auth/sesion';
import { guardarPerfil } from '@/server/onboarding/guardar-perfil';
import { calcularFaltantes, esquemaPerfilEmpresa } from '@/server/onboarding/perfil';
import type { ResultadoAccion } from '@/server/onboarding/tipos';

const SESION_VENCIDA = { ok: false, error: 'Tu sesión venció. Ingresá de nuevo.' } as const;

const esquemaUsuario = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre.').max(120),
  email: z.email('Ingresá un email válido.').trim().toLowerCase(),
});

const esquemaContrasena = z
  .object({
    actual: z.string().min(1, 'Ingresá tu contraseña actual.'),
    nueva: z.string().min(8, 'Contraseña mínima 8 caracteres.').max(72, 'Contraseña máxima 72 caracteres.'),
    confirmacion: z.string(),
  })
  .refine((d) => d.nueva === d.confirmacion, { message: 'Las contraseñas no coinciden.', path: ['confirmacion'] });

export async function actualizarUsuario(datos: z.input<typeof esquemaUsuario>): Promise<ResultadoAccion> {
  const sesion = await obtenerSesion();
  if (!sesion) return SESION_VENCIDA;

  const validados = esquemaUsuario.safeParse(datos);
  if (!validados.success) return { ok: false, error: 'Revisá los datos marcados.', errores: erroresDeCampos(validados.error) };
  const { nombre, email } = validados.data;

  const supabase = await crearClienteServidor();
  let mensaje = 'Datos actualizados.';
  let emailFinal = sesion.email;

  if (email !== sesion.email) {
    const { data, error } = await supabase.auth.updateUser({ email, data: { nombre } });
    if (error) return { ok: false, error: mensajeErrorAuth(error) };
    if (data.user?.email === email) emailFinal = email;
    else mensaje = 'Te mandamos un email para confirmar la nueva dirección. Hasta que lo confirmes seguís ingresando con la actual.';
  } else {
    await supabase.auth.updateUser({ data: { nombre } });
  }

  await db.update(perfilesUsuario).set({ nombre, email: emailFinal }).where(eq(perfilesUsuario.id, sesion.usuarioId));
  return { ok: true, datos: undefined, mensaje };
}

export async function cambiarContrasena(datos: z.input<typeof esquemaContrasena>): Promise<ResultadoAccion> {
  const sesion = await obtenerSesion();
  if (!sesion) return SESION_VENCIDA;

  const validados = esquemaContrasena.safeParse(datos);
  if (!validados.success) return { ok: false, error: 'Revisá los datos marcados.', errores: erroresDeCampos(validados.error) };

  const supabase = await crearClienteServidor();
  // Verificamos la contraseña actual antes de cambiarla.
  const { error: errorActual } = await supabase.auth.signInWithPassword({ email: sesion.email, password: validados.data.actual });
  if (errorActual) {
    return { ok: false, error: 'La contraseña actual no es correcta.', errores: { actual: ['La contraseña actual no es correcta.'] } };
  }

  const { error } = await supabase.auth.updateUser({ password: validados.data.nueva });
  if (error) return { ok: false, error: mensajeErrorAuth(error) };
  return { ok: true, datos: undefined, mensaje: 'Contraseña actualizada.' };
}

/** Guarda el perfil editado. Si el onboarding ya estaba completo, recalcula el matching. */
export async function guardarPerfilEmpresa(perfil: PerfilEmpresa): Promise<ResultadoAccion> {
  const sesion = await obtenerSesion();
  if (!sesion) return SESION_VENCIDA;

  const validado = esquemaPerfilEmpresa.safeParse(perfil);
  if (!validado.success) return { ok: false, error: 'Revisá los datos marcados.', errores: erroresDeCampos(validado.error) };

  try {
    const final = { ...validado.data, camposFaltantes: calcularFaltantes(validado.data) };
    await guardarPerfil(sesion.empresaId, final, { completo: sesion.estadoOnboarding === 'completo' });
  } catch (error) {
    console.error('[cuenta] guardarPerfilEmpresa', error);
    return { ok: false, error: 'No pudimos guardar los cambios. Probá de nuevo.' };
  }
  return { ok: true, datos: undefined, mensaje: 'Perfil guardado. Estamos recalculando tus licitaciones.' };
}

/**
 * Baja "soft": Supabase marca al usuario como eliminado (no puede volver a ingresar) pero
 * conservamos los datos de la empresa. Requiere SUPABASE_SERVICE_ROLE_KEY.
 */
export async function eliminarCuenta(): Promise<ResultadoAccion> {
  const sesion = await obtenerSesion();
  if (!sesion) return SESION_VENCIDA;

  try {
    const { error } = await crearClienteAdmin().auth.admin.deleteUser(sesion.usuarioId, true);
    if (error) throw error;
  } catch (error) {
    console.error('[cuenta] eliminarCuenta', error);
    return { ok: false, error: 'No pudimos eliminar la cuenta. Probá de nuevo más tarde.' };
  }

  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect(RUTAS.inicio);
}
