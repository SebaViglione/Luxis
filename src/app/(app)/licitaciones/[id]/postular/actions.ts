'use server';

import { erroresDeCampos } from '@/server/auth/formularios';
import { obtenerSesion } from '@/server/auth/sesion';
import type { ResultadoAccion } from '@/server/onboarding/tipos';
import { esquemaDatosPostulacion, guardarDatosPostulacion } from '@/server/postulacion/datos-empresa';
import type { DatosPostulacion } from '@/server/postulacion/tipos';

/** Guarda domicilio, representante y CI de la empresa para completar los formularios. */
export async function guardarDatosPostulacionAccion(datos: DatosPostulacion): Promise<ResultadoAccion<DatosPostulacion>> {
  const sesion = await obtenerSesion();
  if (!sesion) return { ok: false, error: 'Tu sesión venció. Ingresá de nuevo.' };

  const validados = esquemaDatosPostulacion.safeParse(datos);
  if (!validados.success) {
    return { ok: false, error: 'Revisá los datos marcados.', errores: erroresDeCampos(validados.error) };
  }
  try {
    await guardarDatosPostulacion(sesion.empresaId, validados.data);
    return { ok: true, datos: validados.data, mensaje: 'Datos guardados.' };
  } catch (error) {
    console.error('[postulación] guardarDatosPostulacion', error);
    return { ok: false, error: 'No pudimos guardar los datos. Probá de nuevo.' };
  }
}
