// Cuánto baja la confianza de un match según lo difícil que es presentarse (decisión de rafa).
// La regla vive en src/lib/types.ts (AJUSTE_DOCUMENTAL, la aplica seba al leer los matches);
// acá solo se explica en la página de postulación.
import { AJUSTE_DOCUMENTAL, type EstadoDocumental } from '@/lib/types';

export function ajusteConfianza(estado: EstadoDocumental | null | undefined): number {
  return estado ? (AJUSTE_DOCUMENTAL[estado] ?? 0) : 0;
}

export function textoAjuste(estado: EstadoDocumental | null | undefined, ajuste = ajusteConfianza(estado)): string | null {
  if (!ajuste) return null;
  return estado === 'dificil'
    ? `Por eso la confianza del match baja ${ajuste} puntos: hay papeles que no llegás a tener antes del cierre.`
    : `Por eso la confianza del match baja ${ajuste} puntos: te faltan papeles, pero llegás a conseguirlos antes del cierre.`;
}
