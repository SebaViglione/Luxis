import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { buscarPlazo, esDocumentoDeLaLicitacion } from '@/config/plazos-documentales';
import type { EstadoDoc, EstadoDocumental, FechaClave, GapDocumental, RequisitoDocumental, TipoDoc } from '@/lib/types';

/** Días hábiles (lunes a viernes) entre hoy y una fecha. */
export function diasHabilesHasta(fecha: Date, desde = new Date()): number {
  let n = 0; const d = new Date(desde);
  d.setHours(0, 0, 0, 0);
  const fin = new Date(fecha); fin.setHours(0, 0, 0, 0);
  while (d < fin) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

/**
 * El pliego (\u00fanico, de condiciones generales o particulares) lo publica el organismo: no es algo que el
 * oferente presente. Solo cuenta cuando el requisito ES el pliego; "Formulario \u2026 aceptaci\u00f3n del pliego" s\u00ed se presenta.
 */
export function esPliegoDelLlamado(documento: string): boolean {
  return /^\s*(EL\s+)?PLIEGOS?\b/.test(norm(documento)) || esDocumentoDeLaLicitacion(documento);
}

export function calcularGap(
  requisitosConPliego: RequisitoDocumental[],
  documentos: { tipo: string; nombre: string; estado: string }[],
  cierre: Date | null,
  fechas: FechaClave[] = [],
): { gap: GapDocumental[]; estado: EstadoDocumental } {
  // Papeles = entregables. El pliego y demás documentos de la propia licitación se leen, no se entregan.
  const requisitos = requisitosConPliego.filter((r) => !esPliegoDelLlamado(r.documento));
  if (!requisitos.length) return { gap: [], estado: 'desconocido' };
  const habiles = cierre ? diasHabilesHasta(cierre) : null;
  const visitaVencida = fechas.some((f) => f.tipo === 'visita' && f.obligatoria && f.fecha && new Date(f.fecha).getTime() < Date.now());
  const gap = requisitos.map((r): GapDocumental => {
    const plazo = buscarPlazo(r.documento);
    const tipo = (r.tipo !== 'OTRO' ? r.tipo : plazo.tipo) as TipoDoc | 'OTRO';
    const propio = tipo !== 'OTRO'
      ? documentos.find((d) => d.tipo === tipo)
      : documentos.find((d) => norm(r.documento).includes(norm(d.nombre)) || norm(d.nombre).includes(norm(r.documento)));
    const estadoEmpresa = (propio?.estado ?? (tipo === 'OTRO' ? 'desconocido' : 'no_tiene')) as EstadoDoc;
    const base = { documento: r.documento, tipo, estadoEmpresa };
    // Reglas generales (Pliego Único, TOCAF): no es un papel, se aceptan al ofertar.
    if (plazo.reglasGenerales) return { ...base, obligatorio: false, tiene: true, diasEstimados: 0, alcanzableAntesCierre: true, nota: plazo.nota };
    // Lo arma Luxis en Postulación (formularios, DJ, planilla, especificación): cuenta como que se tiene.
    if (plazo.preparaLuxis) return { ...base, obligatorio: r.obligatorio, tiene: true, diasEstimados: 0, alcanzableAntesCierre: true, nota: plazo.nota };
    // Garantía de (fiel) cumplimiento: se pide después de adjudicar, no frena la oferta.
    if (plazo.postAdjudicacion) return { ...base, obligatorio: false, tiene: false, diasEstimados: plazo.diasHabiles, alcanzableAntesCierre: true, nota: plazo.nota };
    // Visita obligatoria con fecha ya pasada: no se puede cumplir.
    if (/VISITA/.test(norm(r.documento)) && visitaVencida) {
      return { ...base, obligatorio: r.obligatorio, tiene: false, diasEstimados: null, alcanzableAntesCierre: false, nota: 'La visita obligatoria ya pasó.' };
    }
    // RUPE "en ingreso" (en trámite) alcanza para ofertar.
    const tiene = estadoEmpresa === 'vigente' || (tipo === 'RUPE' && estadoEmpresa === 'en_tramite') || (tipo === 'OTRO' && plazo.diasHabiles === 0);
    const alcanzable = tiene ? true : !plazo.alcanzable ? false : habiles === null ? null : habiles >= plazo.diasHabiles + 1;
    return {
      ...base, obligatorio: r.obligatorio, tiene,
      diasEstimados: tiene ? 0 : plazo.diasHabiles, alcanzableAntesCierre: alcanzable,
      nota: tiene ? (estadoEmpresa === 'vigente' ? 'Lo tenés vigente.' : estadoEmpresa === 'en_tramite' ? 'En trámite: alcanza para ofertar.' : plazo.nota) : `${plazo.nota}${habiles !== null ? ` Quedan ${habiles} días hábiles al cierre.` : ''}`,
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
  const [[a], [l], docs] = await Promise.all([
    db.select({ req: schema.analisisLicitacion.requisitosDocumentales, fechas: schema.analisisLicitacion.fechasClave }).from(schema.analisisLicitacion).where(eq(schema.analisisLicitacion.idCompra, idCompra)),
    db.select({ cierre: schema.licitaciones.fechaTopeOfertas }).from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra)),
    db.select().from(schema.empresaDocumentos).where(eq(schema.empresaDocumentos.empresaId, empresaId)),
  ]);
  if (!a?.req) return null;
  const r = calcularGap(a.req, docs, l?.cierre ?? null, a.fechas ?? []);
  await db.update(schema.matches).set({ gapDocumental: r.gap, estadoDocumental: r.estado, updatedAt: new Date() })
    .where(and(eq(schema.matches.empresaId, empresaId), eq(schema.matches.idCompra, idCompra)));
  return r;
}
