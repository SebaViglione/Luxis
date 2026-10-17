import { connection } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { refresh } from '@/server/arce/ingesta';
import { procesarArchivos } from '@/server/arce/procesar-archivos';
import { evaluarEmpresa } from '@/server/ia/matching';
import { enParalelo } from '@/lib/ia/estructurado';
import { empresaIdActual } from '@/server/consultas/empresa-actual';

export const maxDuration = 300;

/**
 * Refresh incremental de ARCE. Lo llaman el cron de Vercel (GET con Bearer CRON_SECRET) y el botón "Actualizar" (POST con sesión).
 * 1) trae vigentes y adjudicaciones de los últimos `dias`; 2) procesa pliegos nuevos del rubro; 3) recalcula matches.
 * Las notificaciones in-app las genera generarNotificaciones (maxi) después de llamar a esta ruta.
 */
async function handler(req: NextRequest) {
  await connection();
  const secreto = process.env.CRON_SECRET;
  const esCron = !!secreto && req.headers.get('authorization') === `Bearer ${secreto}`;
  const empresaSesion = esCron ? null : await empresaIdActual();
  if (!esCron && !empresaSesion) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const dias = Math.min(Math.max(Number(req.nextUrl.searchParams.get('dias') ?? 2), 1), 10);
  try {
    const datos = await refresh(dias);
    const pendientes = await db.execute<{ id_compra: string }>(sql`
      select id_compra from licitaciones where es_rubro and not archivos_procesados and fecha_tope_ofertas > now() order by fecha_tope_ofertas limit 15`);
    await enParalelo([...pendientes], 3, (p) => procesarArchivos(p.id_compra).catch(() => null));

    const empresas = empresaSesion ? [{ id: empresaSesion }]
      : await db.select({ id: schema.empresas.id }).from(schema.empresas).where(eq(schema.empresas.estadoOnboarding, 'completo'));
    const matching: Record<string, unknown> = {};
    for (const e of empresas) {
      try { matching[e.id] = await evaluarEmpresa(e.id); }
      catch (err) { matching[e.id] = { error: (err as Error).message }; }
    }
    return NextResponse.json({ ok: true, dias, ...datos, pliegosProcesados: pendientes.length, matching });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}

export { handler as GET, handler as POST };
