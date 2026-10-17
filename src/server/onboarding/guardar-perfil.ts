import { eq, sql } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { after } from 'next/server';
import { db } from '@/db';
import { empresaDocumentos, empresaProductos, empresas } from '@/db/schema';
import type { PerfilEmpresa } from '@/lib/types';
import { completarDocumentacion, normalizarTexto, palabrasClave, perfilVacio } from './perfil';

/** Perfil guardado de la empresa (perfil_json) o uno base armado con las columnas de `empresas`. */
export async function leerPerfil(empresaId: string): Promise<PerfilEmpresa> {
  const [empresa] = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
  if (!empresa) throw new Error(`No existe la empresa ${empresaId}`);

  if (empresa.perfilJson) {
    return { ...empresa.perfilJson, documentacion: completarDocumentacion(empresa.perfilJson.documentacion ?? []) };
  }

  return {
    ...perfilVacio(empresa.nombre),
    razonSocial: empresa.razonSocial ?? undefined,
    rut: empresa.rut ?? undefined,
    departamento: empresa.departamento ?? undefined,
    localidad: empresa.localidad ?? undefined,
    web: empresa.web ?? undefined,
    telefono: empresa.telefono ?? undefined,
    emailContacto: empresa.emailContacto ?? undefined,
  };
}

/**
 * Upsert del perfil: actualiza `empresas`, reemplaza `empresa_productos` y `empresa_documentos`
 * y marca `perfil_actualizado_en` (el matching recalcula con eso). Si `completo`, marca el
 * onboarding como terminado y dispara el matching en segundo plano.
 */
export async function guardarPerfil(empresaId: string, perfil: PerfilEmpresa, { completo }: { completo: boolean }) {
  const ahora = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(empresas)
      .set({
        nombre: perfil.nombre,
        razonSocial: perfil.razonSocial ?? null,
        rut: perfil.rut ?? null,
        departamento: perfil.departamento ?? null,
        localidad: perfil.localidad ?? null,
        web: perfil.web ?? null,
        telefono: perfil.telefono ?? null,
        emailContacto: perfil.emailContacto ?? null,
        descripcion: perfil.descripcion || null,
        zonasEntrega: perfil.zonasEntrega,
        capacidadNotas: perfil.capacidadNotas ?? null,
        montoMinimo: perfil.montoMinimo == null ? null : String(perfil.montoMinimo),
        perfilJson: perfil,
        // Editar el perfil desde "Cuenta" no debe volver a abrir el onboarding.
        estadoOnboarding: completo
          ? 'completo'
          : sql`case when ${empresas.estadoOnboarding} = 'completo' then 'completo' else 'en_progreso' end`,
        perfilActualizadoEn: ahora,
        updatedAt: ahora,
      })
      .where(eq(empresas.id, empresaId));

    await tx.delete(empresaProductos).where(eq(empresaProductos.empresaId, empresaId));
    if (perfil.productos.length > 0) {
      await tx.insert(empresaProductos).values(
        perfil.productos.map((p) => ({
          empresaId,
          nombre: p.nombre,
          nombreNormalizado: normalizarTexto(p.nombre),
          categoria: p.categoria || null,
          unidad: p.unidad || null,
          precioReferencia: p.precioReferencia == null ? null : String(p.precioReferencia),
          moneda: p.moneda,
          keywords: p.keywords.length > 0 ? p.keywords : palabrasClave(p.nombre),
          fuente: p.fuente,
        })),
      );
    }

    await tx.delete(empresaDocumentos).where(eq(empresaDocumentos.empresaId, empresaId));
    if (perfil.documentacion.length > 0) {
      await tx.insert(empresaDocumentos).values(
        perfil.documentacion.map((d) => ({
          empresaId,
          tipo: d.tipo,
          nombre: d.nombre,
          estado: d.estado,
          vencimiento: d.vencimiento,
          notas: d.notas ?? null,
        })),
      );
    }
  });

  if (completo) await dispararMatching();
}

/**
 * POST /api/empresas/matching (de seba) con la sesión del usuario, después de responder.
 * Si la ruta todavía no existe o falla, solo se loguea: el usuario sigue al dashboard igual.
 */
async function dispararMatching() {
  const [almacenCookies, h] = await Promise.all([cookies(), headers()]);
  const cookie = almacenCookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const protocolo = h.get('x-forwarded-proto') ?? 'http';
  const origen = host ? `${protocolo}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

  after(async () => {
    try {
      const respuesta = await fetch(`${origen}/api/empresas/matching`, { method: 'POST', headers: { cookie } });
      if (!respuesta.ok) console.warn(`[matching] respondió ${respuesta.status}`);
    } catch (error) {
      console.warn('[matching] no se pudo disparar', error);
    }
  });
}
