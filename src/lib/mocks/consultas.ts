// Mismas firmas que src/server/consultas/* para que M2 solo cambie el import. Se elimina en M2.
import { connection } from 'next/server';
import type { DetalleLicitacion, EstadoUsuarioMatch, FiltrosDashboard, LicitacionCard } from '@/lib/types';
import { ACLARACIONES, ARCHIVOS, ITEMS, LICITACIONES } from './licitaciones';
import { MATCHES } from './matches';
import { ANALISIS } from './analisis';
import { PRECIOS } from './precios';

const DIA = 864e5;
export const EMPRESA_DEMO = { id: 'demo', nombre: 'Barraca Don Aurelio' };
const estados = new Map<string, EstadoUsuarioMatch>(Object.entries(MATCHES).map(([id, m]) => [id, m.estadoUsuario]));

function montoEstimado(idCompra: string): number | null {
  const precios = new Map(PRECIOS[idCompra].map((p) => [p.nroItem, p.precioSugerido]));
  let total = 0;
  for (const item of ITEMS[idCompra]) {
    const precio = precios.get(item.nroItem);
    if (precio) total += item.cantidad * precio;
  }
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

function card(idCompra: string, ahora: number): LicitacionCard {
  const l = LICITACIONES[idCompra], m = MATCHES[idCompra], a = ANALISIS[idCompra];
  return {
    idCompra, objeto: l.objeto, organismo: l.organismo, tipoCompra: l.tipoCompra, tipoCompraNombre: l.tipoCompraNombre, numero: l.numero,
    fechaTopeOfertas: l.fechaTopeOfertas,
    diasParaCierre: l.fechaTopeOfertas ? Math.ceil((Date.parse(l.fechaTopeOfertas) - ahora) / DIA) : null,
    fechaPublicacion: l.fechaPublicacion, confianza: m.confianza, razon: m.razon, resumen: a?.resumen ?? null,
    itemsOfertables: m.itemsOfertables, estadoDocumental: m.estadoDocumental, estadoUsuario: estados.get(idCompra) ?? 'nuevo',
    tieneVisita: (a?.fechasClave ?? []).some((f) => f.tipo === 'visita'), montoEstimado: montoEstimado(idCompra), moneda: 'UYU',
  };
}

export async function empresaActual(): Promise<{ id: string; nombre: string }> {
  await connection();
  return EMPRESA_DEMO;
}

export async function listarMatches(empresaId: string, filtros: FiltrosDashboard = {}): Promise<LicitacionCard[]> {
  await connection();
  if (empresaId !== EMPRESA_DEMO.id) return [];
  const ahora = Date.now();
  const estado = filtros.estado ?? 'nuevas';
  const cards = Object.keys(MATCHES).map((id) => card(id, ahora)).filter((c) => {
    if (!c.fechaTopeOfertas || Date.parse(c.fechaTopeOfertas) <= ahora) return false;
    if (c.confianza < (filtros.confianzaMin ?? 40)) return false;
    if (estado === 'nuevas' && c.estadoUsuario === 'descartada') return false;
    if (estado === 'guardadas' && !['guardada', 'presentada'].includes(c.estadoUsuario)) return false;
    if (estado === 'descartadas' && c.estadoUsuario !== 'descartada') return false;
    if (filtros.tipos?.length && !filtros.tipos.includes(c.tipoCompra)) return false;
    if (filtros.organismo && !c.organismo.toLowerCase().includes(filtros.organismo.toLowerCase())) return false;
    if (filtros.cierreDias && Date.parse(c.fechaTopeOfertas) >= ahora + filtros.cierreDias * DIA) return false;
    return true;
  });
  if (filtros.orden === 'confianza') return cards.sort((a, b) => b.confianza - a.confianza);
  if (filtros.orden === 'monto') return cards.sort((a, b) => (b.montoEstimado ?? 0) - (a.montoEstimado ?? 0));
  return cards.sort((a, b) => (a.fechaTopeOfertas ?? '').localeCompare(b.fechaTopeOfertas ?? ''));
}

export async function resumenDashboard(empresaId: string): Promise<{ total: number; cierranSemana: number; nuevas24h: number }> {
  const cards = await listarMatches(empresaId, { estado: 'nuevas', confianzaMin: 40 });
  return {
    total: cards.length,
    cierranSemana: cards.filter((c) => c.diasParaCierre !== null && c.diasParaCierre <= 7).length,
    nuevas24h: 0,
  };
}

export async function obtenerDetalle(empresaId: string, idCompra: string): Promise<DetalleLicitacion | null> {
  await connection();
  if (empresaId !== EMPRESA_DEMO.id || !LICITACIONES[idCompra]) return null;
  return {
    licitacion: LICITACIONES[idCompra],
    items: ITEMS[idCompra],
    archivos: ARCHIVOS[idCompra],
    aclaraciones: ACLARACIONES[idCompra],
    analisis: ANALISIS[idCompra] ?? null,
    match: { ...MATCHES[idCompra], estadoUsuario: estados.get(idCompra) ?? 'nuevo' },
    precios: PRECIOS[idCompra],
  };
}

export async function actualizarEstadoMatch(empresaId: string, idCompra: string, estado: EstadoUsuarioMatch) {
  if (empresaId === EMPRESA_DEMO.id && MATCHES[idCompra]) estados.set(idCompra, estado);
}
