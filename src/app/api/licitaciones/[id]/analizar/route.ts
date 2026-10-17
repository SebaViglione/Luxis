import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { analizarLicitacion } from '@/server/ia/analisis-pliego';
import { procesarArchivos } from '@/server/arce/procesar-archivos';
import { calcularGapParaMatch } from '@/server/ia/gap-documental';
import { empresaIdActual } from '@/server/consultas/empresa-actual';

export const maxDuration = 300;
// ARCE corta conexiones desde datacenters de EE. UU.; São Paulo es la región de Vercel más cercana a Uruguay.
export const preferredRegion = 'gru1';

/** Analiza el pliego. `?forzar=1` recalcula con el modelo fuerte. */
export async function POST(req: NextRequest, ctx: RouteContext<'/api/licitaciones/[id]/analizar'>) {
  const empresaId = await empresaIdActual();
  if (!empresaId) return NextResponse.json({ error: 'Iniciá sesión para analizar licitaciones.' }, { status: 401 });
  const { id } = await ctx.params;
  const forzar = req.nextUrl.searchParams.get('forzar') === '1';
  try {
    const [l] = await db.select({ ok: schema.licitaciones.archivosProcesados }).from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, id));
    if (!l) return NextResponse.json({ error: 'Licitación no encontrada' }, { status: 404 });
    if (!l.ok) await procesarArchivos(id);
    const analisis = await analizarLicitacion(id, { forzar, modelo: forzar ? 'fuerte' : 'rapido' });
    await calcularGapParaMatch(empresaId, id).catch(() => null);
    return NextResponse.json(analisis);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: err.name === 'IANoConfigurada' ? 503 : 500 });
  }
}
