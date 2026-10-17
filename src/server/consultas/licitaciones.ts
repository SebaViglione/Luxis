import type { DetalleLicitacion, FiltrosDashboard, LicitacionCard } from '@/lib/types';

/** Lista de licitaciones con match para el dashboard. Implementación real en S2. */
export async function listarMatches(_empresaId: string, _filtros: FiltrosDashboard = {}): Promise<LicitacionCard[]> {
  return [];
}

export async function resumenDashboard(_empresaId: string): Promise<{ total: number; cierranSemana: number; nuevas24h: number }> {
  return { total: 0, cierranSemana: 0, nuevas24h: 0 };
}

export async function obtenerDetalle(_empresaId: string, _idCompra: string): Promise<DetalleLicitacion | null> {
  return null;
}
