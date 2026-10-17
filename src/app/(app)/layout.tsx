import { Suspense } from 'react';
import { Navegacion, NavegacionActiva } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { BotonGuia, GuiaInicial } from '@/components/guia/guia-inicial';
import { Logo } from '@/components/marca/logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <a href="#contenido" className="sr-only rounded-md bg-card px-3 py-2 text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50">
        Saltar al contenido
      </a>
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-4 border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center px-5"><Logo href="/dashboard" /></div>
        <Suspense fallback={<Navegacion activo={null} />}>
          <NavegacionActiva />
        </Suspense>
        <div className="mt-auto px-3 pb-4">
          <BotonGuia />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <GuiaInicial />
    </div>
  );
}
