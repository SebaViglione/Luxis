import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { buscarPlazo } from '@/config/plazos-documentales';
import type { EstadoDoc, EstadoDocumental, GapDocumental, RequisitoDocumental, TipoDoc } from '@/lib/types';

/** Días hábiles (lunes a viernes) entre hoy y una fecha. */
export function diasHabilesHasta(fecha: Date, desde = new Date()): number {
  let n = 0; const d = new Date(desde);
  d.setHours(0, 0, 0, 0);
  const fin = new Date(fecha); fin.setHours(0, 0, 0, 0);
  while (d < fin) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export function calcularGap(
  requisitos: RequisitoDocumental[],
  documentos: { tipo: string; nombre: string; estado: string }[],
  cierre: Date | null,
): { gap: GapDocumental[]; estado: EstadoDocumental } {
  if (!requisitos.length) return { gap: [], estado: 'desconocido' };
  const habiles = cierre ? diasHabilesHasta(cierre) : null;
  const gap = requisitos.map((r): GapDocumental => {
    const plazo = buscarPlazo(r.documento);
    const tipo = (r.tipo !== 'OTRO' ? r.tipo : plazo.tipo) as TipoDoc | 'OTRO';
    const propio = tipo !== 'OTRO'
      ? documentos.find((d) => d.tipo === tipo)
      : documentos.find((d) => norm(r.documento).includes(norm(d.nombre)) || norm(d.nombre).includes(norm(r.documento)));
    const estadoEmpresa = (propio?.estado ?? (tipo === 'OTRO' ? 'desconocido' : 'no_tiene')) as EstadoDoc;
    // Formularios y declaraciones se completan en el momento: cuentan como que se tienen.
    const tiene = estadoEmpresa === 'vigente' || (tipo === 'OTRO' && plazo.diasHabiles === 0);
    const alcanzable = tiene ? true : !plazo.alcanzable ? false : habiles === null ? null : habiles >= plazo.diasHabiles + 1;
    return {
      documento: r.documento, tipo, obligatorio: r.obligatorio, tiene, estadoEmpresa,
      diasEstimados: tiene ? 0 : plazo.diasHabiles, alcanzableAntesCierre: alcanzable,
      nota: tiene ? (estadoEmpresa === 'vigente' ? 'Lo tenés vigente.' : plazo.nota) : `${plazo.nota}${habiles !== null ? ` Quedan ${habiles} días hábiles al cierre.` : ''}`,
    };
  });
  const faltantes = gap.filter((g) => g.obligatorio && !g.tiene);
  const estado: EstadoDocumental = !faltantes.length ? 'cumple'
    : faltantes.some((g) => g.alcanzableAntesCierre === false) ? 'dificil'
    : faltantes.every((g) => g.alcanzableAntesCierre === true) ? 'alcanzable' : 'desconocido';
  return { gap, estado };
}

/** Recalcula el gap de un match con el análisis del pliego y la documentación actual de la empresa. */
export async function calcularGapParaMatch(empresaId: string, idCompra: string) {
  const [a] = await db.select({ req: schema.analisisLicitacion.requisitosDocumentales }).from(schema.analisisLicitacion).where(eq(schema.analisisLicitacion.idCompra, idCompra));
  if (!a?.req) return null;
  const [l] = await db.select({ cierre: schema.licitaciones.fechaTopeOfertas }).from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra));
  const docs = await db.select().from(schema.empresaDocumentos).where(eq(schema.empresaDocumentos.empresaId, empresaId));
  const r = calcularGap(a.req, docs, l?.cierre ?? null);
  await db.update(schema.matches).set({ gapDocumental: r.gap, estadoDocumental: r.estado, updatedAt: new Date() })
    .where(and(eq(schema.matches.empresaId, empresaId), eq(schema.matches.idCompra, idCompra)));
  return r;
}
