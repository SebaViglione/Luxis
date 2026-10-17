import { and, desc, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import {
  ESTADOS_COMPRA, TIPOS_COMPRA, monedaDesdeId, confianzaEfectiva,
  type AnalisisPliego, type ArchivoLicitacion, type CategoriaArchivo, type DetalleLicitacion, type EstadoDocumental,
  type EstadoExtraccion, type EstadoUsuarioMatch, type FiltrosDashboard, type LicitacionCard,
} from '@/lib/types';
import { leerPrecios } from '@/server/ia/precio';
import { urlDetalleCompra, BASE_ARCE } from '@/server/arce/normalizar';

const DIA = 864e5;
/** Columnas de licitaciones que usa la UI (sin `raw`, que es jsonb grande). */
const COLS_LICITACION = {
    idCompra: schema.licitaciones.idCompra, tipoCompra: schema.licitaciones.tipoCompra, numCompra: schema.licitaciones.numCompra,
    anioCompra: schema.licitaciones.anioCompra, organismo: schema.licitaciones.organismo, unidadEjecutora: schema.licitaciones.unidadEjecutora,
    objeto: schema.licitaciones.objeto, estado: schema.licitaciones.estado, fechaPublicacion: schema.licitaciones.fechaPublicacion,
    fechaApertura: schema.licitaciones.fechaApertura, fechaTopeOfertas: schema.licitaciones.fechaTopeOfertas, fechaSolAclar: schema.licitaciones.fechaSolAclar,
    fechaSolProrr: schema.licitaciones.fechaSolProrr, fechaTopeEntrega: schema.licitaciones.fechaTopeEntrega, lugarApertura: schema.licitaciones.lugarApertura,
    lugarEntrega: schema.licitaciones.lugarEntrega, precioPliego: schema.licitaciones.precioPliego, nombreContacto: schema.licitaciones.nombreContacto,
    emailContacto: schema.licitaciones.emailContacto, urlDetalle: schema.licitaciones.urlDetalle, createdAt: schema.licitaciones.createdAt,
  };
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const numero = (l: { numCompra: string | null; anioCompra: number | null }) => `${l.numCompra ?? '?'}/${l.anioCompra ?? ''}`;

/** Confianza efectiva en SQL (mismos valores que AJUSTE_DOCUMENTAL en lib/types). */
const CONF_EF = sql`(${schema.matches.confianza} - case ${schema.matches.estadoDocumental} when 'dificil' then 25 when 'alcanzable' then 10 else 0 end)`;

/** Licitaciones con match para el dashboard. */
export async function listarMatches(empresaId: string, filtros: FiltrosDashboard = {}): Promise<LicitacionCard[]> {
  const L = schema.licitaciones, M = schema.matches, A = schema.analisisLicitacion;
  const estado = filtros.estado ?? 'nuevas';
  const conds = [eq(M.empresaId, empresaId), sql`${L.fechaTopeOfertas} > now()`];
  conds.push(sql`${CONF_EF} >= ${filtros.confianzaMin ?? 40}`);
  if (estado === 'nuevas') conds.push(sql`${M.estadoUsuario} not in ('descartada')`);
  if (estado === 'guardadas') conds.push(sql`${M.estadoUsuario} in ('guardada','presentada')`);
  if (estado === 'descartadas') conds.push(eq(M.estadoUsuario, 'descartada'));
  if (filtros.tipos?.length) conds.push(sql`${L.tipoCompra} in (${sql.join(filtros.tipos.map((t) => sql`${t}`), sql`, `)})`);
  if (filtros.organismo) conds.push(sql`${L.organismo} ilike ${'%' + filtros.organismo + '%'}`);
  if (filtros.cierreDias) conds.push(sql`${L.fechaTopeOfertas} < now() + make_interval(days => ${filtros.cierreDias})`);
  const orden = filtros.orden === 'confianza' ? [desc(CONF_EF), L.fechaTopeOfertas] : [L.fechaTopeOfertas, desc(CONF_EF)];

  // Monto estimado = Σ cantidad × precio sugerido de los ítems (subconsulta correlacionada: un solo viaje a la base).
  const monto = sql<string | null>`(select sum(i.cant_pedida * p.precio_sugerido)::text from licitacion_items i
    join precios_sugeridos p on p.id_compra = i.id_compra and p.nro_item = i.nro_item
    where i.id_compra = ${M.idCompra} and p.precio_sugerido is not null)`;
  const filas = await db.select({ l: COLS_LICITACION, m: M, resumen: A.resumen, fechas: A.fechasClave, monto })
    .from(M).innerJoin(L, eq(L.idCompra, M.idCompra)).leftJoin(A, eq(A.idCompra, M.idCompra))
    .where(and(...conds)).orderBy(...orden).limit(200);
  const montos = new Map<string, number>(filas.filter((f) => f.monto).map((f) => [f.l.idCompra, Number(f.monto)]));

  const cards = filas.map(({ l, m, resumen, fechas }): LicitacionCard => ({
    idCompra: l.idCompra, objeto: l.objeto ?? '(sin objeto)', organismo: l.organismo ?? '', tipoCompra: l.tipoCompra,
    tipoCompraNombre: TIPOS_COMPRA[l.tipoCompra] ?? l.tipoCompra, numero: numero(l),
    fechaTopeOfertas: iso(l.fechaTopeOfertas), diasParaCierre: l.fechaTopeOfertas ? Math.ceil((l.fechaTopeOfertas.getTime() - Date.now()) / DIA) : null,
    fechaPublicacion: iso(l.fechaPublicacion) ?? iso(l.createdAt)!, ...(() => { const e = confianzaEfectiva(m.confianza, m.estadoDocumental); return { confianza: e.confianza, confianzaBase: m.confianza, ajusteDocumental: e.ajuste }; })(),
    razon: m.razon ?? '', resumen: resumen ?? null,
    itemsOfertables: m.itemsOfertables ?? [], estadoDocumental: m.estadoDocumental as EstadoDocumental, estadoUsuario: m.estadoUsuario as EstadoUsuarioMatch,
    tieneVisita: (fechas ?? []).some((f) => f.tipo === 'visita'), montoEstimado: montos.get(l.idCompra) ?? null, moneda: 'UYU',
  }));
  if (filtros.orden === 'monto') cards.sort((a, b) => (b.montoEstimado ?? 0) - (a.montoEstimado ?? 0));
  return cards;
}

export async function resumenDashboard(empresaId: string): Promise<{ total: number; cierranSemana: number; nuevas24h: number }> {
  const [r] = await db.execute<{ total: number; semana: number; nuevas: number }>(sql`
    select count(*)::int as total,
      count(*) filter (where l.fecha_tope_ofertas < now() + interval '7 days')::int as semana,
      count(*) filter (where m.created_at > now() - interval '24 hours')::int as nuevas
    from matches m join licitaciones l on l.id_compra = m.id_compra
    where m.empresa_id = ${empresaId} and (m.confianza - case m.estado_documental when 'dificil' then 25 when 'alcanzable' then 10 else 0 end) >= 40
      and m.estado_usuario <> 'descartada' and l.fecha_tope_ofertas > now()`);
  return { total: r?.total ?? 0, cierranSemana: r?.semana ?? 0, nuevas24h: r?.nuevas ?? 0 };
}

export async function obtenerDetalle(empresaId: string, idCompra: string): Promise<DetalleLicitacion | null> {
  // Las 7 consultas en una sola tanda (antes: licitación primero y después el resto).
  const [[l], items, archivos, aclaraciones, [an], [m], precios] = await Promise.all([
    db.select(COLS_LICITACION).from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra)),
    db.select().from(schema.licitacionItems).where(eq(schema.licitacionItems.idCompra, idCompra)).orderBy(schema.licitacionItems.nroItem),
    db.select({
      id: schema.licitacionArchivos.id, nombre: schema.licitacionArchivos.nombre, url: schema.licitacionArchivos.url, extension: schema.licitacionArchivos.extension,
      tamano: schema.licitacionArchivos.tamano, contenedor: schema.licitacionArchivos.contenedor, categoria: schema.licitacionArchivos.categoria,
      relevante: schema.licitacionArchivos.relevante, estadoExtraccion: schema.licitacionArchivos.estadoExtraccion, error: schema.licitacionArchivos.error,
      caracteres: schema.licitacionArchivos.caracteres,
    }).from(schema.licitacionArchivos).where(eq(schema.licitacionArchivos.idCompra, idCompra)).orderBy(schema.licitacionArchivos.id),
    db.select().from(schema.licitacionAclaraciones).where(eq(schema.licitacionAclaraciones.idCompra, idCompra)).orderBy(schema.licitacionAclaraciones.fecha),
    db.select().from(schema.analisisLicitacion).where(eq(schema.analisisLicitacion.idCompra, idCompra)),
    db.select().from(schema.matches).where(and(eq(schema.matches.empresaId, empresaId), eq(schema.matches.idCompra, idCompra))),
    leerPrecios(idCompra),
  ]);
  if (!l) return null;
  const analisis: AnalisisPliego | null = an ? {
    resumen: an.resumen ?? '', quePiden: an.quePiden ?? '', requisitosDocumentales: an.requisitosDocumentales ?? [], fechasClave: an.fechasClave ?? [],
    condiciones: an.condiciones ?? {}, riesgos: an.riesgos ?? [], confianza: an.confianza ?? 0, basadoEn: an.basadoEn as 'pliego' | 'metadata',
  } : null;
  return {
    licitacion: {
      idCompra, objeto: l.objeto ?? '(sin objeto)', organismo: l.organismo ?? '', unidadEjecutora: l.unidadEjecutora, tipoCompra: l.tipoCompra,
      tipoCompraNombre: TIPOS_COMPRA[l.tipoCompra] ?? l.tipoCompra, numero: numero(l), estado: ESTADOS_COMPRA[l.estado ?? 0] ?? 'Desconocido',
      fechaPublicacion: iso(l.fechaPublicacion) ?? iso(l.createdAt)!, fechaTopeOfertas: iso(l.fechaTopeOfertas), fechaApertura: iso(l.fechaApertura),
      fechaSolAclar: iso(l.fechaSolAclar), fechaSolProrr: iso(l.fechaSolProrr), fechaTopeEntrega: iso(l.fechaTopeEntrega),
      lugarApertura: l.lugarApertura, lugarEntrega: l.lugarEntrega, precioPliego: l.precioPliego ? Number(l.precioPliego) : null,
      contacto: { nombre: l.nombreContacto, email: l.emailContacto }, urlDetalle: l.urlDetalle ?? urlDetalleCompra(idCompra), urlOfertar: `${BASE_ARCE}/sice/login/${idCompra}`,
    },
    items: items.map((i) => ({
      nroItem: i.nroItem, idArticulo: i.idArticulo, descripcion: i.descArticulo, cantidad: Number(i.cantPedida ?? 0), unidad: i.unidad ?? '',
      moneda: monedaDesdeId(i.idMonedaCotiz), variante: i.variante ?? undefined, presentacion: i.presentacion ?? undefined, marca: i.marca ?? undefined,
    })),
    archivos: archivos.map((a): ArchivoLicitacion => ({ ...a, url: a.url ?? '', extension: a.extension ?? '', categoria: a.categoria as CategoriaArchivo, estadoExtraccion: a.estadoExtraccion as EstadoExtraccion })),
    aclaraciones: aclaraciones.map((a) => ({ fecha: iso(a.fecha) ?? '', texto: a.texto ?? '', url: a.url })),
    analisis,
    match: m ? {
      ...(() => { const e = confianzaEfectiva(m.confianza, m.estadoDocumental); return { confianza: e.confianza, confianzaBase: m.confianza, ajusteDocumental: e.ajuste }; })(),
      razon: m.razon ?? '', itemsOfertables: m.itemsOfertables ?? [], gapDocumental: m.gapDocumental ?? [],
      estadoDocumental: m.estadoDocumental as EstadoDocumental, estadoUsuario: m.estadoUsuario as EstadoUsuarioMatch,
    } : null,
    precios,
  };
}

/** Organismos con al menos un match de la empresa (para el filtro): una consulta liviana en vez de traer 200 filas. */
export async function listarOrganismos(empresaId: string): Promise<string[]> {
  const filas = await db.execute<{ organismo: string }>(sql`
    select distinct l.organismo from matches m join licitaciones l on l.id_compra = m.id_compra
    where m.empresa_id = ${empresaId} and l.organismo is not null and l.fecha_tope_ofertas > now()
    order by l.organismo`);
  return [...filas].map((f) => f.organismo);
}

/** ¿La empresa tiene algún match abierto que el dashboard mostraría sin filtros? (para distinguir
 *  "sin resultados con estos filtros" de "todavía nada"). Los de confianza efectiva < 40 no cuentan. */
export async function tieneMatches(empresaId: string): Promise<boolean> {
  const [f] = await db.execute<{ hay: boolean }>(sql`
    select exists (select 1 from matches join licitaciones l on l.id_compra = matches.id_compra
      where matches.empresa_id = ${empresaId} and l.fecha_tope_ofertas > now()
        and matches.estado_usuario <> 'descartada' and ${CONF_EF} >= 40) as hay`);
  return Boolean(f?.hay);
}

/**
 * Progreso del matching después de un cambio de perfil: cuántas licitaciones abiertas del rubro ya se
 * evaluaron con el perfil actual (evaluarLicitacion siempre guarda una fila, también las descartadas).
 * `enCurso` solo durante 10 minutos: si el matching se cortó, el dashboard deja de decir "buscando".
 */
export async function progresoMatching(empresaId: string): Promise<{ total: number; evaluadas: number; enCurso: boolean }> {
  const [f] = await db.execute<{ total: number; evaluadas: number; reciente: boolean }>(sql`
    select
      (select count(*)::int from licitaciones l where l.es_rubro and l.fecha_tope_ofertas > now()) as total,
      (select count(*)::int from matches m
         join licitaciones l on l.id_compra = m.id_compra
         join empresas e on e.id = m.empresa_id
       where m.empresa_id = ${empresaId} and l.es_rubro and l.fecha_tope_ofertas > now()
         and (e.perfil_actualizado_en is null or m.perfil_version >= e.perfil_actualizado_en)) as evaluadas,
      exists (select 1 from empresas e where e.id = ${empresaId} and e.perfil_actualizado_en > now() - interval '10 minutes') as reciente`);
  const total = Number(f?.total ?? 0);
  const evaluadas = Math.min(Number(f?.evaluadas ?? 0), total);
  return { total, evaluadas, enCurso: Boolean(f?.reciente) && evaluadas < total };
}
