import { generateText, Output, type LanguageModel } from 'ai';
import type { z } from 'zod';
import { proveedor, CLAVE_POR_PROVEEDOR } from './modelos';

export class IANoConfigurada extends Error {
  constructor() { super(`Falta configurar la IA: agregá ${CLAVE_POR_PROVEEDOR[proveedor]} en .env.local (IA_PROVEEDOR=${proveedor}).`); this.name = 'IANoConfigurada'; }
}

export function verificarIA() {
  if (!process.env[CLAVE_POR_PROVEEDOR[proveedor]]) throw new IANoConfigurada();
}

/** Opciones por proveedor para extracción determinística (DeepSeek: sin "thinking" para que respete temperature 0). */
const OPCIONES_PROVEEDOR = proveedor === 'deepseek' ? { deepseek: { thinking: { type: 'disabled' as const } } } : undefined;

/** Tiempo máximo por intento: una llamada colgada no se come todo el tiempo de la función (300 s en Vercel). */
const TIMEOUT_MS = 120_000;

/** Salida estructurada validada con zod (AI SDK 7: generateText + Output.object). Reintenta una vez si el JSON no valida. */
export async function generarObjeto<S extends z.ZodType>(opts: {
  modelo: LanguageModel; schema: S; system: string; prompt: string; maxOutputTokens?: number; timeoutMs?: number;
}): Promise<{ objeto: z.infer<S>; tokensEntrada: number; tokensSalida: number }> {
  verificarIA();
  let ultimo: unknown;
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const r = await generateText({
        model: opts.modelo,
        system: opts.system,
        prompt: intento === 1 ? opts.prompt : `${opts.prompt}\n\nIMPORTANTE: respondé únicamente con JSON válido que cumpla el schema.`,
        temperature: 0,
        maxOutputTokens: opts.maxOutputTokens ?? 4000,
        output: Output.object({ schema: opts.schema }),
        providerOptions: OPCIONES_PROVEEDOR,
        timeout: opts.timeoutMs ?? TIMEOUT_MS,
      });
      return { objeto: r.output as z.infer<S>, tokensEntrada: r.usage?.inputTokens ?? 0, tokensSalida: r.usage?.outputTokens ?? 0 };
    } catch (e) {
      ultimo = e;
      if (!/No object generated|could not parse|did not match schema|validation/i.test((e as Error).message)) throw e;
    }
  }
  throw ultimo;
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
