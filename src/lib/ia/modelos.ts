import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import type { LanguageModel } from 'ai';

/**
 * Único lugar donde se nombran modelos. IA_PROVEEDOR = anthropic | deepseek | google.
 * rápido → matching, extracción estructurada masiva, explicaciones cortas, entrevista del onboarding (dos pasos por turno).
 * fuerte → chat con el pliego, extracción del perfil, análisis on-demand.
 */
export type Proveedor = 'anthropic' | 'deepseek' | 'google';
export const proveedor = (process.env.IA_PROVEEDOR ?? 'anthropic') as Proveedor;

export const MODELOS = {
  anthropic: { rapido: 'claude-haiku-5-5', fuerte: 'claude-sonnet-5-5' },
  deepseek: { rapido: 'deepseek-v4-flash', fuerte: 'deepseek-v4-pro' },
  google: { rapido: 'gemini-2.5-flash', fuerte: 'gemini-2.5-pro' },
} as const;

export const CLAVE_POR_PROVEEDOR: Record<Proveedor, string> = {
  anthropic: 'ANTHROPIC_API_KEY', deepseek: 'DEEPSEEK_API_KEY', google: 'GOOGLE_GENERATIVE_AI_API_KEY',
};

const ids = MODELOS[proveedor] ?? MODELOS.anthropic;
const crear = (id: string): LanguageModel =>
  proveedor === 'google' ? google(id) : proveedor === 'deepseek' ? deepseek(id) : anthropic(id);

export const modeloRapido = crear(ids.rapido);
export const modeloFuerte = crear(ids.fuerte);
export const nombreModeloRapido = `${proveedor}/${ids.rapido}`;
export const nombreModeloFuerte = `${proveedor}/${ids.fuerte}`;
