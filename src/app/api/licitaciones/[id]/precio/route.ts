import { NextResponse, type NextRequest } from 'next/server';
import { calcularPrecios, leerPrecios } from '@/server/ia/precio';
import { empresaIdActual } from '@/server/consultas/empresa-actual';
import { esPedidoAdmin } from '@/server/auth/admin';

/** Precio ganador histórico por ítem. `?recalcular=1` (solo con CRON_SECRET) recalcula desde las adjudicaciones. */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/licitaciones/[id]/precio'>) {
  const admin = esPedidoAdmin(req);
  if (!admin && !(await empresaIdActual())) return NextResponse.json({ error: 'Iniciá sesión para ver precios.' }, { status: 401 });
  const { id } = await ctx.params;
  const recalcular = admin && req.nextUrl.searchParams.get('recalcular') === '1';
  let precios = recalcular ? [] : await leerPrecios(id);
  if (!precios.length) precios = await calcularPrecios(id);
  return NextResponse.json(precios);
}
