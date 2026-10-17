'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearCuenta } from '@/server/auth/cuenta';
import {
  erroresDeCampos,
  mensajeErrorAuth,
  valoresSinSecretos,
  type EstadoFormulario,
} from '@/server/auth/formularios';
import { RUTAS, rutaInternaSegura } from '@/server/auth/rutas';

const email = z.email('Ingresá un email válido.').trim().toLowerCase();
const contrasena = z.string().min(8, 'Contraseña mínima 8 caracteres.').max(72, 'Contraseña máxima 72 caracteres.');

const esquemaIngreso = z.object({
  email,
  contrasena: z.string().min(1, 'Ingresá tu contraseña.'),
  siguiente: z.string().optional(),
});

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre.'),
  empresa: z.string().trim().min(2, 'Ingresá el nombre de tu empresa.'),
  email,
  contrasena,
});

const esquemaRecuperar = z.object({ email });

const esquemaNuevaContrasena = z
  .object({ contrasena, confirmacion: z.string() })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmacion'],
  });

export async function ingresar(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const datos = esquemaIngreso.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresDeCampos(datos.error), valores: valoresSinSecretos(formData) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: datos.data.email,
    password: datos.data.contrasena,
  });
  if (error) return { error: mensajeErrorAuth(error), valores: valoresSinSecretos(formData) };

  const metadata = (data.user.user_metadata ?? {}) as { nombre?: string; empresa?: string };
  const cuenta = await crearCuenta({
    usuarioId: data.user.id,
    email: data.user.email ?? datos.data.email,
    nombre: metadata.nombre ?? null,
    nombreEmpresa: metadata.empresa ?? null,
  });

  if (cuenta.estadoOnboarding !== 'completo') redirect(RUTAS.onboarding);
  redirect(rutaInternaSegura(datos.data.siguiente, RUTAS.dashboard));
}

export async function registrarse(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const datos = esquemaRegistro.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresDeCampos(datos.error), valores: valoresSinSecretos(formData) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: datos.data.email,
    password: datos.data.contrasena,
    options: { data: { nombre: datos.data.nombre, empresa: datos.data.empresa } },
  });
  if (error) return { error: mensajeErrorAuth(error), valores: valoresSinSecretos(formData) };
  if (!data.user) return { error: 'No pudimos crear la cuenta. Probá de nuevo.', valores: valoresSinSecretos(formData) };

  // Con "Confirm email" activado Supabase no devuelve sesión ni error para emails ya usados.
  if (!data.session) {
    if (data.user.identities?.length === 0) {
      return { error: mensajeErrorAuth({ code: 'user_already_exists', message: '' }), valores: valoresSinSecretos(formData) };
    }
    return { exito: 'Te mandamos un email para confirmar la cuenta. Después ingresá desde acá.' };
  }

  try {
    await crearCuenta({
      usuarioId: data.user.id,
      email: datos.data.email,
      nombre: datos.data.nombre,
      nombreEmpresa: datos.data.empresa,
    });
  } catch (e) {
    console.error('[registro] no se pudo crear la empresa', e);
    // La sesión ya existe: obtenerSesion() reintenta crear la empresa en el próximo request.
  }

  redirect(RUTAS.onboarding);
}

export async function recuperarContrasena(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const datos = esquemaRecuperar.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresDeCampos(datos.error), valores: valoresSinSecretos(formData) };

  const supabase = await crearClienteServidor();
  const origen = await origenApp();
  const destino = `${origen}${RUTAS.confirmarAuth}?siguiente=${encodeURIComponent(RUTAS.nuevaContrasena)}`;
  const { error } = await supabase.auth.resetPasswordForEmail(datos.data.email, { redirectTo: destino });

  // Por seguridad no revelamos si el email existe; solo mostramos errores de límite de envíos.
  if (error && (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit')) {
    return { error: mensajeErrorAuth(error), valores: valoresSinSecretos(formData) };
  }
  if (error) console.error('[recuperar]', error);

  return { exito: 'Si el email está registrado, te llega un link para crear una contraseña nueva. Abrilo en este mismo navegador.' };
}

export async function establecerNuevaContrasena(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const datos = esquemaNuevaContrasena.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { errores: erroresDeCampos(datos.error) };

  const supabase = await crearClienteServidor();
  const { data: sesion } = await supabase.auth.getClaims();
  if (!sesion?.claims) return { error: 'El link para cambiar la contraseña venció. Pedí uno nuevo desde "Recuperar contraseña".' };

  const { error } = await supabase.auth.updateUser({ password: datos.data.contrasena });
  if (error) return { error: mensajeErrorAuth(error) };

  redirect(RUTAS.onboarding);
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect(RUTAS.login);
}

async function origenApp() {
  const h = await headers();
  const origen = h.get('origin');
  if (origen) return origen;
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
