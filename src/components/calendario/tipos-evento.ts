import type { EventoCalendario } from '@/lib/types';

export const TIPO_EVENTO: Record<EventoCalendario['tipo'], { etiqueta: string; marca: string }> = {
  apertura: { etiqueta: 'Cierre de ofertas', marca: 'bg-primary' },
  visita: { etiqueta: 'Visita', marca: 'bg-alerta' },
  consultas: { etiqueta: 'Consultas', marca: 'bg-muted-foreground/60' },
  prorroga: { etiqueta: 'Prórroga', marca: 'bg-muted-foreground/60' },
  entrega: { etiqueta: 'Entrega', marca: 'bg-exito' },
  otro: { etiqueta: 'Otro', marca: 'bg-muted-foreground/40' },
};

const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo' });

/** Día calendario (yyyy-mm-dd) en hora de Montevideo. */
export function diaMontevideo(fecha: Date | string): string {
  return fmtDia.format(typeof fecha === 'string' ? new Date(fecha) : fecha);
}

export function hoyMontevideo(): string {
  return diaMontevideo(new Date());
}

export function agruparPorDia(eventos: EventoCalendario[]): Map<string, EventoCalendario[]> {
  const mapa = new Map<string, EventoCalendario[]>();
  for (const e of eventos) {
    const d = diaMontevideo(e.fecha);
    mapa.set(d, [...(mapa.get(d) ?? []), e]);
  }
  return mapa;
}

// El evento se titula "Cierre de ofertas: objeto"; en la grilla se muestra solo el objeto.
export function objetoDelEvento(e: EventoCalendario): string {
  const i = e.titulo.indexOf(': ');
  return i >= 0 ? e.titulo.slice(i + 2) : e.titulo;
}
