import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AsistentePostulacion } from '@/components/postulacion/asistente-postulacion';
import { Cargando } from '@/components/ui/cargando';
import { requerirSesion } from '@/server/auth/sesion';
import { obtenerDetalle } from '@/server/consultas/licitaciones';
import { leerPerfil } from '@/server/onboarding/guardar-perfil';
import { armarChecklist } from '@/server/postulacion/checklist';
import { leerAperturaElectronica, leerDatosPostulacion } from '@/server/postulacion/datos-empresa';
import type { DatosPagina } from '@/server/postulacion/tipos';

export const metadata: Metadata = { title: 'Postulación · Luxis' };

function decodificar(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export default function PaginaPostulacion({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Cargando texto="Preparando tu postulación…" />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await requerirSesion();
  const idCompra = decodificar((await params).id);
  const [d, perfil, datosPostulacion, aperturaElectronica] = await Promise.all([
    obtenerDetalle(sesion.empresaId, idCompra),
    leerPerfil(sesion.empresaId),
    leerDatosPostulacion(sesion.empresaId),
    leerAperturaElectronica(idCompra),
  ]);
  if (!d) notFound();

  const { checklist, resumen } = armarChecklist(d, perfil, { aperturaElectronica });
  const datos: DatosPagina = {
    licitacion: { ...d.licitacion, aperturaElectronica },
    items: d.items,
    ofertables: d.match?.itemsOfertables ?? [],
    precios: d.precios,
    condiciones: d.analisis?.condiciones ?? null,
    confianza: d.match?.confianza ?? null,
    estadoUsuario: d.match?.estadoUsuario ?? null,
    empresa: {
      nombre: perfil.nombre,
      razonSocial: perfil.razonSocial,
      rut: perfil.rut,
      telefono: perfil.telefono,
      emailContacto: perfil.emailContacto,
      web: perfil.web,
      departamento: perfil.departamento,
      localidad: perfil.localidad,
      descripcion: perfil.descripcion,
      experienciaLicitaciones: perfil.experienciaLicitaciones,
      productos: perfil.productos,
    },
    datosPostulacion,
    checklist,
    resumen,
  };
  return <AsistentePostulacion datos={datos} />;
}
