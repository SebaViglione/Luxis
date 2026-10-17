import { generateText, Output, type LanguageModel } from 'ai';
import type { z } from 'zod';

export class IANoConfigurada extends Error {
  constructor() { super('Falta configurar la IA: agregá ANTHROPIC_API_KEY (o GOOGLE_GENERATIVE_AI_API_KEY con IA_PROVEEDOR=google) en .env.local'); }
}

export function verificarIA() {
  const prov = process.env.IA_PROVEEDOR ?? 'anthropic';
  const key = prov === 'google' ? process.env.GOOGLE_GENERATIVE_AI_API_KEY : process.env.ANTHROPIC_API_KEY;
  if (!key) throw new IANoConfigurada();
}

/** Salida estructurada validada con zod (AI SDK 7: generateText + Output.object). */
export async function generarObjeto<S extends z.ZodType>(opts: {
  modelo: LanguageModel; schema: S; system: string; prompt: string; maxOutputTokens?: number;
}): Promise<{ objeto: z.infer<S>; tokensEntrada: number; tokensSalida: number }> {
  verificarIA();
  const r = await generateText({
    model: opts.modelo,
    system: opts.system,
    prompt: opts.prompt,
    temperature: 0,
    maxOutputTokens: opts.maxOutputTokens ?? 4000,
    output: Output.object({ schema: opts.schema }),
  });
  return { objeto: r.output as z.infer<S>, tokensEntrada: r.usage?.inputTokens ?? 0, tokensSalida: r.usage?.outputTokens ?? 0 };
}

/** Ejecuta tareas con concurrencia limitada. */
export async function enParalelo<T, R>(items: T[], limite: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}
