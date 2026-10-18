import { sql, eq, and } from 'drizzle-orm';
import { embedTextos, embeddingsDisponibles } from '@/lib/ia/embeddings';
import { db, schema } from '@/db';
import { monedaDesdeId, type PrecioHistorico } from '@/lib/types';
import { TOLERANCIA_PRECIO } from '@/server/precios/atipicos';



function sugerir(n: number, p25: number | null, med: number | null): number | null {
  if (n < 2 || med === null) return null;
  if (n < 5 || p25 === null) return med;
  return (p25 + med) / 2;
}

const fmt = (v: number | null, moneda: string) =>
  v === null ? '—' : `${moneda === 'UYU' ? '$' : moneda === 'USD' ? 'US$' : moneda} ${v.toLocaleString('es-UY', { maximumFractionDigits: 2 })}`;

function explicar(p: Omit<PrecioHistorico, 'explicacion'>): string {
  if (p.n === 0) return 'No hay adjudicaciones de este artículo en los últimos 24 meses con la misma moneda y unidad. Cotizá con tu precio de lista.';
  if (p.n === 1) return `Solo hay 1 adjudicación comparable: ${p.ultimoGanador ?? 'un proveedor'} ganó a ${fmt(p.ultimoPrecio, p.moneda)} por ${p.unidad}. Muestra chica, tomalo como referencia.`;
  const rival = p.competidores[0];
  return `En ${p.n} adjudicaciones de los últimos 24 meses (sin IVA, por ${p.unidad}) el precio ganador estuvo entre ${fmt(p.p25, p.moneda)} y ${fmt(p.p75, p.moneda)}; el precio del medio fue ${fmt(p.mediana, p.moneda)}. ` +
    (p.precioSugerido !== null ? `Para quedar en la zona ganadora, apuntá a ${fmt(p.precioSugerido, p.moneda)}. ` : '') +
    (rival ? `El que más gana este artículo es ${rival.nombre} (${rival.vecesAdjudicado} ${rival.vecesAdjudicado === 1 ? "vez" : "veces"}).` : '');
}

type FilaPrecio = {
  nro_item: number; id_articulo: number; desc_articulo: string; desc_normalizada: string; id_moneda: number; unidad: string | null;
  n: number; p25: string | null; mediana: string | null; p75: string | null; minimo: string | null; maximo: string | null;
  ultimo_ganador: string | null; ultimo_precio: string | null; ultima_fecha: string | null;
  competidores: { nombre: string; nroDoc: string; vecesAdjudicado: number; vecesOferto: number }[] | null;
};

/** Distancia coseno máxima para considerar "el mismo artículo" (similitud ≥ 0,92). */
const DIST_MAX = 0.08;

/**
 * Precio ganador histórico para todos los ítems de una licitación en UNA consulta.
 * Comparables: mismo código de artículo ∨ misma descripción ∨ descripciones vecinas por embedding (sim ≥ 0,92),
 * misma moneda y unidad, últimos 24 meses, sin IVA. Guarda en precios_sugeridos con un upsert multi-fila.
 */
export async function calcularPrecios(idCompra: string): Promise<PrecioHistorico[]> {
  // Asegurar que las descripciones de esta licitación tengan vector (1 pedido a Gemini si faltan).
  await sincronizarArticulosDeCompra(idCompra).catch(() => null);
  const filas = await db.execute<FilaPrecio>(sql`
    with it as (
      select i.nro_item, i.id_articulo, i.desc_articulo, i.desc_normalizada, coalesce(i.id_moneda_cotiz, 0) as mon,
             i.unidad, upper(coalesce(i.unidad, '')) as un
      from licitacion_items i where i.id_compra = ${idCompra}
    ),
    sim as (
      select it.nro_item, n.d2
      from it join articulos_vec v on v.desc_normalizada = it.desc_normalizada
      cross join lateral (
        select v2.desc_normalizada as d2, v2.embedding <=> v.embedding as dist
        from articulos_vec v2 order by v2.embedding <=> v.embedding limit 40
      ) n
      where n.dist <= ${DIST_MAX}
    ),
    cand as (
      select it.nro_item, a.id from it join adjudicaciones a on it.id_articulo > 0 and a.id_articulo = it.id_articulo
      union select it.nro_item, a.id from it join adjudicaciones a on a.desc_normalizada = it.desc_normalizada
      union select s.nro_item, a.id from sim s join adjudicaciones a on a.desc_normalizada = s.d2
    ),
    comp_todo as materialized (
      select c.nro_item, a.precio_unit, a.fecha_pub_adj, a.nombre_comercial, a.nro_doc_prov, a.id_compra
      from cand c join adjudicaciones a on a.id = c.id join it on it.nro_item = c.nro_item
      where a.id_moneda = it.mon and a.precio_unit > 0 and a.id_compra <> ${idCompra}
        and a.fecha_pub_adj > now() - interval '24 months'
        and (it.un = '' or upper(coalesce(a.unidad, '')) = it.un)
    ),
    -- Sin precios atípicos (src/server/precios/atipicos.ts): lejos del precio del medio del mismo ítem.
    medio as (select nro_item, percentile_cont(0.5) within group (order by precio_unit) as m from comp_todo group by nro_item),
    comp as materialized (
      select t.* from comp_todo t join medio on medio.nro_item = t.nro_item
      where t.precio_unit between medio.m / ${TOLERANCIA_PRECIO} and medio.m * ${TOLERANCIA_PRECIO}
    ),
    stats as (
      select nro_item, count(*)::int as n,
        percentile_cont(0.25) within group (order by precio_unit)::text as p25,
        percentile_cont(0.5) within group (order by precio_unit)::text as mediana,
        percentile_cont(0.75) within group (order by precio_unit)::text as p75,
        min(precio_unit)::text as minimo, max(precio_unit)::text as maximo
      from comp group by nro_item
    ),
    ultimo as (
      select distinct on (nro_item) nro_item, nombre_comercial, precio_unit::text as precio, fecha_pub_adj::text as fecha
      from comp order by nro_item, fecha_pub_adj desc
    ),
    rivales as (
      select nro_item, nro_doc_prov, max(nombre_comercial) as nombre, count(*)::int as adj,
             row_number() over (partition by nro_item order by count(*) desc) as rk
      from comp where nro_doc_prov is not null group by nro_item, nro_doc_prov
    ),
    ofertas as (
      select r.nro_item, r.nro_doc_prov, count(distinct o.id_compra)::int as ofer
      from rivales r
      join (select distinct nro_item, id_compra from comp) cc on cc.nro_item = r.nro_item
      join oferentes o on o.id_compra = cc.id_compra and o.nro_doc_prov = r.nro_doc_prov
      where r.rk <= 3 group by r.nro_item, r.nro_doc_prov
    )
    select it.nro_item, it.id_articulo, it.desc_articulo, it.desc_normalizada, it.mon as id_moneda, it.unidad,
      coalesce(st.n, 0) as n, st.p25, st.mediana, st.p75, st.minimo, st.maximo,
      u.nombre_comercial as ultimo_ganador, u.precio as ultimo_precio, u.fecha as ultima_fecha,
      (select json_agg(json_build_object('nombre', r.nombre, 'nroDoc', r.nro_doc_prov, 'vecesAdjudicado', r.adj,
                                          'vecesOferto', greatest(coalesce(o.ofer, 0), r.adj)) order by r.adj desc)
         from rivales r left join ofertas o on o.nro_item = r.nro_item and o.nro_doc_prov = r.nro_doc_prov
         where r.nro_item = it.nro_item and r.rk <= 3) as competidores
    from it left join stats st on st.nro_item = it.nro_item left join ultimo u on u.nro_item = it.nro_item
    order by it.nro_item`);

  const num = (v: string | null | undefined) => (v === null || v === undefined ? null : Number(v));
  const resultado: PrecioHistorico[] = [...filas].map((f) => {
    const p25 = num(f.p25), med = num(f.mediana);
    const sinExp: Omit<PrecioHistorico, 'explicacion'> = {
      nroItem: f.nro_item, idArticulo: f.id_articulo, descripcion: f.desc_articulo, moneda: monedaDesdeId(f.id_moneda), unidad: f.unidad?.trim() || 'unidad',
      n: f.n, p25, mediana: med, p75: num(f.p75), minimo: num(f.minimo), maximo: num(f.maximo),
      ultimoGanador: f.ultimo_ganador, ultimoPrecio: num(f.ultimo_precio), ultimaFecha: f.ultima_fecha,
      competidores: f.competidores ?? [], precioSugerido: sugerir(f.n, p25, med),
    };
    return { ...sinExp, explicacion: explicar(sinExp) };
  });

  if (resultado.length) {
    const s = (v: number | null) => (v === null ? null : String(v));
    const valores = resultado.map((p, i) => ({
      idCompra, nroItem: p.nroItem, idArticulo: p.idArticulo, descNormalizada: filas[i].desc_normalizada, idMoneda: filas[i].id_moneda,
      unidad: filas[i].unidad, n: p.n, p25: s(p.p25), mediana: s(p.mediana), p75: s(p.p75), minimo: s(p.minimo), maximo: s(p.maximo),
      ultimoGanador: p.ultimoGanador, ultimoPrecio: s(p.ultimoPrecio), ultimaFecha: p.ultimaFecha ? new Date(p.ultimaFecha) : null,
      competidores: p.competidores, precioSugerido: s(p.precioSugerido), explicacion: p.explicacion, createdAt: new Date(),
    }));
    await db.insert(schema.preciosSugeridos).values(valores).onConflictDoUpdate({
      target: [schema.preciosSugeridos.idCompra, schema.preciosSugeridos.nroItem],
      set: Object.fromEntries(['id_articulo', 'desc_normalizada', 'id_moneda', 'unidad', 'n', 'p25', 'mediana', 'p75', 'minimo', 'maximo',
        'ultimo_ganador', 'ultimo_precio', 'ultima_fecha', 'competidores', 'precio_sugerido', 'explicacion', 'created_at']
        .map((c) => [c.replace(/_([a-z])/g, (_, l) => l.toUpperCase()), sql.raw(`excluded.${c}`)])),
    });
  }
  return resultado;
}

/** Embebe las descripciones de ítems de una licitación que todavía no tienen vector. */
async function sincronizarArticulosDeCompra(idCompra: string) {
  if (!embeddingsDisponibles()) return;
  const faltan = await db.execute<{ d: string }>(sql`
    select distinct i.desc_normalizada as d from licitacion_items i
    where i.id_compra = ${idCompra} and i.desc_normalizada <> ''
      and not exists (select 1 from articulos_vec v where v.desc_normalizada = i.desc_normalizada)`);
  const descs = [...faltan].map((f) => f.d);
  if (!descs.length) return;
  const vecs = await embedTextos(descs, 'SEMANTIC_SIMILARITY');
  await db.insert(schema.articulosVec).values(descs.map((d, i) => ({ descNormalizada: d, embedding: vecs[i] }))).onConflictDoNothing();
}

export async function leerPrecios(idCompra: string): Promise<PrecioHistorico[]> {
  const filas = await db.select({ p: schema.preciosSugeridos, desc: schema.licitacionItems.descArticulo })
    .from(schema.preciosSugeridos)
    .leftJoin(schema.licitacionItems, and(eq(schema.licitacionItems.idCompra, schema.preciosSugeridos.idCompra), eq(schema.licitacionItems.nroItem, schema.preciosSugeridos.nroItem)))
    .where(eq(schema.preciosSugeridos.idCompra, idCompra)).orderBy(schema.preciosSugeridos.nroItem);
  const n = (v: string | null) => (v === null ? null : Number(v));
  return filas.map(({ p: f, desc }) => ({
    nroItem: f.nroItem, idArticulo: f.idArticulo, descripcion: desc ?? f.descNormalizada ?? '', moneda: monedaDesdeId(f.idMoneda), unidad: f.unidad ?? 'unidad',
    n: f.n, p25: n(f.p25), mediana: n(f.mediana), p75: n(f.p75), minimo: n(f.minimo), maximo: n(f.maximo),
    ultimoGanador: f.ultimoGanador, ultimoPrecio: n(f.ultimoPrecio), ultimaFecha: f.ultimaFecha?.toISOString() ?? null,
    competidores: f.competidores ?? [], precioSugerido: n(f.precioSugerido), explicacion: f.explicacion,
  }));
}
