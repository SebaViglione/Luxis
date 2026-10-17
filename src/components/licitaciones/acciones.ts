'use server';

import { refresh } from 'next/cache';
import { requerirSesion } from '@/server/auth/sesion';
import { actualizarEstadoMatch } from '@/server/consultas/acciones';
import type { EstadoUsuarioMatch } from '@/lib/types';

const ESTADOS_PERMITIDOS: readonly EstadoUsuarioMatch[] = ['nuevo', 'guardada', 'descartada', 'presentada'];

export async function cambiarEstadoMatch(idCompra: string, estado: EstadoUsuarioMatch) {
  if (typeof idCompra !== 'string' || !idCompra || !ESTADOS_PERMITIDOS.includes(estado)) throw new Error('Pedido inválido');
  const sesion = await requerirSesion();
  await actualizarEstadoMatch(sesion.empresaId, idCompra, estado);
  refresh();
}
