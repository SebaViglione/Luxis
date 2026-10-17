'use server';

import { redirect } from 'next/navigation';
import type { PerfilEmpresa } from '@/lib/types';
import { erroresDeCampos } from '@/server/auth/formularios';
import { RUTAS } from '@/server/auth/rutas';
import { obtenerSesion } from '@/server/auth/sesion';
import { guardarPerfil, leerPerfil } from '@/server/onboarding/guardar-perfil';
import { calcularFaltantes, esquemaDatosEmpresa, esquemaPerfilEmpresa, type DatosEmpresa } from '@/server/onboarding/perfil';
import type { ResultadoAccion } from '@/server/onboarding/tipos';

const SESION_VENCIDA = { ok: false, error: 'Tu sesión venció. Ingresá de nuevo.' } as const;

/** Paso 1 del onboarding: datos básicos de la empresa. */
export async function guardarDatosEmpresa(datos: DatosEmpresa): Promise<ResultadoAccion<PerfilEmpresa>> {
  const sesion = await obtenerSesion();
  if (!sesion) return SESION_VENCIDA;

  const validados = esquemaDatosEmpresa.safeParse({ ...datos, rut: datos.rut?.replace(/[\s.-]/g, '') });
  if (!validados.success) {
    return { ok: false, error: 'Revisá los datos marcados.', errores: erroresDeCampos(validados.error) };
  }

  try {
    const perfil = { ...(await leerPerfil(sesion.empresaId)), ...validados.data };
    perfil.camposFaltantes = calcularFaltantes(perfil);
    await guardarPerfil(sesion.empresaId, perfil, { completo: false });
    return { ok: true, datos: perfil };
  } catch (error) {
    console.error('[onboarding] guardarDatosEmpresa', error);
    return { ok: false, error: 'No pudimos guardar los datos. Probá de nuevo.' };
  }
}

/** Último paso: guarda el perfil revisado, marca el onboarding completo, dispara el matching y va al dashboard. */
export async function confirmarPerfil(perfil: PerfilEmpresa): Promise<ResultadoAccion> {
  const sesion = await obtenerSesion();
  if (!sesion) return SESION_VENCIDA;

  const validado = esquemaPerfilEmpresa.safeParse(perfil);
  if (!validado.success) {
    return { ok: false, error: 'Revisá los datos marcados.', errores: erroresDeCampos(validado.error) };
  }
  if (validado.data.productos.length === 0) {
    return { ok: false, error: 'Agregá al menos un producto para que podamos buscarte licitaciones.' };
  }

  try {
    const final = { ...validado.data, camposFaltantes: calcularFaltantes(validado.data) };
    await guardarPerfil(sesion.empresaId, final, { completo: true });
  } catch (error) {
    console.error('[onboarding] confirmarPerfil', error);
    return { ok: false, error: 'No pudimos guardar el perfil. Probá de nuevo.' };
  }

  redirect(RUTAS.dashboard);
}
