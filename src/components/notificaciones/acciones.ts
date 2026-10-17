'use server';

import { refresh } from 'next/cache';
import { requerirSesion } from '@/server/auth/sesion';
import { marcarLeida, marcarTodasLeidas } from '@/server/notificaciones/consultas';
import { generarNotificaciones } from '@/server/notificaciones/generar';

export async function marcarNotificacionLeida(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new Error('Pedido inválido');
  const sesion = await requerirSesion();
  await marcarLeida(sesion.empresaId, id);
  refresh();
}

export async function marcarTodasNotificacionesLeidas() {
  const sesion = await requerirSesion();
  await marcarTodasLeidas(sesion.empresaId);
  refresh();
}

export async function generarMisNotificaciones(): Promise<number> {
  const sesion = await requerirSesion();
  const creadas = await generarNotificaciones(sesion.empresaId);
  refresh();
  return creadas;
}
