import { and, desc, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { Notificacion } from '@/lib/types';

const N = schema.notificaciones;
export const TIPOS_NOTIFICACION: Notificacion['tipo'][] = ['nuevo_match', 'cierre_proximo', 'visita_proxima', 'aclaracion', 'doc_alcanzable', 'sistema'];

export async function listarNotificaciones(empresaId: string, opciones: { soloNoLeidas?: boolean; limite?: number; tipo?: Notificacion['tipo'] } = {}): Promise<Notificacion[]> {
  const conds = [eq(N.empresaId, empresaId)];
  if (opciones.soloNoLeidas) conds.push(eq(N.leida, false));
  if (opciones.tipo) conds.push(eq(N.tipo, opciones.tipo));
  const filas = await db.select().from(N).where(and(...conds)).orderBy(desc(N.createdAt)).limit(opciones.limite ?? 100);
  return filas.map((f) => ({
    id: f.id, tipo: f.tipo as Notificacion['tipo'], titulo: f.titulo, cuerpo: f.cuerpo ?? '', idCompra: f.idCompra, leida: f.leida, createdAt: f.createdAt.toISOString(),
  }));
}

export async function contarNoLeidas(empresaId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(N).where(and(eq(N.empresaId, empresaId), eq(N.leida, false)));
  return r?.n ?? 0;
}

// Se filtra también por empresa para que nadie marque notificaciones ajenas.
export async function marcarLeida(empresaId: string, id: number): Promise<void> {
  await db.update(N).set({ leida: true }).where(and(eq(N.id, id), eq(N.empresaId, empresaId)));
}

export async function marcarTodasLeidas(empresaId: string): Promise<void> {
  await db.update(N).set({ leida: true }).where(and(eq(N.empresaId, empresaId), eq(N.leida, false)));
}
