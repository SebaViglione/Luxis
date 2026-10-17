import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { empresas, perfilesUsuario } from '@/db/schema';

export interface Cuenta {
  usuarioId: string;
  email: string;
  nombre: string | null;
  empresaId: string;
  estadoOnboarding: string;
}

export async function buscarCuenta(usuarioId: string): Promise<Cuenta | null> {
  const [fila] = await db
    .select({
      usuarioId: perfilesUsuario.id,
      email: perfilesUsuario.email,
      nombre: perfilesUsuario.nombre,
      empresaId: perfilesUsuario.empresaId,
      estadoOnboarding: empresas.estadoOnboarding,
    })
    .from(perfilesUsuario)
    .leftJoin(empresas, eq(perfilesUsuario.empresaId, empresas.id))
    .where(eq(perfilesUsuario.id, usuarioId))
    .limit(1);

  if (!fila?.empresaId) return null;
  return { ...fila, empresaId: fila.empresaId, estadoOnboarding: fila.estadoOnboarding ?? 'pendiente' };
}

/**
 * Crea la empresa (estado_onboarding = pendiente) y el perfil del usuario, o completa lo que falte.
 * Es idempotente: si el registro se cortó a mitad de camino, el próximo login lo termina.
 */
export async function crearCuenta(datos: {
  usuarioId: string;
  email: string;
  nombre: string | null;
  nombreEmpresa: string | null;
}): Promise<Cuenta> {
  const existente = await buscarCuenta(datos.usuarioId);
  if (existente) return existente;

  return db.transaction(async (tx) => {
    const [empresa] = await tx
      .insert(empresas)
      .values({ nombre: datos.nombreEmpresa?.trim() || 'Mi empresa', estadoOnboarding: 'pendiente' })
      .returning({ id: empresas.id, estadoOnboarding: empresas.estadoOnboarding });

    await tx
      .insert(perfilesUsuario)
      .values({ id: datos.usuarioId, email: datos.email, nombre: datos.nombre, empresaId: empresa.id })
      .onConflictDoUpdate({ target: perfilesUsuario.id, set: { empresaId: empresa.id } });

    return {
      usuarioId: datos.usuarioId,
      email: datos.email,
      nombre: datos.nombre,
      empresaId: empresa.id,
      estadoOnboarding: empresa.estadoOnboarding,
    };
  });
}
