import type { EventoCalendario } from '@/lib/types';

export const TIPO_EVENTO: Record<EventoCalendario['tipo'], { etiqueta: string; marca: string }> = {
  apertura: { etiqueta: 'Cierre de ofertas', marca: 'bg-primary' },
  visita: { etiqueta: 'Visita al lugar', marca: 'bg-alerta' },
  consultas: { etiqueta: 'Último día para preguntas', marca: 'bg-muted-foreground/60' },
  prorroga: { etiqueta: 'Último día para pedir más plazo', marca: 'bg-muted-foreground/60' },
  entrega: { etiqueta: 'Entrega de mercadería', marca: 'bg-exito' },
  otro: { etiqueta: 'Otra fecha', marca: 'bg-muted-foreground/40' },
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

// El análisis a veces marca la "entrega de ofertas" como tipo entrega: si coincide con el cierre, es el mismo evento.
export function sinEntregasDuplicadas(eventos: EventoCalendario[]): EventoCalendario[] {
  const cierres = new Set(eventos.filter((e) => e.tipo === 'apertura').map((e) => `${e.idCompra}|${Date.parse(e.fecha)}`));
  return eventos.filter((e) => e.tipo !== 'entrega' || !cierres.has(`${e.idCompra}|${Date.parse(e.fecha)}`));
}

// El evento se titula "Cierre de ofertas: objeto"; en la grilla se muestra solo el objeto.
export function objetoDelEvento(e: EventoCalendario): string {
  const i = e.titulo.indexOf(': ');
  return i >= 0 ? e.titulo.slice(i + 2) : e.titulo;
}

/** "Hoy", "Mañana" o "Martes 21/10" para un día yyyy-mm-dd. */
export function diaRelativo(dia: string, hoy: string): string {
  if (dia === hoy) return 'Hoy';
  const d = new Date(`${dia}T12:00:00-03:00`);
  const h = new Date(`${hoy}T12:00:00-03:00`);
  const diff = Math.round((d.getTime() - h.getTime()) / 864e5);
  if (diff === 1) return 'Mañana';
  const nombre = new Intl.DateTimeFormat('es-UY', { weekday: 'long', timeZone: 'America/Montevideo' }).format(d);
  const fecha = new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: '2-digit', timeZone: 'America/Montevideo' }).format(d);
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${fecha}`;
}
