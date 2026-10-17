import { sql, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { monedaDesdeId, type Competidor, type PrecioHistorico } from '@/lib/types';

const MESES = 24;
const SIMILITUD_MIN = 0.55;

type FilaStats = { n: number; p25: string | null; mediana: string | null; p75: string | null; minimo: string | null; maximo: string | null };

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
  return `En ${p.n} adjudicaciones de los últimos 24 meses (sin IVA, por ${p.unidad}) el precio ganador estuvo entre ${fmt(p.p25, p.moneda)} y ${fmt(p.p75, p.moneda)}, con mediana ${fmt(p.mediana, p.moneda)}. ` +
    (p.precioSugerido !== null ? `Para quedar en la zona ganadora, apuntá a ${fmt(p.precioSugerido, p.moneda)}. ` : '') +
    (rival ? `El que más gana este artículo es ${rival.nombre} (${rival.vecesAdjudicado} ${rival.vecesAdjudicado === 1 ? "vez" : "veces"}).` : '');
}

/** Precio ganador histórico para cada ítem de una licitación. Guarda en precios_sugeridos. */
export async function calcularPrecios(idCompra: string): Promise<PrecioHistorico[]> {
  const items = await db.select().from(schema.licitacionItems).where(eq(schema.licitacionItems.idCompra, idCompra));
  const resultado: PrecioHistorico[] = [];
  for (const it of items) {
    const idMoneda = it.idMonedaCotiz ?? 0;
    const unidad = it.unidad?.trim() || null;
    // Comparables: mismo artículo de catálogo, o descripción parecida si el ítem no tiene código.
    const filtroArticulo = it.idArticulo && it.idArticulo > 0
      ? sql`(a.id_articulo = ${it.idArticulo} or (a.id_articulo = 0 and similarity(a.desc_normalizada, ${it.descNormalizada}) >= ${SIMILITUD_MIN}))`
      : sql`similarity(a.desc_normalizada, ${it.descNormalizada}) >= ${SIMILITUD_MIN}`;
    const filtroUnidad = unidad ? sql`and upper(coalesce(a.unidad,'')) = upper(${unidad})` : sql``;
    const base = sql`from adjudicaciones a
      where ${filtroArticulo} and a.id_moneda = ${idMoneda} ${filtroUnidad}
        and a.precio_unit > 0 and a.fecha_pub_adj > now() - make_interval(months => ${MESES})
        and a.id_compra <> ${idCompra}`;

    const [st] = await db.execute<FilaStats>(sql`select count(*)::int as n,
        percentile_cont(0.25) within group (order by a.precio_unit)::text as p25,
        percentile_cont(0.5) within group (order by a.precio_unit)::text as mediana,
        percentile_cont(0.75) within group (order by a.precio_unit)::text as p75,
        min(a.precio_unit)::text as minimo, max(a.precio_unit)::text as maximo ${base}`);
    const [ult] = await db.execute<{ nombre: string | null; precio: string; fecha: string }>(sql`select a.nombre_comercial as nombre, a.precio_unit::text as precio, a.fecha_pub_adj::text as fecha ${base} order by a.fecha_pub_adj desc limit 1`);
    const comp = await db.execute<{ nombre: string; nro_doc: string; adj: number; ofer: number }>(sql`
      with c as (select a.id_compra, a.nro_doc_prov, a.nombre_comercial ${base})
      select max(c.nombre_comercial) as nombre, c.nro_doc_prov as nro_doc, count(*)::int as adj,
        (select count(distinct o.id_compra)::int from oferentes o where o.nro_doc_prov = c.nro_doc_prov and o.id_compra in (select id_compra from c)) as ofer
      from c where c.nro_doc_prov is not null group by c.nro_doc_prov order by adj desc limit 3`);

    const n = Number(st?.n ?? 0);
    const num = (v: string | null | undefined) => (v === null || v === undefined ? null : Number(v));
    const p25 = num(st?.p25), med = num(st?.mediana);
    const competidores: Competidor[] = [...comp].map((c) => ({ nombre: c.nombre, nroDoc: c.nro_doc, vecesAdjudicado: c.adj, vecesOferto: Math.max(c.ofer, c.adj) }));
    const sinExp: Omit<PrecioHistorico, 'explicacion'> = {
      nroItem: it.nroItem, idArticulo: it.idArticulo, descripcion: it.descArticulo, moneda: monedaDesdeId(idMoneda), unidad: unidad ?? 'unidad',
      n, p25, mediana: med, p75: num(st?.p75), minimo: num(st?.minimo), maximo: num(st?.maximo),
      ultimoGanador: ult?.nombre ?? null, ultimoPrecio: num(ult?.precio), ultimaFecha: ult?.fecha ?? null,
      competidores, precioSugerido: sugerir(n, p25, med),
    };
    const p: PrecioHistorico = { ...sinExp, explicacion: explicar(sinExp) };
    resultado.push(p);

    const s = (v: number | null) => (v === null ? null : String(v));
    const fila = {
      idCompra, nroItem: p.nroItem, idArticulo: p.idArticulo, descNormalizada: it.descNormalizada, idMoneda, unidad,
      n, p25: s(p.p25), mediana: s(p.mediana), p75: s(p.p75), minimo: s(p.minimo), maximo: s(p.maximo),
      ultimoGanador: p.ultimoGanador, ultimoPrecio: s(p.ultimoPrecio), ultimaFecha: p.ultimaFecha ? new Date(p.ultimaFecha) : null,
      competidores, precioSugerido: s(p.precioSugerido), explicacion: p.explicacion,
    };
    await db.insert(schema.preciosSugeridos).values(fila).onConflictDoUpdate({
      target: [schema.preciosSugeridos.idCompra, schema.preciosSugeridos.nroItem], set: { ...fila, createdAt: new Date() },
    });
  }
  return resultado;
}

export async function leerPrecios(idCompra: string): Promise<PrecioHistorico[]> {
  const filas = await db.select().from(schema.preciosSugeridos).where(eq(schema.preciosSugeridos.idCompra, idCompra)).orderBy(schema.preciosSugeridos.nroItem);
  const items = await db.select({ nroItem: schema.licitacionItems.nroItem, desc: schema.licitacionItems.descArticulo }).from(schema.licitacionItems).where(eq(schema.licitacionItems.idCompra, idCompra));
  const desc = new Map(items.map((i) => [i.nroItem, i.desc]));
  const n = (v: string | null) => (v === null ? null : Number(v));
  return filas.map((f) => ({
    nroItem: f.nroItem, idArticulo: f.idArticulo, descripcion: desc.get(f.nroItem) ?? f.descNormalizada ?? '', moneda: monedaDesdeId(f.idMoneda), unidad: f.unidad ?? 'unidad',
    n: f.n, p25: n(f.p25), mediana: n(f.mediana), p75: n(f.p75), minimo: n(f.minimo), maximo: n(f.maximo),
    ultimoGanador: f.ultimoGanador, ultimoPrecio: n(f.ultimoPrecio), ultimaFecha: f.ultimaFecha?.toISOString() ?? null,
    competidores: f.competidores ?? [], precioSugerido: n(f.precioSugerido), explicacion: f.explicacion,
  }));
}
