import { Suspense } from 'react';
import { BarraInferior, CuentaLateral, Navegacion, NavegacionActiva, NavegacionInferior } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { BotonGuia, GuiaInicial } from '@/components/guia/guia-inicial';
import { Logo } from '@/components/marca/logo';
import { datosNavegacion } from '@/server/consultas/navegacion';

async function contadores() {
  const d = await datosNavegacion();
  return d ? { noLeidas: d.noLeidas, enCurso: d.enCurso } : undefined;
}

async function NavegacionConDatos() {
  return <NavegacionActiva contadores={await contadores()} />;
}

async function InferiorConDatos() {
  return <NavegacionInferior contadores={await contadores()} />;
}

async function CuentaConDatos() {
  const d = await datosNavegacion();
  return d ? <CuentaLateral empresa={d.empresa} email={d.email} /> : null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <a href="#contenido" className="sr-only rounded-md bg-card px-3 py-2 text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50">
        Saltar al contenido
      </a>
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-4 border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center px-5"><Logo href="/dashboard" /></div>
        <Suspense fallback={<Navegacion activo={null} />}>
          <NavegacionConDatos />
        </Suspense>
        <div className="mt-auto space-y-1 px-3 pb-3">
          <BotonGuia />
          <div className="border-t pt-2">
            <Suspense fallback={<div aria-hidden className="h-12 rounded-md bg-muted/60" />}>
              <CuentaConDatos />
            </Suspense>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/* En el celular deja lugar para la barra inferior fija. */}
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 md:px-8 md:py-8">{children}</main>
      </div>
      <Suspense fallback={<BarraInferior activo={null} />}>
        <InferiorConDatos />
      </Suspense>
      <Suspense fallback={null}>
        <GuiaInicial />
      </Suspense>
    </div>
  );
}
