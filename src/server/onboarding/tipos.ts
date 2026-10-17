import type { PerfilEmpresa } from '@/lib/types';

/** Eventos NDJSON que emite POST /api/onboarding/extraer (uno por línea). */
export type EventoExtraccion =
  | { tipo: 'progreso'; mensaje: string }
  | { tipo: 'aviso'; mensaje: string }
  | { tipo: 'listo'; perfil: PerfilEmpresa }
  | { tipo: 'error'; mensaje: string };

/** Resultado de las server actions del onboarding y de la cuenta. */
export type ResultadoAccion<T = undefined> =
  | { ok: true; datos: T; mensaje?: string }
  | { ok: false; error: string; errores?: Record<string, string[] | undefined> };

/** Salida de la herramienta guardar_perfil de la entrevista. */
export interface ResultadoGuardarPerfil {
  listo: true;
  perfil: PerfilEmpresa;
}
