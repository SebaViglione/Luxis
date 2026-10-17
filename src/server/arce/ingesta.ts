import { generarReporte } from './xml';
import { upsertLlamados, upsertAdjudicaciones, registrarCorrida } from './guardar';

const DIA = 24 * 3600 * 1000;
type Log = (msg: string) => void;
const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** Llamados vigentes publicados o modificados en [desde, hasta]. */
export async function ingestarVigentes(desde: Date, hasta: Date, log: Log = () => {}) {
  const t0 = Date.now();
  try {
    const compras = await generarReporte('lv', desde, hasta, {
      onVentana: (v) => log(`  vigentes ${fmt(v.desde)}→${fmt(v.hasta)}: ${v.compras} compras (${v.ms} ms)`),
    });
    const r = await upsertLlamados(compras);
    await registrarCorrida({ tipo: 'vigentes', desde, hasta, compras: r.compras, items: r.items, duracionMs: Date.now() - t0 });
    return r;
  } catch (e) {
    await registrarCorrida({ tipo: 'vigentes', desde, hasta, estado: 'error', error: (e as Error).message, duracionMs: Date.now() - t0 });
    throw e;
  }
}

/** Adjudicaciones publicadas en [desde, hasta], guardando ventana por ventana para no perder progreso. */
export async function ingestarAdjudicaciones(desde: Date, hasta: Date, log: Log = () => {}) {
  const t0 = Date.now();
  const tot = { compras: 0, adjudicaciones: 0, oferentes: 0 };
  let ini = desde;
  try {
    while (ini < hasta) {
      const fin = new Date(Math.min(ini.getTime() + 10 * DIA - 1000, hasta.getTime()));
      const t = Date.now();
      const compras = await generarReporte('a', ini, fin);
      const r = await upsertAdjudicaciones(compras);
      tot.compras += r.compras; tot.adjudicaciones += r.adjudicaciones; tot.oferentes += r.oferentes;
      log(`  adjudicaciones ${fmt(ini)}→${fmt(fin)}: ${compras.length} compras, ${r.adjudicaciones} filas del rubro (${Date.now() - t} ms) · total ${tot.adjudicaciones}`);
      ini = new Date(fin.getTime() + 1000);
    }
    await registrarCorrida({ tipo: 'adjudicaciones', desde, hasta, compras: tot.compras, adjudicaciones: tot.adjudicaciones, duracionMs: Date.now() - t0 });
    return tot;
  } catch (e) {
    await registrarCorrida({ tipo: 'adjudicaciones', desde, hasta: ini, compras: tot.compras, adjudicaciones: tot.adjudicaciones, estado: 'error', error: (e as Error).message, duracionMs: Date.now() - t0 });
    throw e;
  }
}

/** Refresh incremental: últimos `dias` de vigentes y adjudicaciones. */
export async function refresh(dias = 2, log: Log = () => {}) {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - dias * DIA);
  const t0 = Date.now();
  const v = await ingestarVigentes(desde, hasta, log);
  const a = await ingestarAdjudicaciones(desde, hasta, log);
  await registrarCorrida({ tipo: 'refresh', desde, hasta, compras: v.compras, items: v.items, adjudicaciones: a.adjudicaciones, duracionMs: Date.now() - t0 });
  return { vigentes: v, adjudicaciones: a };
}
