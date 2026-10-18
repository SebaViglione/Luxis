import { Suspense } from 'react';
import { Logo } from '@/components/marca/logo';
import { datosNavegacion } from '@/server/consultas/navegacion';
import { BotonActualizar } from './boton-actualizar';
import { Campanita } from './campanita';

async function DatosSesion() {
  const d = await datosNavegacion();
  if (!d) return null;
  return (
    <>
      <Campanita noLeidas={d.noLeidas} ultimas={d.ultimas} />
      <BotonActualizar />
    </>
  );
}

/**
 * Barra superior: en el celular, la marca; siempre, los avisos y la búsqueda de novedades a la derecha.
 * La navegación vive en la barra lateral (computadora) o en la barra inferior (celular).
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <Logo href="/dashboard" className="md:hidden" />
      <div className="flex-1" />
      <Suspense fallback={<span aria-hidden className="h-8 w-40 rounded-md bg-muted" />}>
        <DatosSesion />
      </Suspense>
    </header>
  );
}
