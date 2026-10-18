import { NextResponse, type NextRequest } from 'next/server';
import { empresaIdActual } from '@/server/consultas/empresa-actual';
import { evaluarEmpresa } from '@/server/ia/matching';
import { esPedidoAdmin } from '@/server/auth/admin';

export const maxDuration = 300;

/** Recalcula los matches de la empresa logueada. `?todas=1` (solo con CRON_SECRET) reevalúa todo. */
export async function POST(req: NextRequest) {
  const empresaId = await empresaIdActual();
  if (!empresaId) return NextResponse.json({ error: 'Iniciá sesión para buscar licitaciones.' }, { status: 401 });
  try {
    const r = await evaluarEmpresa(empresaId, { todas: esPedidoAdmin(req) && req.nextUrl.searchParams.get('todas') === '1' });
    return NextResponse.json(r);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: err.name === 'IANoConfigurada' ? 503 : 500 });
  }
}
