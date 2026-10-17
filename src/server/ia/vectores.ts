import { sql, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { embedTextos, embeddingsDisponibles } from '@/lib/ia/embeddings';
import { dividirEnParrafos } from '@/server/ia/chat-pliego';

/** Embebe las descripciones de artículos que todavía no tienen vector (adjudicaciones + ítems). */
export async function sincronizarArticulos(opts: { limite?: number; log?: (m: string) => void } = {}) {
  if (!embeddingsDisponibles()) return { nuevos: 0 };
  const faltan = await db.execute<{ d: string }>(sql`
    select d from (
      select distinct desc_normalizada d from licitacion_items
      union select distinct desc_normalizada d from adjudicaciones
    ) x where d <> '' and not exists (select 1 from articulos_vec v where v.desc_normalizada = x.d)
    limit ${opts.limite ?? 100000}`);
  const descs = faltan.map((f) => f.d);
  if (!descs.length) return { nuevos: 0 };
  opts.log?.(`Artículos sin vector: ${descs.length}`);
  for (let i = 0; i < descs.length; i += 1000) {
    const tramo = descs.slice(i, i + 1000);
    const vecs = await embedTextos(tramo, 'SEMANTIC_SIMILARITY', { concurrencia: 5 });
    await db.insert(schema.articulosVec).values(tramo.map((d, j) => ({ descNormalizada: d, embedding: vecs[j] }))).onConflictDoNothing();
    opts.log?.(`  artículos ${Math.min(i + 1000, descs.length)}/${descs.length}`);
  }
  return { nuevos: descs.length };
}

/** Parte en párrafos (misma numeración que las citas del chat) y embebe los archivos relevantes de una licitación. */
export async function indexarParrafos(idCompra: string) {
  const archivos = await db.select({ id: schema.licitacionArchivos.id, nombre: schema.licitacionArchivos.nombre, categoria: schema.licitacionArchivos.categoria, texto: schema.licitacionArchivos.texto })
    .from(schema.licitacionArchivos)
    .where(sql`${schema.licitacionArchivos.idCompra} = ${idCompra} and ${schema.licitacionArchivos.estadoExtraccion} = 'ok' and ${schema.licitacionArchivos.texto} is not null`);
  if (archivos.length) await db.delete(schema.licitacionParrafos).where(inArray(schema.licitacionParrafos.archivoId, archivos.map((a) => a.id)));
  const filas = archivos.flatMap((a) => dividirEnParrafos(a.texto ?? '').map((texto, i) => ({
    archivoId: a.id, idCompra, archivoNombre: a.nombre, categoria: a.categoria, nroParrafo: i + 1, texto,
  })));
  if (!filas.length) return { parrafos: 0 };
  const vecs = embeddingsDisponibles()
    ? await embedTextos(filas.map((f) => `${f.archivoNombre}\n${f.texto}`), 'RETRIEVAL_DOCUMENT', { concurrencia: 4 })
    : [];
  for (let i = 0; i < filas.length; i += 300) {
    await db.insert(schema.licitacionParrafos)
      .values(filas.slice(i, i + 300).map((f, j) => ({ ...f, embedding: vecs[i + j] ?? null })))
      .onConflictDoNothing();
  }
  return { parrafos: filas.length, conVector: vecs.length };
}

export async function compraTieneParrafos(idCompra: string) {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.licitacionParrafos).where(eq(schema.licitacionParrafos.idCompra, idCompra));
  return (r?.n ?? 0) > 0;
}
