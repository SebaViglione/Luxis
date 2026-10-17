import { connection } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import { refresh } from '@/server/arce/ingesta';

export const maxDuration = 300;

/**
 * Refresh incremental de ARCE. Lo llaman el cron de Vercel (GET con Bearer CRON_SECRET) y el botón "Actualizar" (POST).
 * TODO S2: recalcular matches y llamar generarNotificaciones por empresa al final.
 */
async function handler(req: NextRequest) {
  await connection();
  const secreto = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const esCron = secreto && auth === `Bearer ${secreto}`;
  const mismoOrigen = req.method === 'POST' && req.headers.get('origin') === req.nextUrl.origin;
  if (!esCron && !mismoOrigen) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const dias = Math.min(Math.max(Number(req.nextUrl.searchParams.get('dias') ?? 2), 1), 10);
  try {
    const r = await refresh(dias);
    return NextResponse.json({ ok: true, dias, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}

export { handler as GET, handler as POST };
