import { sql } from 'drizzle-orm';
import { db } from '@/db';

type Cobertura = { licitacionesRubro: number; adjudicaciones: number; articulosConHistorial: number; pliegosLeidos: number; ultimaIngesta: string | null };
let cache: { valor: Cobertura; vence: number } | null = null;

/** Números de cobertura (consultas pesadas): se cachean 5 minutos en memoria. */
export async function coberturaDatos(): Promise<Cobertura> {
  if (cache && cache.vence > Date.now()) return cache.valor;
  const valor = await calcularCobertura();
  cache = { valor, vence: Date.now() + 5 * 60_000 };
  return valor;
}

async function calcularCobertura(): Promise<Cobertura> {
  const [r] = await db.execute<{
    licitaciones_rubro: string; adjudicaciones: string; articulos: string; pliegos: string; ultima: string | null;
  }>(sql`
    select
      (select count(*) from licitaciones where es_rubro and fecha_tope_ofertas > now())::text as licitaciones_rubro,
      (select count(*) from adjudicaciones)::text as adjudicaciones,
      (select count(distinct coalesce(nullif(id_articulo,0)::text, desc_normalizada)) from adjudicaciones)::text as articulos,
      (select count(distinct id_compra) from licitacion_archivos where estado_extraccion = 'ok')::text as pliegos,
      (select max(created_at)::text from ingesta_corridas) as ultima
  `);
  return {
    licitacionesRubro: Number(r?.licitaciones_rubro ?? 0),
    adjudicaciones: Number(r?.adjudicaciones ?? 0),
    articulosConHistorial: Number(r?.articulos ?? 0),
    pliegosLeidos: Number(r?.pliegos ?? 0),
    ultimaIngesta: r?.ultima ?? null,
  };
}
