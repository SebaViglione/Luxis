import { connection } from 'next/server';
import { after, NextResponse, type NextRequest } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { refresh, refreshRapido, ingestarAdjudicaciones } from '@/server/arce/ingesta';
import { generarNotificaciones } from '@/server/notificaciones/generar';
import { procesarArchivos } from '@/server/arce/procesar-archivos';
import { evaluarEmpresa } from '@/server/ia/matching';
import { enParalelo } from '@/lib/ia/estructurado';
import { empresaIdActual } from '@/server/consultas/empresa-actual';

export const maxDuration = 300;
// ARCE corta conexiones desde datacenters de EE. UU.; São Paulo es la región de Vercel más cercana a Uruguay.
export const preferredRegion = 'gru1';

/**
 * Actualización de ARCE.
 * - Botón "Actualizar" (POST con sesión): rápido. Llamados vigentes nuevos desde la última corrida, matching de los nuevos
 *   y avisos in-app, en la misma llamada (~10–30 s). Adjudicaciones y pliegos quedan en segundo plano con after().
 * - Cron diario (GET con Bearer CRON_SECRET): completo para todas las empresas.
 */
async function handler(req: NextRequest) {
  await connection();
  const secreto = process.env.CRON_SECRET;
  const esCron = !!secreto && req.headers.get('authorization') === `Bearer ${secreto}`;
  const empresaSesion = esCron ? null : await empresaIdActual();
  if (!esCron && !empresaSesion) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const dias = Math.min(Math.max(Number(req.nextUrl.searchParams.get('dias') ?? 2), 1), 10);
  try {
    if (empresaSesion) {
      // Si ARCE no responde, igual hacemos matching y avisos con lo que ya hay (no falla el botón entero).
      const vigentes = await refreshRapido(dias).catch((e) => ({ omitido: false as const, compras: 0, items: 0, rubro: 0, error: (e as Error).message }));
      const matching = await evaluarEmpresa(empresaSesion).catch((e) => ({ error: (e as Error).message }));
      const notificaciones = await generarNotificaciones(empresaSesion).catch(() => 0);
      const arceCaido = 'error' in vigentes;
      if (!arceCaido) after(() => trabajoEnSegundoPlano(dias));
      return NextResponse.json({ ok: true, dias, vigentes, matching, notificaciones, segundoPlano: !arceCaido, aviso: arceCaido ? 'ARCE no respondió: mostramos lo que ya teníamos.' : undefined });
    }

    const datos = await refresh(dias);
    await procesarPendientes();
    const empresas = await db.select({ id: schema.empresas.id }).from(schema.empresas).where(eq(schema.empresas.estadoOnboarding, 'completo'));
    const matching: Record<string, unknown> = {};
    await enParalelo(empresas, 2, async (e) => {
      try { matching[e.id] = await evaluarEmpresa(e.id); await generarNotificaciones(e.id); }
      catch (err) { matching[e.id] = { error: (err as Error).message }; }
    });
    return NextResponse.json({ ok: true, dias, ...datos, matching });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}

/** Pliegos del rubro todavía sin procesar (descarga, texto, párrafos y embeddings). */
async function procesarPendientes() {
  const pendientes = await db.execute<{ id_compra: string }>(sql`
    select id_compra from licitaciones where es_rubro and not archivos_procesados and fecha_tope_ofertas > now() order by fecha_tope_ofertas limit 15`);
  await enParalelo([...pendientes], 3, (p) => procesarArchivos(p.id_compra).catch(() => null));
  return pendientes.length;
}

/** Lo que no necesita esperar el usuario: adjudicaciones recientes (histórico de precios) y pliegos nuevos. */
async function trabajoEnSegundoPlano(dias: number) {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - dias * 864e5);
  await ingestarAdjudicaciones(desde, hasta).catch((e) => console.warn('[refresh] adjudicaciones', (e as Error).message));
  await procesarPendientes().catch((e) => console.warn('[refresh] pliegos', (e as Error).message));
}

export { handler as GET, handler as POST };
