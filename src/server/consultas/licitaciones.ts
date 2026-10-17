import { and, desc, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import {
  ESTADOS_COMPRA, TIPOS_COMPRA, monedaDesdeId,
  type AnalisisPliego, type ArchivoLicitacion, type CategoriaArchivo, type DetalleLicitacion, type EstadoDocumental,
  type EstadoExtraccion, type EstadoUsuarioMatch, type FiltrosDashboard, type LicitacionCard,
} from '@/lib/types';
import { leerPrecios } from '@/server/ia/precio';
import { urlDetalleCompra, BASE_ARCE } from '@/server/arce/normalizar';

const DIA = 864e5;
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const numero = (l: { numCompra: string | null; anioCompra: number | null }) => `${l.numCompra ?? '?'}/${l.anioCompra ?? ''}`;

/** Licitaciones con match para el dashboard. */
export async function listarMatches(empresaId: string, filtros: FiltrosDashboard = {}): Promise<LicitacionCard[]> {
  const L = schema.licitaciones, M = schema.matches, A = schema.analisisLicitacion;
  const estado = filtros.estado ?? 'nuevas';
  const conds = [eq(M.empresaId, empresaId), sql`${L.fechaTopeOfertas} > now()`];
  conds.push(sql`${M.confianza} >= ${filtros.confianzaMin ?? 40}`);
  if (estado === 'nuevas') conds.push(sql`${M.estadoUsuario} not in ('descartada')`);
  if (estado === 'guardadas') conds.push(sql`${M.estadoUsuario} in ('guardada','presentada')`);
  if (estado === 'descartadas') conds.push(eq(M.estadoUsuario, 'descartada'));
  if (filtros.tipos?.length) conds.push(sql`${L.tipoCompra} in (${sql.join(filtros.tipos.map((t) => sql`${t}`), sql`, `)})`);
  if (filtros.organismo) conds.push(sql`${L.organismo} ilike ${'%' + filtros.organismo + '%'}`);
  if (filtros.cierreDias) conds.push(sql`${L.fechaTopeOfertas} < now() + make_interval(days => ${filtros.cierreDias})`);
  const orden = filtros.orden === 'confianza' ? [desc(M.confianza), L.fechaTopeOfertas] : [L.fechaTopeOfertas, desc(M.confianza)];

  const filas = await db.select({ l: L, m: M, resumen: A.resumen, fechas: A.fechasClave })
    .from(M).innerJoin(L, eq(L.idCompra, M.idCompra)).leftJoin(A, eq(A.idCompra, M.idCompra))
    .where(and(...conds)).orderBy(...orden).limit(200);

  // Monto estimado = Σ cantidad × precio sugerido de los ítems ofertables.
  const ids = filas.map((f) => f.l.idCompra);
  const montos = new Map<string, number>();
  if (ids.length) {
    const r = await db.execute<{ id_compra: string; monto: string | null }>(sql`
      select i.id_compra, sum(i.cant_pedida * p.precio_sugerido)::text as monto
      from licitacion_items i join precios_sugeridos p on p.id_compra = i.id_compra and p.nro_item = i.nro_item
      where i.id_compra in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)}) and p.precio_sugerido is not null
      group by i.id_compra`);
    for (const x of r) if (x.monto) montos.set(x.id_compra, Number(x.monto));
  }

  const cards = filas.map(({ l, m, resumen, fechas }): LicitacionCard => ({
    idCompra: l.idCompra, objeto: l.objeto ?? '(sin objeto)', organismo: l.organismo ?? '', tipoCompra: l.tipoCompra,
    tipoCompraNombre: TIPOS_COMPRA[l.tipoCompra] ?? l.tipoCompra, numero: numero(l),
    fechaTopeOfertas: iso(l.fechaTopeOfertas), diasParaCierre: l.fechaTopeOfertas ? Math.ceil((l.fechaTopeOfertas.getTime() - Date.now()) / DIA) : null,
    fechaPublicacion: iso(l.fechaPublicacion) ?? iso(l.createdAt)!, confianza: m.confianza, razon: m.razon ?? '', resumen: resumen ?? null,
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
    where m.empresa_id = ${empresaId} and m.confianza >= 40 and m.estado_usuario <> 'descartada' and l.fecha_tope_ofertas > now()`);
  return { total: r?.total ?? 0, cierranSemana: r?.semana ?? 0, nuevas24h: r?.nuevas ?? 0 };
}

export async function obtenerDetalle(empresaId: string, idCompra: string): Promise<DetalleLicitacion | null> {
  const [l] = await db.select().from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra));
  if (!l) return null;
  const [items, archivos, aclaraciones, [an], [m], precios] = await Promise.all([
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
      confianza: m.confianza, razon: m.razon ?? '', itemsOfertables: m.itemsOfertables ?? [], gapDocumental: m.gapDocumental ?? [],
      estadoDocumental: m.estadoDocumental as EstadoDocumental, estadoUsuario: m.estadoUsuario as EstadoUsuarioMatch,
    } : null,
    precios,
  };
}
