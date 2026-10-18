import 'server-only';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { TIPOS_COMPRA, confianzaEfectiva, type EstadoDocumental, type EstadoUsuarioMatch, type LicitacionCard } from '@/lib/types';
import { leerMontoEstimado, montoEstimadoSql } from '@/server/consultas/licitaciones';
import { esDeLaEmpresa } from './proveedor';
import { identidadEmpresa } from './resultados';

const DIA = 864e5;
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/**
 * Guardadas y presentadas de la empresa (presentadas primero), aunque ya haya cerrado la recepción de ofertas.
 * Las guardadas salen cuando ARCE publica la adjudicación; las presentadas pasan a ganada o perdida (actualizarResultados).
 */
export async function listarEnCurso(empresaId: string): Promise<LicitacionCard[]> {
  const L = schema.licitaciones, M = schema.matches, A = schema.analisisLicitacion;
  const monto = montoEstimadoSql(M.idCompra);
  const filas = await db.select({
    idCompra: L.idCompra, tipoCompra: L.tipoCompra, numCompra: L.numCompra, anioCompra: L.anioCompra, organismo: L.organismo, objeto: L.objeto,
    tope: L.fechaTopeOfertas, publicacion: L.fechaPublicacion, creada: L.createdAt, m: M, resumen: A.resumen, fechas: A.fechasClave, monto,
  })
    .from(M).innerJoin(L, eq(L.idCompra, M.idCompra)).leftJoin(A, eq(A.idCompra, M.idCompra))
    .where(and(
      eq(M.empresaId, empresaId),
      sql`(${M.estadoUsuario} = 'presentada' or (${M.estadoUsuario} = 'guardada' and not exists (select 1 from adjudicaciones a where a.id_compra = ${M.idCompra})))`,
    ))
    .orderBy(sql`case ${M.estadoUsuario} when 'presentada' then 0 else 1 end`, L.fechaTopeOfertas)
    .limit(200);

  return filas.map((f): LicitacionCard => {
    const e = confianzaEfectiva(f.m.confianza, f.m.estadoDocumental);
    return {
      idCompra: f.idCompra, objeto: f.objeto ?? '(sin objeto)', organismo: f.organismo ?? '', tipoCompra: f.tipoCompra,
      tipoCompraNombre: TIPOS_COMPRA[f.tipoCompra] ?? f.tipoCompra, numero: `${f.numCompra ?? '?'}/${f.anioCompra ?? ''}`,
      fechaTopeOfertas: iso(f.tope), diasParaCierre: f.tope ? Math.ceil((f.tope.getTime() - Date.now()) / DIA) : null,
      fechaPublicacion: iso(f.publicacion) ?? iso(f.creada)!, confianza: e.confianza, confianzaBase: f.m.confianza, ajusteDocumental: e.ajuste,
      razon: f.m.razon ?? '', resumen: f.resumen ?? null, itemsOfertables: f.m.itemsOfertables ?? [],
      estadoDocumental: f.m.estadoDocumental as EstadoDocumental, estadoUsuario: f.m.estadoUsuario as EstadoUsuarioMatch,
      tieneVisita: (f.fechas ?? []).some((x) => x.tipo === 'visita'), ...leerMontoEstimado(f.monto),
    };
  });
}

export interface ProductoVendido { producto: string; unidad: string | null; cantidad: number; monto: number; lineas: number }
export interface ResultadoReciente { idCompra: string; objeto: string; organismo: string; estado: 'ganada' | 'perdida'; fecha: string; facturado: number | null }
export interface EstadisticasEmpresa {
  ganadas: number;
  perdidas: number;
  enCurso: number;
  tasaExito: number | null;
  facturado: number;
  facturadoOtrasMonedas: number;
  ranking: ProductoVendido[];
  recientes: ResultadoReciente[];
}

/** Ganadas, perdidas, facturado sin IVA (Σ cantidad × precio unitario adjudicado en pesos) y ranking por producto. */
export async function estadisticasEmpresa(empresaId: string): Promise<EstadisticasEmpresa> {
  const M = schema.matches, L = schema.licitaciones, A = schema.adjudicaciones;
  const [empresa, resultados, [enCurso]] = await Promise.all([
    identidadEmpresa(empresaId),
    db.select({ idCompra: M.idCompra, estado: M.estadoUsuario, fecha: M.updatedAt, objeto: L.objeto, organismo: L.organismo })
      .from(M).innerJoin(L, eq(L.idCompra, M.idCompra))
      .where(and(eq(M.empresaId, empresaId), inArray(M.estadoUsuario, ['ganada', 'perdida'])))
      .orderBy(desc(M.updatedAt)),
    db.select({ n: sql<number>`count(*)::int` }).from(M).where(and(eq(M.empresaId, empresaId), eq(M.estadoUsuario, 'presentada'))),
  ]);

  const ganadasIds = resultados.filter((r) => r.estado === 'ganada').map((r) => r.idCompra);
  const lineas = empresa && ganadasIds.length
    ? (await db.select({ idCompra: A.idCompra, nroDoc: A.nroDocProv, nombre: A.nombreComercial, desc: A.descArticulo, unidad: A.unidad, cant: A.cantAdj, precio: A.precioUnit, moneda: A.idMoneda })
      .from(A).where(inArray(A.idCompra, ganadasIds))).filter((l) => esDeLaEmpresa(empresa, l.nroDoc, l.nombre))
    : [];

  const porProducto = new Map<string, ProductoVendido>();
  const porCompra = new Map<string, number>();
  let facturado = 0, otras = 0;
  for (const l of lineas) {
    const importe = Number(l.cant ?? 0) * Number(l.precio ?? 0);
    if (l.moneda !== 0) { otras += importe; continue; }
    facturado += importe;
    porCompra.set(l.idCompra, (porCompra.get(l.idCompra) ?? 0) + importe);
    const clave = l.desc.trim().toUpperCase();
    const p = porProducto.get(clave) ?? { producto: l.desc.trim(), unidad: l.unidad, cantidad: 0, monto: 0, lineas: 0 };
    porProducto.set(clave, { ...p, cantidad: p.cantidad + Number(l.cant ?? 0), monto: p.monto + importe, lineas: p.lineas + 1 });
  }

  const ganadas = ganadasIds.length, perdidas = resultados.length - ganadas;
  return {
    ganadas, perdidas, enCurso: enCurso?.n ?? 0,
    tasaExito: resultados.length ? ganadas / resultados.length : null,
    facturado, facturadoOtrasMonedas: otras,
    ranking: [...porProducto.values()].sort((a, b) => b.monto - a.monto).slice(0, 10),
    recientes: resultados.slice(0, 10).map((r) => ({
      idCompra: r.idCompra, objeto: r.objeto ?? '(sin objeto)', organismo: r.organismo ?? '', estado: r.estado as 'ganada' | 'perdida',
      fecha: r.fecha.toISOString(), facturado: r.estado === 'ganada' ? (porCompra.get(r.idCompra) ?? null) : null,
    })),
  };
}
