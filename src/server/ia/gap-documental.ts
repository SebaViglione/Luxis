import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '@/db';
import { enParalelo } from '@/lib/ia/estructurado';
import {
  NOTA_POST_ADJUDICACION, NOTA_SIN_DATO, buscarPlazo, esDocumentoDeLaLicitacion, sePideDespuesDeAdjudicar,
} from '@/config/plazos-documentales';
import type { EstadoDoc, EstadoDocumental, FechaClave, GapDocumental, RequisitoDocumental, TipoDoc } from '@/lib/types';

/** Días hábiles (lunes a viernes) entre hoy y una fecha. */
export function diasHabilesHasta(fecha: Date, desde = new Date()): number {
  let n = 0; const d = new Date(desde);
  d.setHours(0, 0, 0, 0);
  const fin = new Date(fecha); fin.setHours(0, 0, 0, 0);
  while (d < fin) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const dia = (iso: string, conAnio = false) =>
  new Date(iso).toLocaleDateString('es-UY', { timeZone: 'America/Montevideo', day: 'numeric', month: 'numeric', ...(conAnio ? { year: 'numeric' } : {}) });

/**
 * El pliego (único, de condiciones generales o particulares) lo publica el organismo: no es algo que el
 * oferente presente. Solo cuenta cuando el requisito ES el pliego; "Formulario … aceptación del pliego" sí se presenta.
 */
export function esPliegoDelLlamado(documento: string): boolean {
  return /^\s*(EL\s+)?PLIEGOS?\b/.test(norm(documento)) || esDocumentoDeLaLicitacion(documento);
}

/** Un papel "vigente" cuya fecha de vencimiento ya pasó (o pasa antes del cierre) cuenta como vencido. */
export function estadoDocumento(d: { estado: string; vencimiento?: string | null }, cierre: Date | null = null): EstadoDoc {
  if (d.estado !== 'vigente' || !d.vencimiento) return d.estado as EstadoDoc;
  const vence = new Date(`${d.vencimiento}T23:59:59-03:00`);
  return vence.getTime() < Math.max(Date.now(), cierre?.getTime() ?? 0) ? 'vencido' : 'vigente';
}

// ARCE exige RUPE (al menos EN INGRESO) para ofertar, aunque el pliego no lo nombre.
const RUPE_IMPLICITO: RequisitoDocumental = {
  documento: 'Inscripción en RUPE', tipo: 'RUPE', obligatorio: true, seccion: null,
  detalle: 'Lo exige ARCE para ofertar, aunque el pliego no lo nombre.',
};

export function calcularGap(
  requisitosConPliego: RequisitoDocumental[],
  documentos: { tipo: string; nombre: string; estado: string; vencimiento?: string | null }[],
  cierre: Date | null,
  fechas: FechaClave[] = [],
): { gap: GapDocumental[]; estado: EstadoDocumental } {
  // Papeles = entregables. El pliego y demás documentos de la propia licitación se leen, no se entregan.
  const requisitos = requisitosConPliego.filter((r) => !esPliegoDelLlamado(r.documento));
  if (!requisitos.length) return { gap: [], estado: 'desconocido' };
  const habiles = cierre ? diasHabilesHasta(cierre) : null;
  const visitas = fechas.filter((f) => f.tipo === 'visita' && f.fecha && !Number.isNaN(Date.parse(f.fecha)));
  const visitaVencida = visitas.some((f) => f.obligatoria && Date.parse(f.fecha!) < Date.now());
  const proximaVisita = visitas.filter((f) => Date.parse(f.fecha!) >= Date.now()).sort((a, b) => Date.parse(a.fecha!) - Date.parse(b.fecha!))[0];

  const evaluar = (r: RequisitoDocumental): GapDocumental | null => {
    const plazo = buscarPlazo(r.documento);
    const tipo = (r.tipo !== 'OTRO' ? r.tipo : plazo.tipo) as TipoDoc | 'OTRO';
    const propio = tipo !== 'OTRO'
      ? documentos.find((d) => d.tipo === tipo)
      : documentos.find((d) => norm(r.documento).includes(norm(d.nombre)) || norm(d.nombre).includes(norm(r.documento)));
    const estadoEmpresa = propio ? estadoDocumento(propio, cierre) : (tipo === 'OTRO' ? 'desconocido' : 'no_tiene');
    const base = { documento: r.documento, tipo, estadoEmpresa };
    // Reglas generales (Pliego Único, TOCAF): no es un papel, se aceptan al ofertar. No va en Papeles.
    if (plazo.reglasGenerales) return null;
    // Lo arma Luxis en Postulación (formularios, DJ, planilla, especificación): cuenta como que se tiene.
    if (plazo.preparaLuxis) return { ...base, obligatorio: r.obligatorio, tiene: true, diasEstimados: 0, alcanzableAntesCierre: true, nota: plazo.nota };
    // Garantía de (fiel) cumplimiento, o lo que el pliego pide al adjudicatario, para empezar o para cobrar: no frena la oferta.
    if (plazo.postAdjudicacion || sePideDespuesDeAdjudicar(r.detalle)) {
      return { ...base, obligatorio: false, tiene: false, diasEstimados: plazo.diasHabiles, alcanzableAntesCierre: true, nota: NOTA_POST_ADJUDICACION };
    }
    // Visita: no es un trámite, depende de la fecha. Si la obligatoria ya pasó, no se puede cumplir.
    if (plazo.visita) {
      if (visitaVencida) return { ...base, obligatorio: r.obligatorio, tiene: false, diasEstimados: null, alcanzableAntesCierre: false, nota: 'La visita obligatoria ya pasó.' };
      const cuando = proximaVisita ? ` La visita es el ${dia(proximaVisita.fecha!)}.` : ' Coordiná la fecha con el organismo.';
      return { ...base, obligatorio: r.obligatorio, tiene: false, diasEstimados: 0, alcanzableAntesCierre: true, nota: `${plazo.nota}${cuando}` };
    }
    // RUPE "en ingreso" (en trámite) alcanza para ofertar.
    const tiene = estadoEmpresa === 'vigente' || (tipo === 'RUPE' && estadoEmpresa === 'en_tramite');
    const alcanzable = tiene ? true : !plazo.alcanzable ? false : habiles === null ? null : habiles >= plazo.diasHabiles + 1;
    // Un papel del perfil sin dato no es "no lo tenés": lo decimos así para que lo confirme en Cuenta.
    const sinDato = tipo !== 'OTRO' && estadoEmpresa === 'desconocido' ? `${NOTA_SIN_DATO} ` : '';
    const vence = propio?.vencimiento ? `${propio.vencimiento}T12:00:00-03:00` : null;
    const vencido = propio?.estado === 'vigente' && estadoEmpresa === 'vencido' && vence
      ? (Date.parse(vence) < Date.now() ? `Venció el ${dia(vence, true)}: renovalo. ` : `Vence el ${dia(vence, true)}, antes del cierre: renovalo. `)
      : '';
    return {
      ...base, obligatorio: r.obligatorio, tiene,
      diasEstimados: tiene ? 0 : plazo.diasHabiles, alcanzableAntesCierre: alcanzable,
      nota: tiene
        ? (estadoEmpresa === 'vigente' ? 'Lo tenés vigente.' : 'En trámite: alcanza para ofertar.')
        : `${sinDato}${vencido}${plazo.nota}${habiles !== null ? ` Quedan ${habiles} ${habiles === 1 ? 'día hábil' : 'días hábiles'} al cierre.` : ''}`,
    };
  };

  const gap = requisitos.map(evaluar).filter((g): g is GapDocumental => g !== null);
  // Un formulario "validado en RUPE" lo arma Luxis: no dice nada de si la empresa está inscripta.
  if (!gap.some((g) => g.tipo === 'RUPE' && g.obligatorio && !buscarPlazo(g.documento).preparaLuxis)) {
    const rupe = evaluar(RUPE_IMPLICITO);
    if (rupe) gap.unshift({ ...rupe, nota: rupe.tiene ? rupe.nota : `${RUPE_IMPLICITO.detalle} ${rupe.nota}` });
  }
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

/** Recalcula los gaps de los matches abiertos de una empresa (al cambiar sus papeles): sin IA, solo reglas. */
export async function recalcularGapsEmpresa(empresaId: string) {
  const abiertos = await db.select({ idCompra: schema.matches.idCompra }).from(schema.matches)
    .innerJoin(schema.licitaciones, eq(schema.licitaciones.idCompra, schema.matches.idCompra))
    .where(and(eq(schema.matches.empresaId, empresaId), eq(schema.matches.relevante, true), gt(schema.licitaciones.fechaTopeOfertas, new Date())));
  await enParalelo(abiertos.map((m) => m.idCompra), 4, (id) => calcularGapParaMatch(empresaId, id).then(() => undefined).catch(() => undefined));
  return abiertos.length;
}
