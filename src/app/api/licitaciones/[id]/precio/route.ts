import { NextResponse, type NextRequest } from 'next/server';
import { calcularPrecios, leerPrecios } from '@/server/ia/precio';

/** Precio ganador histórico por ítem. `?recalcular=1` recalcula desde las adjudicaciones. */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/licitaciones/[id]/precio'>) {
  const { id } = await ctx.params;
  const recalcular = req.nextUrl.searchParams.get('recalcular') === '1';
  let precios = recalcular ? [] : await leerPrecios(id);
  if (!precios.length) precios = await calcularPrecios(id);
  return NextResponse.json(precios);
}
