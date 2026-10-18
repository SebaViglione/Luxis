import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';
import { DIM_EMBEDDING } from '@/db/schema';

/**
 * Embeddings con Gemini (gemini-embedding-001, 768 dims). Independiente de IA_PROVEEDOR:
 * DeepSeek no tiene embeddings. Requiere GOOGLE_GENERATIVE_AI_API_KEY.
 */
export type TipoEmbedding = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY';
const MODELO = google.embedding('gemini-embedding-001');
const LOTE = 100;
const MAX_CHARS = 6000;

export function embeddingsDisponibles(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

/** Embeddings en lotes de 100 con reintentos (429/5xx). Devuelve un vector por texto, en el mismo orden. */
export async function embedTextos(textos: string[], tipo: TipoEmbedding, opts: { concurrencia?: number; onLote?: (hechos: number) => void } = {}): Promise<number[][]> {
  if (!textos.length) return [];
  const lotes: string[][] = [];
  for (let i = 0; i < textos.length; i += LOTE) lotes.push(textos.slice(i, i + LOTE).map((t) => t.slice(0, MAX_CHARS) || ' '));
  const salida: number[][][] = new Array(lotes.length);
  let k = 0; let hechos = 0;
  const trabajador = async () => {
    while (k < lotes.length) {
      const i = k++;
      for (let intento = 1; ; intento++) {
        try {
          const { embeddings } = await embedMany({
            model: MODELO, values: lotes[i], maxRetries: 0,
            providerOptions: { google: { outputDimensionality: DIM_EMBEDDING, taskType: tipo } },
          });
          salida[i] = embeddings;
          hechos += lotes[i].length; opts.onLote?.(hechos);
          break;
        } catch (e) {
          if (intento >= 8) throw e;
          // 429: respetar el "retry in Xs" que manda Gemini; otros errores: backoff exponencial.
          const espera = /retry in ([\d.]+)s/i.exec((e as Error).message)?.[1];
          await new Promise((r) => setTimeout(r, espera ? Number(espera) * 1000 + 500 : Math.min(30_000, 1500 * 2 ** (intento - 1))));
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(opts.concurrencia ?? 2, lotes.length) }, trabajador));
  return salida.flat();
}

/** Embedding de una consulta: un solo intento (sin backoff largo) porque se usa en tiempo real. `tipo` debe coincidir con el de los vectores guardados. */
export async function embedConsulta(texto: string, tipo: TipoEmbedding = 'RETRIEVAL_QUERY'): Promise<number[]> {
  const { embeddings } = await embedMany({
    model: MODELO, values: [texto.slice(0, MAX_CHARS)], maxRetries: 1,
    providerOptions: { google: { outputDimensionality: DIM_EMBEDDING, taskType: tipo } },
  });
  return embeddings[0];
}

/** Literal de pgvector para usar en SQL crudo: '[0.1,0.2,...]'. */
export const vectorSql = (v: number[]) => `[${v.join(',')}]`;
