import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { embedConsulta, embeddingsDisponibles, vectorSql } from '@/lib/ia/embeddings';
import { monedaDesdeId, type Moneda } from '@/lib/types';
import { normalizarTexto, urlDetalleCompra } from '@/server/arce/normalizar';
import { calcularPrecios, leerPrecios } from '@/server/ia/precio';

/**
 * Herramientas de solo lectura que expone el MCP de Luxis (`/api/mcp`) para que un agente externo
 * (Claude, ChatGPT, Claude Code) consulte la base de precios ganadores y las licitaciones de ARCE.
 * Datos públicos de ARCE: sin empresa, sin sesión, sin escrituras.
 */

export type MonedaConsulta = 'UYU' | 'USD' | 'UI';
const IDS_MONEDA: Record<MonedaConsulta, number[]> = { UYU: [0], USD: [1, 2], UI: [4] };

/** Distancia coseno máxima para "el mismo artículo" (sim ≥ 0,92) y para "artículos parecidos" (sim ≥ 0,82). */
const DIST_MISMO = 0.08;
const DIST_PARECIDO = 0.18;

// Misma regla que sugerir() de src/server/ia/precio.ts: mediana con pocas muestras, promedio p25–mediana con 5 o más.
function sugerir(n: number, p25: number | null, med: number | null): number | null {
  if (n < 2 || med === null) return null;
  if (n < 5 || p25 === null) return med;
  return (p25 + med) / 2;
}

const NOTA_PRECIOS = 'Precios unitarios SIN IVA de adjudicaciones publicadas por ARCE (comprasestatales.gub.uy). ARCE no publica ofertas perdedoras: es el precio al que se ganó, no una probabilidad de ganar. Las monedas no se convierten.';

export interface ConsultaPrecio {
  articulo: string;
  moneda?: MonedaConsulta;
  unidad?: string;
  meses?: number;
}

type FilaPrecio = {
  un: string | null; n: number | null; p25: number | null; mediana: number | null; p75: number | null; minimo: number | null; maximo: number | null;
  ultimas: { fecha: string; precioUnit: number; cantidad: number | null; ganador: string | null; organismo: string | null; idCompra: string }[] | null;
  competidores: { nombre: string | null; nroDoc: string; veces: number }[] | null;
  incluidas: { descripcion: string; distancia: number; via: string; adjudicaciones: number }[] | null;
};

/** Precio ganador histórico de un artículo descripto en texto libre, agrupado por unidad. */
export async function precioGanador(c: ConsultaPrecio) {
  const descNorm = normalizarTexto(c.articulo);
  if (!descNorm) return { error: 'Describí el artículo (por ejemplo "cemento portland", "arena gruesa", "chapa galvanizada").' };
  const moneda: MonedaConsulta = c.moneda ?? 'UYU';
  const meses = Math.min(Math.max(Math.round(c.meses ?? 24), 1), 36);
  const unidad = (c.unidad ?? '').trim().toUpperCase();

  // Vector de la consulta con el mismo taskType con que se guardaron los artículos (SEMANTIC_SIMILARITY).
  let vec: string | null = null;
  if (embeddingsDisponibles()) {
    try { vec = vectorSql(await embedConsulta(descNorm, 'SEMANTIC_SIMILARITY')); } catch { vec = null; }
  }

  const filas = await db.execute<FilaPrecio>(sql`
    with q as (
      select ${descNorm}::text as d, ${vec}::vector as v, ${`{${IDS_MONEDA[moneda].join(',')}}`}::int[] as monedas, ${unidad}::text as un, ${meses}::int as meses
    ),
    vecinos as (
      select v2.desc_normalizada, (v2.embedding <=> q.v)::float as dist
      from q, lateral (select desc_normalizada, embedding from articulos_vec order by embedding <=> q.v limit 40) v2
      where q.v is not null
    ),
    cand as (
      select q.d as desc_normalizada, 0::float as dist, 'exacta' as via from q
      union all
      select desc_normalizada, dist, case when dist <= ${DIST_MISMO} then 'mismo articulo' else 'parecido' end from vecinos where dist <= ${DIST_PARECIDO}
      union all
      -- Respaldo por trigramas cuando no hay vector de consulta (sin clave de Gemini).
      select a.desc_normalizada, 1 - similarity(a.desc_normalizada, q.d), 'texto' from q, lateral (
        select distinct desc_normalizada from adjudicaciones a where q.v is null and a.desc_normalizada % q.d and similarity(a.desc_normalizada, q.d) >= 0.45 limit 40
      ) a
    ),
    cands as (
      -- Si hay "mismo artículo", no mezclamos con los "parecidos" (distorsionan la banda).
      select desc_normalizada, min(dist) as dist, min(via) as via from cand
      where dist <= ${DIST_MISMO} or not exists (select 1 from cand c2 where c2.dist <= ${DIST_MISMO} and c2.via <> 'exacta' and exists (select 1 from adjudicaciones a where a.desc_normalizada = c2.desc_normalizada))
      group by desc_normalizada
    ),
    comp as materialized (
      select a.desc_normalizada, a.precio_unit, a.fecha_pub_adj, a.nombre_comercial, a.nro_doc_prov, a.cant_adj, a.unidad, a.organismo, a.id_compra
      from adjudicaciones a join cands c on c.desc_normalizada = a.desc_normalizada, q
      where a.id_moneda = any(q.monedas) and a.precio_unit > 0
        and a.fecha_pub_adj > now() - make_interval(months => q.meses)
        and (q.un = '' or upper(coalesce(a.unidad, '')) = q.un)
    ),
    grupos as (
      select upper(coalesce(unidad, '')) as un, count(*)::int as n,
        percentile_cont(0.25) within group (order by precio_unit)::float as p25,
        percentile_cont(0.5) within group (order by precio_unit)::float as mediana,
        percentile_cont(0.75) within group (order by precio_unit)::float as p75,
        min(precio_unit)::float as minimo, max(precio_unit)::float as maximo
      from comp group by 1 order by count(*) desc limit 4
    )
    select g.un, g.n, g.p25, g.mediana, g.p75, g.minimo, g.maximo,
      (select json_agg(json_build_object('fecha', x.fecha_pub_adj, 'precioUnit', x.precio_unit::float, 'cantidad', x.cant_adj::float,
          'ganador', x.nombre_comercial, 'organismo', x.organismo, 'idCompra', x.id_compra) order by x.fecha_pub_adj desc)
        from (select * from comp c where upper(coalesce(c.unidad, '')) = g.un order by c.fecha_pub_adj desc limit 8) x) as ultimas,
      (select json_agg(json_build_object('nombre', r.nombre, 'nroDoc', r.nro_doc_prov, 'veces', r.veces) order by r.veces desc)
        from (select nro_doc_prov, max(nombre_comercial) as nombre, count(*)::int as veces from comp c
              where upper(coalesce(c.unidad, '')) = g.un and nro_doc_prov is not null group by 1 order by 2 desc limit 5) r) as competidores,
      (select json_agg(json_build_object('descripcion', c.desc_normalizada, 'distancia', round(c.dist::numeric, 3), 'via', c.via,
          'adjudicaciones', (select count(*) from comp k where k.desc_normalizada = c.desc_normalizada)) order by c.dist)
        from cands c where exists (select 1 from adjudicaciones a where a.desc_normalizada = c.desc_normalizada)) as incluidas
    from (select 1) uno left join grupos g on true`);

  const base = filas[0];
  const incluidas = base?.incluidas ?? [];
  const grupos = [...filas].filter((f) => f.n !== null).map((f) => {
    const sugerido = sugerir(f.n ?? 0, f.p25, f.mediana);
    return {
      unidad: f.un || 'sin unidad', n: f.n, p25: f.p25, mediana: f.mediana, p75: f.p75, minimo: f.minimo, maximo: f.maximo,
      precioSugerido: sugerido,
      ultimasAdjudicaciones: (f.ultimas ?? []).map((u) => ({ ...u, url: urlDetalleCompra(u.idCompra) })),
      competidores: f.competidores ?? [],
    };
  });

  return {
    consulta: { articulo: c.articulo, descripcionNormalizada: descNorm, moneda, unidad: unidad || 'todas', meses },
    articulosIncluidos: incluidas,
    porUnidad: grupos,
    sinResultados: grupos.length === 0,
    nota: grupos.length ? NOTA_PRECIOS : `No encontramos adjudicaciones comparables en ${moneda} en los últimos ${meses} meses. Probá con otra descripción, otra moneda o más meses. ${NOTA_PRECIOS}`,
  };
}

export interface ConsultaLicitaciones {
  texto?: string;
  dias?: number;
  soloRubro?: boolean;
  limite?: number;
}

type FilaLicitacion = {
  id_compra: string; objeto: string | null; organismo: string | null; tipo_compra: string; num_compra: string | null; anio_compra: number | null;
  fecha_tope_ofertas: string | null; fecha_apertura: string | null; lugar_entrega: string | null; es_rubro: boolean;
  resumen: string | null; confianza: number | null; basado_en: string | null; items: number; items_muestra: string | null;
};

/** Licitaciones de ARCE con recepción de ofertas abierta, filtradas por texto libre. */
export async function buscarLicitaciones(c: ConsultaLicitaciones) {
  const limite = Math.min(Math.max(Math.round(c.limite ?? 15), 1), 50);
  const dias = c.dias ? Math.min(Math.max(Math.round(c.dias), 1), 120) : null;
  const soloRubro = c.soloRubro ?? true;
  const terminos = (c.texto ?? '').split(/\s+/).map((t) => t.trim()).filter((t) => t.length >= 3).slice(0, 6);
  const condTexto = terminos.length
    ? sql.join(terminos.map((t) => {
        const like = `%${t}%`, likeNorm = `%${normalizarTexto(t)}%`;
        return sql`(l.objeto ilike ${like} or l.organismo ilike ${like} or a.resumen ilike ${like} or a.que_piden ilike ${like}
          or exists (select 1 from licitacion_items i where i.id_compra = l.id_compra and i.desc_normalizada ilike ${likeNorm}))`;
      }), sql` and `)
    : sql`true`;

  const filas = await db.execute<FilaLicitacion>(sql`
    select l.id_compra, l.objeto, l.organismo, l.tipo_compra, l.num_compra, l.anio_compra, l.fecha_tope_ofertas, l.fecha_apertura, l.lugar_entrega, l.es_rubro,
      a.resumen, a.confianza, a.basado_en,
      (select count(*) from licitacion_items i where i.id_compra = l.id_compra)::int as items,
      (select string_agg(left(x.desc_articulo, 70), '; ' order by x.nro_item) from (select * from licitacion_items i where i.id_compra = l.id_compra order by nro_item limit 6) x) as items_muestra
    from licitaciones l left join analisis_licitacion a on a.id_compra = l.id_compra
    where l.fecha_tope_ofertas > now()
      and (${!soloRubro}::bool or l.es_rubro)
      and (${dias}::int is null or l.fecha_tope_ofertas < now() + make_interval(days => ${dias}::int))
      and ${condTexto}
    order by l.fecha_tope_ofertas limit ${limite}`);

  const ahora = Date.now();
  return {
    consulta: { texto: c.texto ?? '', dias, soloRubro, limite },
    total: filas.length,
    licitaciones: [...filas].map((f) => ({
      idCompra: f.id_compra, objeto: f.objeto, organismo: f.organismo, tipoCompra: f.tipo_compra,
      numero: f.num_compra && f.anio_compra ? `${f.num_compra}/${f.anio_compra}` : f.num_compra,
      cierraOfertas: f.fecha_tope_ofertas, diasParaCierre: f.fecha_tope_ofertas ? Math.max(0, Math.ceil((new Date(f.fecha_tope_ofertas).getTime() - ahora) / 86_400_000)) : null,
      apertura: f.fecha_apertura, lugarEntrega: f.lugar_entrega, delRubroBarraca: f.es_rubro,
      resumenIA: f.resumen, confianzaAnalisis: f.confianza, analisisBasadoEn: f.basado_en,
      cantidadItems: f.items, itemsMuestra: f.items_muestra, url: urlDetalleCompra(f.id_compra),
    })),
    nota: soloRubro
      ? 'Solo licitaciones del rubro materiales de construcción (filtro de Luxis). Pasá soloRubro=false para buscar en todas las abiertas.'
      : 'Todas las licitaciones abiertas ingestadas por Luxis (últimos 60 días de publicación).',
  };
}

/** Acepta un id de compra, una URL de ARCE o un texto con el id adentro. */
export function extraerIdCompra(entrada: string): string | null {
  const m = /(\d{5,})/.exec(entrada);
  return m ? m[1] : null;
}

/** Ficha completa de una licitación ingestada: datos, ítems, lectura del pliego por IA y precio ganador por ítem. */
export async function detalleLicitacion(entrada: string) {
  const idCompra = extraerIdCompra(entrada);
  if (!idCompra) return { error: 'Pasá el id de la compra (número) o la URL de ARCE.' };

  const [lic] = await db.execute<{
    id_compra: string; objeto: string | null; organismo: string | null; unidad_ejecutora: string | null; tipo_compra: string; subtipo_compra: string | null;
    num_compra: string | null; anio_compra: number | null; fecha_publicacion: string | null; fecha_tope_ofertas: string | null; fecha_apertura: string | null;
    fecha_sol_aclar: string | null; fecha_sol_prorr: string | null; fecha_tope_entrega: string | null; lugar_apertura: string | null; lugar_entrega: string | null;
    es_rubro: boolean; resumen: string | null; que_piden: string | null; requisitos: unknown; fechas_clave: unknown; condiciones: unknown; riesgos: string[] | null;
    confianza: number | null; basado_en: string | null; aclaraciones: number;
  }>(sql`
    select l.id_compra, l.objeto, l.organismo, l.unidad_ejecutora, l.tipo_compra, l.subtipo_compra, l.num_compra, l.anio_compra, l.fecha_publicacion,
      l.fecha_tope_ofertas, l.fecha_apertura, l.fecha_sol_aclar, l.fecha_sol_prorr, l.fecha_tope_entrega, l.lugar_apertura, l.lugar_entrega, l.es_rubro,
      a.resumen, a.que_piden, a.requisitos_documentales as requisitos, a.fechas_clave, a.condiciones, a.riesgos, a.confianza, a.basado_en,
      (select count(*) from licitacion_aclaraciones x where x.id_compra = l.id_compra)::int as aclaraciones
    from licitaciones l left join analisis_licitacion a on a.id_compra = l.id_compra
    where l.id_compra = ${idCompra}`);
  if (!lic) {
    return {
      error: `Luxis no tiene ingestada la compra ${idCompra}.`,
      sugerencia: 'En la app, "Analizar una licitación puntual" la trae de ARCE, lee el pliego y calcula precios en menos de un minuto.',
      url: urlDetalleCompra(idCompra),
    };
  }

  const [items, archivos] = await Promise.all([
    db.execute<{ nro_item: number; desc_articulo: string; cant_pedida: number | null; unidad: string | null; id_moneda_cotiz: number | null; variante: string | null; presentacion: string | null }>(sql`
      select nro_item, desc_articulo, cant_pedida::float, unidad, id_moneda_cotiz, variante, presentacion from licitacion_items where id_compra = ${idCompra} order by nro_item`),
    db.execute<{ nombre: string; categoria: string | null; estado_extraccion: string; url: string; caracteres: number | null }>(sql`
      select nombre, categoria, estado_extraccion, url, caracteres from licitacion_archivos where id_compra = ${idCompra} order by relevante desc, id`),
  ]);

  // Precios ya calculados; si nunca se calcularon y hay ítems, se calculan ahora (misma regla que /api/licitaciones/[id]/precio).
  let precios = await leerPrecios(idCompra);
  if (!precios.length && items.length) precios = await calcularPrecios(idCompra).catch(() => []);

  return {
    licitacion: {
      idCompra: lic.id_compra, objeto: lic.objeto, organismo: lic.organismo, unidadEjecutora: lic.unidad_ejecutora,
      tipoCompra: lic.tipo_compra, subtipo: lic.subtipo_compra, numero: lic.num_compra && lic.anio_compra ? `${lic.num_compra}/${lic.anio_compra}` : lic.num_compra,
      fechaPublicacion: lic.fecha_publicacion, cierraOfertas: lic.fecha_tope_ofertas, apertura: lic.fecha_apertura,
      consultasHasta: lic.fecha_sol_aclar, prorrogaHasta: lic.fecha_sol_prorr, entregaHasta: lic.fecha_tope_entrega,
      lugarApertura: lic.lugar_apertura, lugarEntrega: lic.lugar_entrega, delRubroBarraca: lic.es_rubro, aclaraciones: lic.aclaraciones,
      url: urlDetalleCompra(lic.id_compra),
    },
    items: [...items].map((i) => ({
      nroItem: i.nro_item, descripcion: i.desc_articulo, cantidad: i.cant_pedida, unidad: i.unidad, moneda: monedaDesdeId(i.id_moneda_cotiz) as Moneda,
      variante: i.variante, presentacion: i.presentacion,
    })),
    analisisIA: lic.resumen || lic.que_piden ? {
      resumen: lic.resumen, quePiden: lic.que_piden, requisitosDocumentales: lic.requisitos, fechasClave: lic.fechas_clave, condiciones: lic.condiciones,
      riesgos: lic.riesgos, confianza: lic.confianza, basadoEn: lic.basado_en,
      nota: lic.basado_en === 'metadata' ? 'Sin texto de pliego legible: el análisis se basa solo en los datos publicados y tiene confianza baja.' : 'Leído del pliego por IA; puede equivocarse, verificá en el original.',
    } : null,
    preciosGanadores: precios.map((p) => ({
      nroItem: p.nroItem, descripcion: p.descripcion, moneda: p.moneda, unidad: p.unidad, n: p.n, p25: p.p25, mediana: p.mediana, p75: p.p75,
      precioSugerido: p.precioSugerido, ultimoGanador: p.ultimoGanador, ultimoPrecio: p.ultimoPrecio, ultimaFecha: p.ultimaFecha, competidores: p.competidores, explicacion: p.explicacion,
    })),
    archivos: [...archivos].map((a) => ({ nombre: a.nombre, categoria: a.categoria, leido: a.estado_extraccion === 'ok', estado: a.estado_extraccion, caracteres: a.caracteres, url: a.url })),
    nota: NOTA_PRECIOS,
  };
}
