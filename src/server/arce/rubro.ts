import { RUBRO_BARRACA } from '@/config/rubro-barraca';
import { normalizarTexto, type CompraNormalizada } from './normalizar';

function compilar(lista: readonly string[]): RegExp {
  const alts = [...lista]
    .map((k) => normalizarTexto(k))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<![A-Z0-9Ñ])(?:${alts.join('|')})(?![A-Z0-9Ñ])`);
}

const RX_INCLUIR = compilar(RUBRO_BARRACA.incluir);
const RX_EXCLUIR = compilar(RUBRO_BARRACA.excluir);

/** ¿Este texto (descripción de ítem u objeto) pertenece al rubro barraca? */
export function esRubro(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const n = normalizarTexto(texto);
  if (!RX_INCLUIR.test(n)) return false;
  return !RX_EXCLUIR.test(n);
}

/** Qué keyword disparó el match (para explicar y depurar). */
export function keywordRubro(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const n = normalizarTexto(texto);
  if (RX_EXCLUIR.test(n)) return null;
  const m = RX_INCLUIR.exec(n);
  return m ? m[0] : null;
}

/** Una compra es del rubro si algún ítem o el objeto matchea. */
export function compraEsRubro(c: Pick<CompraNormalizada, 'objeto' | 'items' | 'adjudicaciones'>): boolean {
  if (c.items.some((i) => esRubro(i.descArticulo))) return true;
  if (c.adjudicaciones.some((a) => esRubro(a.descArticulo))) return true;
  return esRubro(c.objeto);
}
