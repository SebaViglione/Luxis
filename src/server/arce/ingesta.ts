import { generarReporte } from './xml';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { upsertLlamados, upsertAdjudicaciones, registrarCorrida } from './guardar';

const DIA = 24 * 3600 * 1000;
type Log = (msg: string) => void;
const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** Llamados vigentes publicados o modificados en [desde, hasta]. */
export async function ingestarVigentes(desde: Date, hasta: Date, log: Log = () => {}, red: { timeoutMs?: number; intentos?: number } = {}) {
  const t0 = Date.now();
  try {
    const compras = await generarReporte('lv', desde, hasta, {
      ...red,
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

/** Adjudicaciones publicadas en [desde, hasta]. Ventanas de 10 días, `concurrencia` en paralelo, de la más reciente a la más vieja. */
export async function ingestarAdjudicaciones(desde: Date, hasta: Date, log: Log = () => {}, concurrencia = 1) {
  const t0 = Date.now();
  const tot = { compras: 0, adjudicaciones: 0, oferentes: 0, errores: 0 };
  const vs: Array<{ desde: Date; hasta: Date }> = [];
  for (let ini = desde; ini < hasta; ) {
    const fin = new Date(Math.min(ini.getTime() + 10 * DIA - 1000, hasta.getTime()));
    vs.push({ desde: ini, hasta: fin });
    ini = new Date(fin.getTime() + 1000);
  }
  vs.reverse();
  let k = 0;
  const trabajador = async () => {
    while (k < vs.length) {
      const v = vs[k++];
      const t = Date.now();
      try {
        const compras = await generarReporte('a', v.desde, v.hasta);
        const r = await upsertAdjudicaciones(compras);
        tot.compras += r.compras; tot.adjudicaciones += r.adjudicaciones; tot.oferentes += r.oferentes;
        log(`  adjudicaciones ${fmt(v.desde)}→${fmt(v.hasta)}: ${compras.length} compras, ${r.adjudicaciones} filas del rubro (${Date.now() - t} ms) · total ${tot.adjudicaciones}`);
      } catch (e) {
        tot.errores++;
        log(`  ✗ ventana ${fmt(v.desde)}→${fmt(v.hasta)}: ${(e as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrencia) }, trabajador));
  await registrarCorrida({
    tipo: 'adjudicaciones', desde, hasta, compras: tot.compras, adjudicaciones: tot.adjudicaciones, duracionMs: Date.now() - t0,
    estado: tot.errores ? 'parcial' : 'ok', error: tot.errores ? `${tot.errores} ventanas con error` : null,
  });
  return tot;
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

/**
 * Refresh para el botón "Actualizar": solo llamados vigentes nuevos desde la última corrida exitosa (−1 h de margen,
 * máximo `dias`), con timeout corto. Si hubo un refresh exitoso hace menos de 10 min, no vuelve a pedirle a ARCE.
 */
export async function refreshRapido(dias = 2) {
  const [ult] = await db.execute<{ hasta: string | null; reciente: boolean }>(sql`
    select max(hasta)::text as hasta,
      coalesce(bool_or(tipo = 'refresh' and estado = 'ok' and created_at > now() - interval '10 minutes'), false) as reciente
    from ingesta_corridas where tipo in ('vigentes', 'refresh') and estado = 'ok'`);
  if (ult?.reciente) return { omitido: true as const, compras: 0, items: 0, rubro: 0 };
  const hasta = new Date();
  const minimo = hasta.getTime() - dias * DIA;
  const desde = new Date(Math.max(minimo, ult?.hasta ? new Date(ult.hasta).getTime() - 3600_000 : minimo));
  const t0 = Date.now();
  const v = await ingestarVigentes(desde, hasta, () => {}, { timeoutMs: 35_000, intentos: 2 });
  await registrarCorrida({ tipo: 'refresh', desde, hasta, compras: v.compras, items: v.items, duracionMs: Date.now() - t0 });
  return { omitido: false as const, ...v };
}
