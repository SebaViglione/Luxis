import { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { Logo } from '@/components/marca/logo';
import { Button } from '@/components/ui/button';
import { empresaActual } from '@/lib/mocks/consultas';
import { Campanita } from './campanita';
import { MenuMovil } from './menu-movil';

async function NombreEmpresa() {
  const empresa = await empresaActual();
  return <span className="truncate text-sm font-medium">{empresa.nombre}</span>;
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4 md:px-8">
      <MenuMovil />
      <Logo href="/dashboard" className="md:hidden" />
      <div className="flex min-w-0 flex-1 justify-end md:justify-start">
        <Suspense fallback={<span className="h-4 w-36 rounded-sm bg-muted" aria-hidden />}>
          <NombreEmpresa />
        </Suspense>
      </div>
      <Campanita noLeidas={0} />
      <span title="Se habilita cuando la app esté conectada a los datos de ARCE">
        <Button variant="outline" size="sm" disabled className="hidden sm:inline-flex">
          <RefreshCw aria-hidden /> Actualizar
        </Button>
      </span>
    </header>
  );
}
