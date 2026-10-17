import type { FiltrosDashboard } from '@/lib/types';

export const CONFIANZA_POR_DEFECTO = 60;

type ParametrosUrl = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ESTADOS = ['nuevas', 'guardadas', 'descartadas', 'todas'] as const;
const ORDENES = ['cierre', 'confianza', 'monto'] as const;

export function filtrosDesdeUrl(sp: ParametrosUrl): FiltrosDashboard {
  const confianza = Number(uno(sp.confianza));
  const cierre = Number(uno(sp.cierre));
  const estado = uno(sp.estado);
  const orden = uno(sp.orden);
  const tipos = uno(sp.tipo)?.split(',').filter((t) => /^[A-Z]{2}$/.test(t));
  return {
    confianzaMin: Number.isInteger(confianza) && confianza >= 0 && confianza <= 100 ? confianza : CONFIANZA_POR_DEFECTO,
    tipos: tipos?.length ? tipos : undefined,
    organismo: uno(sp.organismo)?.slice(0, 120) || undefined,
    cierreDias: [7, 15, 30].includes(cierre) ? cierre : undefined,
    estado: ESTADOS.find((e) => e === estado) ?? 'nuevas',
    orden: ORDENES.find((o) => o === orden) ?? 'cierre',
  };
}
