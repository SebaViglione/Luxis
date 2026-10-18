// Historial de precios ganadores para el gráfico de "Ítems y precio" (solo lectura).
// Mismo criterio de comparables que calcularPrecios (src/server/ia/precio.ts) más un respaldo por trigramas.
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import type { Competidor, ItemLicitacion, ItemOfertable, Moneda, PrecioHistorico } from '@/lib/types';
import { normalizarTexto } from '@/server/arce/normalizar';
import { TOLERANCIA_PRECIO } from './atipicos';

export interface PuntoPrecio {
  fecha: string;
  precioUnit: number;
  ganador: string | null;
  nroDoc: string | null;
  cantidad: number | null;
  unidad: string | null;
  organismo: string | null;
  idCompra: string;
}

export interface ItemConsulta {
  nroItem: number;
  idArticulo: number;
  descripcion: string;
  unidad: string;
  moneda: Moneda;
}

export interface HistorialItem {
  nroItem: number;
  n: number;
  p25: number | null;
  mediana: number | null;
  p75: number | null;
  minimo: number | null;
  maximo: number | null;
  puntos: PuntoPrecio[];
  competidores: Competidor[];
}

const DIST_MAX = 0.08;
const SIMILITUD_MIN = 0.45;
const IDS_MONEDA: Record<Moneda, number[]> = { UYU: [0], USD: [1, 2], UI: [4], UR: [5], OTRA: [0] };

type Fila = {
  nro_item: number; n: number; p25: string | null; mediana: string | null; p75: string | null; minimo: string | null; maximo: string | null;
  puntos: { fecha: string; precioUnit: string; ganador: string | null; nroDoc: string | null; cantidad: string | null; unidad: string | null; organismo: string | null; idCompra: string }[] | null;
  rivales: { nombre: string | null; nroDoc: string; veces: number }[] | null;
};

const num = (v: string | number | null | undefined) => (v === null || v === undefined ? null : Number(v));

function consultaHistorial(idCompra: string, items: ItemConsulta[], maxPuntos: number) {
  const valores = sql.join(items.map((i) => sql`(${i.nroItem}::int, ${i.idArticulo || 0}::int, ${normalizarTexto(i.descripcion)}::text,
    ${`{${IDS_MONEDA[i.moneda].join(',')}}`}::int[], ${(i.unidad ?? '').trim().toUpperCase()}::text)`), sql`, `);
  return sql`
    with it(nro_item, id_articulo, desc_normalizada, monedas, un) as (values ${valores}),
    sim as (
      select it.nro_item, n.d2
      from it join articulos_vec v on v.desc_normalizada = it.desc_normalizada
      cross join lateral (
        select v2.desc_normalizada as d2, v2.embedding <=> v.embedding as dist
        from articulos_vec v2 order by v2.embedding <=> v.embedding limit 40
      ) n
      where n.dist <= ${DIST_MAX}
    ),
    trg as (
      select it.nro_item, t.id
      from it cross join lateral (
        select a.id from adjudicaciones a
        where a.desc_normalizada % it.desc_normalizada and similarity(a.desc_normalizada, it.desc_normalizada) >= ${SIMILITUD_MIN}
      ) t
      where it.id_articulo = 0 and it.desc_normalizada <> ''
        and not exists (select 1 from articulos_vec v where v.desc_normalizada = it.desc_normalizada)
    ),
    cand as (
      select it.nro_item, a.id from it join adjudicaciones a on it.id_articulo > 0 and a.id_articulo = it.id_articulo
      union select it.nro_item, a.id from it join adjudicaciones a on a.desc_normalizada = it.desc_normalizada
      union select s.nro_item, a.id from sim s join adjudicaciones a on a.desc_normalizada = s.d2
      union select nro_item, id from trg
    ),
    comp_todo as materialized (
      select c.nro_item, a.precio_unit, a.fecha_pub_adj, a.nombre_comercial, a.nro_doc_prov, a.cant_adj, a.unidad, a.organismo, a.id_compra
      from cand c join adjudicaciones a on a.id = c.id join it on it.nro_item = c.nro_item
      where a.id_moneda = any(it.monedas) and a.precio_unit > 0 and a.id_compra <> ${idCompra}
        and a.fecha_pub_adj > now() - interval '24 months'
        and (it.un = '' or upper(coalesce(a.unidad, '')) = it.un)
    ),
    -- Mismo filtro de atípicos que calcularPrecios: lejos del precio del medio del mismo ítem.
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
    )
    select it.nro_item, coalesce(st.n, 0) as n, st.p25, st.mediana, st.p75, st.minimo, st.maximo,
      (select json_agg(json_build_object('fecha', p.fecha_pub_adj, 'precioUnit', p.precio_unit, 'ganador', p.nombre_comercial,
          'nroDoc', p.nro_doc_prov, 'cantidad', p.cant_adj, 'unidad', p.unidad, 'organismo', p.organismo, 'idCompra', p.id_compra) order by p.fecha_pub_adj)
        from (select * from comp c2 where c2.nro_item = it.nro_item order by c2.fecha_pub_adj desc limit ${maxPuntos}) p) as puntos,
      (select json_agg(json_build_object('nombre', r.nombre, 'nroDoc', r.nro_doc_prov, 'veces', r.veces) order by r.veces desc)
        from (select nro_doc_prov, max(nombre_comercial) as nombre, count(*)::int as veces from comp c3
              where c3.nro_item = it.nro_item and nro_doc_prov is not null group by nro_doc_prov order by count(*) desc limit 3) r) as rivales
    from it left join stats st on st.nro_item = it.nro_item`;
}

/** Serie de adjudicaciones comparables (últimos 24 meses, sin IVA) por ítem, en una sola consulta. */
export async function historialPrecios(idCompra: string, items: ItemConsulta[], { maxPuntos = 80 }: { maxPuntos?: number } = {}): Promise<Record<number, HistorialItem>> {
  if (!items.length) return {};
  const filas = await db.execute<Fila>(consultaHistorial(idCompra, items, maxPuntos));

  const resultado: Record<number, HistorialItem> = {};
  for (const f of filas) {
    resultado[f.nro_item] = {
      nroItem: f.nro_item, n: f.n, p25: num(f.p25), mediana: num(f.mediana), p75: num(f.p75), minimo: num(f.minimo), maximo: num(f.maximo),
      puntos: (f.puntos ?? []).map((p) => ({
        fecha: new Date(p.fecha).toISOString(), precioUnit: Number(p.precioUnit), ganador: p.ganador, nroDoc: p.nroDoc,
        cantidad: num(p.cantidad), unidad: p.unidad, organismo: p.organismo, idCompra: p.idCompra,
      })),
      competidores: (f.rivales ?? []).map((r) => ({ nombre: r.nombre ?? r.nroDoc, nroDoc: r.nroDoc, vecesAdjudicado: r.veces, vecesOferto: r.veces })),
    };
  }
  return resultado;
}

// Misma regla que sugerir() de src/server/ia/precio.ts.
function sugerir(n: number, p25: number | null, med: number | null): number | null {
  if (n < 2 || med === null) return null;
  if (n < 5 || p25 === null) return med;
  return (p25 + med) / 2;
}

const fmt = (v: number | null, moneda: Moneda) =>
  v === null ? '—' : `${moneda === 'UYU' ? '$' : moneda === 'USD' ? 'US$' : moneda} ${v.toLocaleString('es-UY', { maximumFractionDigits: 2 })}`;

/** PrecioHistorico para ítems que no están en precios_sugeridos (p. ej. ítems leídos del pliego). */
export function precioDesdeHistorial(item: ItemConsulta, h: HistorialItem | undefined): PrecioHistorico {
  const n = h?.n ?? 0;
  const ultimo = h?.puntos.at(-1) ?? null;
  const precioSugerido = sugerir(n, h?.p25 ?? null, h?.mediana ?? null);
  const unidad = item.unidad ? item.unidad.toLowerCase() : 'unidad';
  const rival = h?.competidores[0];
  const explicacion = n === 0
    ? 'No hay adjudicaciones comparables en los últimos 24 meses con la misma moneda y unidad. Cotizá con tu precio de lista.'
    : n === 1
      ? `Solo hay 1 adjudicación comparable: ${ultimo?.ganador ?? 'un proveedor'} ganó a ${fmt(ultimo?.precioUnit ?? null, item.moneda)} por ${unidad}. Muestra chica, tomalo como referencia.`
      : `En ${n} adjudicaciones comparables de los últimos 24 meses (sin IVA, por ${unidad}) el precio ganador estuvo entre ${fmt(h!.p25, item.moneda)} y ${fmt(h!.p75, item.moneda)}, con mediana ${fmt(h!.mediana, item.moneda)}. `
        + (precioSugerido !== null ? `Para quedar en la zona ganadora, apuntá a ${fmt(precioSugerido, item.moneda)}. ` : '')
        + (rival ? `El que más gana este artículo es ${rival.nombre} (${rival.vecesAdjudicado} ${rival.vecesAdjudicado === 1 ? 'vez' : 'veces'}).` : '');
  return {
    nroItem: item.nroItem, idArticulo: item.idArticulo, descripcion: item.descripcion, moneda: item.moneda, unidad,
    n, p25: h?.p25 ?? null, mediana: h?.mediana ?? null, p75: h?.p75 ?? null, minimo: h?.minimo ?? null, maximo: h?.maximo ?? null,
    ultimoGanador: ultimo?.ganador ?? null, ultimoPrecio: ultimo?.precioUnit ?? null, ultimaFecha: ultimo?.fecha ?? null,
    competidores: h?.competidores ?? [], precioSugerido, explicacion,
  };
}

const UNIDADES: [RegExp, string, number][] = [
  [/^m(?:3|³)$|^metros? cubicos?$/, 'M3', 1],
  [/^m(?:2|²)$|^metros? cuadrados?$/, 'M2', 1],
  [/^(?:m|mts?|metros?|ml)$/, 'M', 1],
  [/^(?:un|und|unid|unidad(?:es)?|u|uds?)$/, 'UNIDAD', 1],
  [/^(?:kg|kgs|kilos?|kilogramos?)$/, 'KG', 1],
  [/^(?:l|lt|lts|litros?)$/, 'L', 1],
  [/^bolsas?$/, 'BOLSA', 1],
  [/^millar(?:es)?$/, 'UNIDAD', 1000],
  [/^rollos?$/, 'ROLLO', 1],
  [/^pares?$/, 'PAR', 1],
  [/^cajas?$/, 'CAJA', 1],
  [/^(?:ton|tn|toneladas?)$/, 'TON', 1],
  [/^barras?$/, 'BARRA', 1],
  [/^latas?$/, 'LATA', 1],
  [/^tachos?$/, 'TACHO', 1],
];
const PALABRA_UNIDAD = '(m3|m³|m2|m²|metros? cúbicos?|metros? cuadrados?|mts?|metros?|ml|m|unidades|unidad|unid|und|uds?|un|u|kgs?|kilos?|kilogramos?|lts?|litros?|l|bolsas?|millar(?:es)?|rollos?|pares?|cajas?|toneladas?|ton|tn|barras?|latas?|tachos?)';
const AL_INICIO = new RegExp(`^\\s*(\\d+(?:[.,]\\d+)*)\\s*${PALABRA_UNIDAD}\\.?(?=\\s|$)\\s*(?:de\\s+)?(.*)$`, 'i');
const AL_FINAL = new RegExp(`^(.*?)\\s*\\(\\s*(\\d+(?:[.,]\\d+)*)\\s*${PALABRA_UNIDAD}\\.?\\s*\\)\\s*$`, 'i');
// "6 tirantes pino taeda", "1 ventana con reja": número suelto delante de un sustantivo = unidades (pero no "8 mm", "2 x 3").
const UNIDADES_SUELTAS = /^\s*(\d+)\s+(?!(?:mm|cm|x|pulg(?:adas)?)\b)([a-záéíóúñ].*)$/i;

function numeroUy(texto: string): number {
  // "1.500" son mil quinientos; "2,5" es dos y medio.
  if (/^\d{1,3}(\.\d{3})+$/.test(texto)) return Number(texto.replace(/\./g, ''));
  return Number(texto.replace(/\./g, '').replace(',', '.'));
}

function unidadArce(palabra: string): [string, number] {
  const clave = palabra.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.$/, '').trim();
  const hallada = UNIDADES.find(([rx]) => rx.test(clave));
  return hallada ? [hallada[1], hallada[2]] : ['', 1];
}

/** Moneda a partir del texto libre de condiciones del pliego ("Pesos uruguayos", "dólares americanos", "UI"…); null si no se reconoce. */
export function monedaDeTexto(texto: string | null | undefined): Moneda | null {
  if (!texto) return null;
  if (/d[oó]lar|\bUSD\b|U\$S|US\$/i.test(texto)) return 'USD';
  if (/unidad(?:es)? indexada|\bUI\b/i.test(texto)) return 'UI';
  if (/reajustable|\bUR\b/i.test(texto)) return 'UR';
  if (/peso|\bUYU\b|\$/i.test(texto)) return 'UYU';
  return null;
}

/** Ítems armados desde lo que leyó el análisis del pliego, para licitaciones sin ítems en ARCE (p. ej. Intendencia de Montevideo). */
export function itemsDesdeOfertables(ofertables: ItemOfertable[], moneda: Moneda): ItemLicitacion[] {
  return ofertables.map((o) => {
    const inicio = AL_INICIO.exec(o.descripcion);
    const final = inicio ? null : AL_FINAL.exec(o.descripcion);
    const suelta = inicio || final ? null : UNIDADES_SUELTAS.exec(o.descripcion);
    const [cantTexto, unidadTexto, resto] = inicio ? [inicio[1], inicio[2], inicio[3]]
      : final ? [final[2], final[3], final[1]]
      : suelta ? [suelta[1], 'unidad', suelta[2]]
      : [null, null, o.descripcion];
    const [unidad, factor] = unidadTexto ? unidadArce(unidadTexto) : ['', 1];
    const cantidad = cantTexto && unidad ? numeroUy(cantTexto) * factor : Number.NaN;
    const descripcion = (unidad ? resto : o.descripcion).trim() || o.descripcion;
    return { nroItem: o.nroItem, idArticulo: 0, descripcion, cantidad, unidad, moneda };
  });
}
