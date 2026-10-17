// Cuánto baja la confianza de un match según lo difícil que es presentarse (decisión de rafa).
// Fuente única: la usa la página de postulación para explicarlo y seba para la confianza efectiva.
import type { EstadoDocumental } from '@/lib/types';

export const AJUSTE_DOCUMENTAL: Record<EstadoDocumental, number> = {
  cumple: 0,
  alcanzable: 10,
  dificil: 25,
  desconocido: 0,
};

export function ajusteConfianza(estado: EstadoDocumental | null | undefined): number {
  return estado ? (AJUSTE_DOCUMENTAL[estado] ?? 0) : 0;
}

export function textoAjuste(estado: EstadoDocumental | null | undefined): string | null {
  const ajuste = ajusteConfianza(estado);
  if (!ajuste) return null;
  return estado === 'dificil'
    ? `Esto le resta ${ajuste} puntos a la confianza: hay cosas que pueden dejarte afuera de esta licitación.`
    : `Esto le resta ${ajuste} puntos a la confianza: te faltan cosas para presentarte, pero llegás antes del cierre.`;
}
