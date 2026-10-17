import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

/**
 * Único lugar donde se nombran modelos.
 * rápido  → matching, extracción estructurada masiva, explicaciones cortas.
 * fuerte  → chat con el pliego, entrevista, análisis on-demand.
 */
const proveedor = process.env.IA_PROVEEDOR ?? 'anthropic';

export const MODELOS = {
  anthropic: { rapido: 'claude-haiku-5-5', fuerte: 'claude-sonnet-5-5' },
  google: { rapido: 'gemini-2.5-flash', fuerte: 'gemini-2.5-pro' },
} as const;

const ids = proveedor === 'google' ? MODELOS.google : MODELOS.anthropic;

export const modeloRapido = proveedor === 'google' ? google(ids.rapido) : anthropic(ids.rapido);
export const modeloFuerte = proveedor === 'google' ? google(ids.fuerte) : anthropic(ids.fuerte);
export const nombreModeloRapido = `${proveedor}/${ids.rapido}`;
export const nombreModeloFuerte = `${proveedor}/${ids.fuerte}`;
