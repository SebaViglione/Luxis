// Datos de la empresa que piden los formularios de postulación y no están en el perfil
// (domicilio, representante, CI). Se guardan dentro de empresas.perfil_json sin tocar el schema.
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { empresas, licitaciones } from '@/db/schema';
import type { DatosPostulacion } from './tipos';

const textoCorto = z.string().trim().max(200).optional().or(z.literal('').transform(() => undefined));

export const esquemaDatosPostulacion = z.object({
  domicilio: textoCorto,
  ciudad: textoCorto,
  codigoPostal: z.string().trim().max(12).optional().or(z.literal('').transform(() => undefined)),
  representante: textoCorto,
  ciRepresentante: z
    .string()
    .trim()
    .regex(/^[0-9.\-\s]{6,14}$/, 'Ingresá la cédula con números (ej. 1.234.567-8).')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  cargoRepresentante: textoCorto,
  emailNotificaciones: z.email('Email inválido.').optional().or(z.literal('').transform(() => undefined)),
}) satisfies z.ZodType<DatosPostulacion, unknown>;

export async function leerDatosPostulacion(empresaId: string): Promise<DatosPostulacion> {
  const [fila] = await db
    .select({ datos: sql<DatosPostulacion | null>`${empresas.perfilJson} -> 'datosPostulacion'` })
    .from(empresas)
    .where(eq(empresas.id, empresaId))
    .limit(1);
  return fila?.datos ?? {};
}

export async function guardarDatosPostulacion(empresaId: string, datos: DatosPostulacion) {
  await db
    .update(empresas)
    .set({
      perfilJson: sql`jsonb_set(coalesce(${empresas.perfilJson}, '{}'::jsonb), '{datosPostulacion}', ${JSON.stringify(datos)}::jsonb)`,
      updatedAt: new Date(),
    })
    .where(eq(empresas.id, empresaId));
}

/** El detalle de seba no expone apertura_electronica: lo leemos directo. */
export async function leerAperturaElectronica(idCompra: string): Promise<boolean> {
  const [fila] = await db
    .select({ apertura: licitaciones.aperturaElectronica })
    .from(licitaciones)
    .where(eq(licitaciones.idCompra, idCompra))
    .limit(1);
  return Boolean(fila?.apertura);
}
