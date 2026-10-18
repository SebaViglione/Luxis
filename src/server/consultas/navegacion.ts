import 'server-only';
import { cache } from 'react';
import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { obtenerSesion } from '@/server/auth/sesion';
import { contarNoLeidas, listarNotificaciones } from '@/server/notificaciones/consultas';

/**
 * Lo que muestran la barra lateral, la barra inferior (celular) y la superior: nombre de la empresa,
 * avisos sin leer y cuántas licitaciones están en curso. Una sola tanda de consultas por request.
 */
export const datosNavegacion = cache(async () => {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  const M = schema.matches;
  const [[empresa], noLeidas, ultimas, [enCurso]] = await Promise.all([
    db.select({ nombre: schema.empresas.nombre }).from(schema.empresas).where(eq(schema.empresas.id, sesion.empresaId)),
    contarNoLeidas(sesion.empresaId),
    listarNotificaciones(sesion.empresaId, { limite: 5 }),
    // Mismo criterio que listarEnCurso: presentadas, y guardadas que todavía no tienen adjudicación.
    db.select({ n: sql<number>`count(*)::int` }).from(M).where(and(
      eq(M.empresaId, sesion.empresaId),
      sql`(${M.estadoUsuario} = 'presentada' or (${M.estadoUsuario} = 'guardada' and not exists (select 1 from adjudicaciones a where a.id_compra = ${M.idCompra})))`,
    )),
  ]);
  return {
    empresa: empresa?.nombre ?? '',
    email: sesion.email,
    noLeidas,
    ultimas,
    enCurso: enCurso?.n ?? 0,
  };
});

export type DatosNavegacion = NonNullable<Awaited<ReturnType<typeof datosNavegacion>>>;
