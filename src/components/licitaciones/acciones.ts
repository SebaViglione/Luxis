'use server';

import { refresh } from 'next/cache';
import { actualizarEstadoMatch, empresaActual } from '@/lib/mocks/consultas';
import type { EstadoUsuarioMatch } from '@/lib/types';

const ESTADOS_PERMITIDOS: readonly EstadoUsuarioMatch[] = ['nuevo', 'guardada', 'descartada', 'presentada'];

export async function cambiarEstadoMatch(idCompra: string, estado: EstadoUsuarioMatch) {
  if (typeof idCompra !== 'string' || !ESTADOS_PERMITIDOS.includes(estado)) throw new Error('Pedido inválido');
  const empresa = await empresaActual();
  await actualizarEstadoMatch(empresa.id, idCompra, estado);
  refresh();
}
