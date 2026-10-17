import { sql } from 'drizzle-orm';
import { db } from '@/db';
import type { EventoCalendario, FechaClave } from '@/lib/types';

/** Eventos de calendario de las licitaciones con match no descartado (fechas de ARCE + fechas clave del pliego). */
export async function listarEventos(empresaId: string, desde: Date, hasta: Date): Promise<EventoCalendario[]> {
  const filas = await db.execute<{
    id_compra: string; objeto: string | null; tope: Date | null; aclar: Date | null; prorr: Date | null; entrega: Date | null; fechas: FechaClave[] | null;
  }>(sql`
    select l.id_compra, l.objeto, l.fecha_tope_ofertas as tope, l.fecha_sol_aclar as aclar, l.fecha_sol_prorr as prorr, l.fecha_tope_entrega as entrega, a.fechas_clave as fechas
    from matches m join licitaciones l on l.id_compra = m.id_compra left join analisis_licitacion a on a.id_compra = m.id_compra
    where m.empresa_id = ${empresaId} and m.confianza >= 40 and m.estado_usuario <> 'descartada'`);
  const out: EventoCalendario[] = [];
  const corto = (s: string | null) => (s ?? 'Licitación').replace(/\s+/g, ' ').slice(0, 70);
  const push = (id: string, tipo: EventoCalendario['tipo'], f: Date | string | null, titulo: string, descripcion: string | null, obligatoria: boolean) => {
    if (!f) return;
    const d = new Date(f);
    if (Number.isNaN(d.getTime()) || d < desde || d > hasta) return;
    out.push({ id: `${id}:${tipo}:${d.getTime()}`, idCompra: id, tipo, fecha: d.toISOString(), titulo, descripcion, obligatoria });
  };
  for (const r of filas) {
    const o = corto(r.objeto);
    push(r.id_compra, 'apertura', r.tope, `Cierre de ofertas: ${o}`, null, true);
    push(r.id_compra, 'consultas', r.aclar, `Último día para consultas: ${o}`, null, false);
    push(r.id_compra, 'prorroga', r.prorr, `Último día para pedir prórroga: ${o}`, null, false);
    for (const f of r.fechas ?? []) {
      if (!f.fecha || f.tipo === 'apertura') continue;
      const tipo = (['visita', 'consultas', 'prorroga', 'entrega'] as const).find((t) => t === f.tipo) ?? 'otro';
      push(r.id_compra, tipo, f.fecha, `${tipo === 'visita' ? 'Visita' : f.descripcion.slice(0, 40)}: ${o}`, f.descripcion, f.obligatoria);
    }
  }
  // Sin duplicados por (licitación, tipo, día).
  const vistos = new Set<string>();
  return out.filter((e) => { const k = `${e.idCompra}:${e.tipo}:${e.fecha.slice(0, 10)}`; if (vistos.has(k)) return false; vistos.add(k); return true; })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
