import type { z } from 'zod';

/** Estado que devuelven las server actions de formularios (para useActionState). */
export interface EstadoFormulario {
  error?: string;
  exito?: string;
  errores?: Record<string, string[] | undefined>;
  valores?: Record<string, string>;
}

export const ESTADO_INICIAL: EstadoFormulario = {};

export function erroresDeCampos(error: z.ZodError): Record<string, string[]> {
  const errores: Record<string, string[]> = {};
  for (const problema of error.issues) {
    const campo = String(problema.path[0] ?? '_');
    (errores[campo] ??= []).push(problema.message);
  }
  return errores;
}

/** Valores del formulario como texto, para re-poblar los inputs si hay error (nunca contraseñas). */
export function valoresSinSecretos(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  formData.forEach((valor, clave) => {
    if (typeof valor === 'string' && !clave.toLowerCase().includes('contrasena')) valores[clave] = valor;
  });
  return valores;
}

/** Traduce errores de Supabase Auth a mensajes en español. */
export function mensajeErrorAuth(error: { code?: string; message: string; status?: number }): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email o contraseña incorrectos.';
    case 'user_already_exists':
    case 'email_exists':
      return 'El email ya está registrado. Probá ingresar o recuperar la contraseña.';
    case 'weak_password':
      return 'La contraseña es muy débil. Usá al menos 8 caracteres, mezclando letras y números.';
    case 'same_password':
      return 'La nueva contraseña tiene que ser distinta de la actual.';
    case 'email_not_confirmed':
      return 'Todavía no confirmaste tu email. Revisá tu casilla.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Hiciste demasiados intentos seguidos. Esperá un minuto y probá de nuevo.';
    case 'email_address_invalid':
      return 'El email no es válido.';
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'Tu sesión venció. Ingresá de nuevo.';
    default:
      return `No pudimos completar la operación (${error.message}). Probá de nuevo.`;
  }
}
