import type { PerfilEmpresa } from '@/lib/types';
import type { TemaEntrevista } from './constantes';

/** Eventos NDJSON que emite POST /api/onboarding/extraer (uno por línea). */
export type EventoExtraccion =
  | { tipo: 'progreso'; mensaje: string }
  | { tipo: 'aviso'; mensaje: string }
  // `extraido`: lo que salió de esta fuente antes de fusionar, para detectar contradicciones en el cliente.
  | { tipo: 'listo'; perfil: PerfilEmpresa; extraido?: Partial<PerfilEmpresa> }
  | { tipo: 'error'; mensaje: string };

/** Resultado de las server actions del onboarding y de la cuenta. */
export type ResultadoAccion<T = undefined> =
  | { ok: true; datos: T; mensaje?: string }
  | { ok: false; error: string; errores?: Record<string, string[] | undefined> };

/** Lo que la entrevista por chat ya anotó; viaja en el historial (salida de la última herramienta) para no depender de estado en el servidor. */
export interface EstadoEntrevista {
  /** Temas que ya se preguntaron y se anotaron o quedaron sin dato: no se vuelven a preguntar. */
  tratados: TemaEntrevista[];
  /** Todo lo que salió de la entrevista hasta ahora, antes de fusionar (para detectar contradicciones con los documentos). */
  extraido: Partial<PerfilEmpresa>;
}

/** Salida de la herramienta anotar_respuesta de la entrevista. */
export interface ResultadoAnotar extends EstadoEntrevista {
  terminada: boolean;
  pendientes: TemaEntrevista[];
  /** Qué preguntar a continuación; vacío si terminó. */
  siguiente?: string;
  /** Perfil final, solo cuando la entrevista terminó. */
  perfil?: PerfilEmpresa;
}
