'use server';

import { eq, and } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { EstadoUsuarioMatch } from '@/lib/types';

export async function actualizarEstadoMatch(empresaId: string, idCompra: string, estado: EstadoUsuarioMatch) {
  await db.update(schema.matches)
    .set({ estadoUsuario: estado, updatedAt: new Date() })
    .where(and(eq(schema.matches.empresaId, empresaId), eq(schema.matches.idCompra, idCompra)));
}
