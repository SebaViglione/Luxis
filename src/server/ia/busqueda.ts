import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { embedConsulta, embeddingsDisponibles, vectorSql } from '@/lib/ia/embeddings';

export interface ParrafoEncontrado {
  id: number;
  archivoId: number;
  archivoNombre: string;
  categoria: string;
  nroParrafo: number;
  texto: string;
  score: number;
  /** true si entró como vecino (±1) de un párrafo relevante, no por la búsqueda en sí. */
  vecino: boolean;
}

const STOP = new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'del', 'que', 'se', 'por', 'con', 'para', 'un', 'una', 'es', 'al', 'lo', 'como', 'hay', 'tengo', 'piden', 'cual', 'cuál', 'qué', 'que', 'me', 'mi', 'si', 'no', 'o']);

/** Consulta full-text con OR entre términos (las preguntas en lenguaje natural casi nunca matchean todos con AND). */
function consultaFullText(texto: string): string | null {
  const terminos = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  return terminos.length ? [...new Set(terminos)].slice(0, 12).join(' | ') : null;
}

/**
 * Búsqueda híbrida en los párrafos de una licitación: vectorial (Gemini, RETRIEVAL_QUERY) + full-text en español,
 * fusionadas con Reciprocal Rank Fusion. Agrega los párrafos vecinos (±1) de los mejores para dar contexto.
 * Si no hay embeddings disponibles, usa solo full-text.
 */
export async function buscarParrafos(idCompra: string, consulta: string, opts: { k?: number; vecinos?: boolean } = {}): Promise<ParrafoEncontrado[]> {
  const k = opts.k ?? 10;
  const ft = consultaFullText(consulta);
  let vec: string | null = null;
  if (embeddingsDisponibles()) {
    // Si Gemini tarda más de 3 s, seguimos solo con full-text (mejor una respuesta rápida que esperar).
    const limite = new Promise<null>((r) => setTimeout(() => r(null), 3000));
    try { const v = await Promise.race([embedConsulta(consulta), limite]); vec = v ? vectorSql(v) : null; } catch { vec = null; }
  }
  const filas = await db.execute<{ id: number; archivo_id: number; archivo_nombre: string; categoria: string; nro_parrafo: number; texto: string; score: number }>(sql`
    with v as (
      select id, row_number() over (order by embedding <=> ${vec}::vector) as r
      from licitacion_parrafos
      where id_compra = ${idCompra} and embedding is not null and ${vec}::text is not null
      order by embedding <=> ${vec}::vector limit 40
    ),
    f as (
      select p.id, row_number() over (order by ts_rank_cd(p.tsv, q) desc) as r
      from licitacion_parrafos p, to_tsquery('spanish', coalesce(${ft}, 'zzzz')) q
      where p.id_compra = ${idCompra} and ${ft}::text is not null and p.tsv @@ q
      order by ts_rank_cd(p.tsv, q) desc limit 40
    ),
    rrf as (
      select id, sum(1.0 / (60 + r)) as score from (select * from v union all select * from f) x
      group by id order by score desc limit ${k}
    )
    select p.id, p.archivo_id, p.archivo_nombre, p.categoria, p.nro_parrafo, p.texto, rrf.score::float as score
    from rrf join licitacion_parrafos p on p.id = rrf.id order by rrf.score desc`);
  const base: ParrafoEncontrado[] = [...filas].map((f) => ({
    id: f.id, archivoId: f.archivo_id, archivoNombre: f.archivo_nombre, categoria: f.categoria, nroParrafo: f.nro_parrafo, texto: f.texto, score: f.score, vecino: false,
  }));
  if (!base.length || opts.vecinos === false) return base;

  const vistos = new Set(base.map((p) => `${p.archivoId}:${p.nroParrafo}`));
  const pedidos = base.slice(0, 6).flatMap((p) => [[p.archivoId, p.nroParrafo - 1], [p.archivoId, p.nroParrafo + 1]])
    .filter(([a, n]) => n > 0 && !vistos.has(`${a}:${n}`));
  if (!pedidos.length) return base;
  const vecinos = await db.execute<{ id: number; archivo_id: number; archivo_nombre: string; categoria: string; nro_parrafo: number; texto: string }>(sql`
    select id, archivo_id, archivo_nombre, categoria, nro_parrafo, texto from licitacion_parrafos
    where (archivo_id, nro_parrafo) in (${sql.join(pedidos.map(([a, n]) => sql`(${a}, ${n})`), sql`, `)})`);
  return [...base, ...[...vecinos].map((f) => ({
    id: f.id, archivoId: f.archivo_id, archivoNombre: f.archivo_nombre, categoria: f.categoria, nroParrafo: f.nro_parrafo, texto: f.texto, score: 0, vecino: true,
  }))];
}

/** Un párrafo puntual para expandir una cita [archivo, pN], sin cargar todo el texto del archivo. */
export async function obtenerParrafo(idCompra: string, archivoNombre: string, nroParrafo: number) {
  const [f] = await db.execute<{ archivo_nombre: string; nro_parrafo: number; texto: string }>(sql`
    select archivo_nombre, nro_parrafo, texto from licitacion_parrafos
    where id_compra = ${idCompra} and nro_parrafo = ${nroParrafo}
      and (archivo_nombre = ${archivoNombre} or lower(archivo_nombre) = lower(${archivoNombre}) or archivo_nombre ilike ${'%' + archivoNombre + '%'})
    order by (archivo_nombre = ${archivoNombre}) desc limit 1`);
  return f ? { archivoNombre: f.archivo_nombre, nroParrafo: f.nro_parrafo, texto: f.texto } : null;
}

/** Resumen de archivos indexados (para la UI del chat, sin cargar texto). */
export async function resumenParrafos(idCompra: string) {
  return [...await db.execute<{ archivo_nombre: string; categoria: string; parrafos: number }>(sql`
    select archivo_nombre, categoria, count(*)::int as parrafos from licitacion_parrafos
    where id_compra = ${idCompra} group by archivo_nombre, categoria order by min(id)`)];
}
