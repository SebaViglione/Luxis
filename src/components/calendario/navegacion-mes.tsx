'use client';

import Link, { useLinkStatus } from 'next/link';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Contenido de un link que muestra un spinner mientras la navegación está pendiente. */
function ConEstado({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle aria-label="Cargando" className="animate-spin motion-reduce:animate-none" /> : <>{children}</>;
}

/** Mes anterior / Hoy / Mes siguiente, con feedback inmediato al tocar. */
export function NavegacionMes({ anterior, siguiente, esMesActual }: { anterior: string; siguiente: string; esMesActual: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <Link href={`/calendario?mes=${anterior}`} aria-label="Mes anterior" className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}>
        <ConEstado><ChevronLeft aria-hidden /></ConEstado>
      </Link>
      <Link href="/calendario" aria-disabled={esMesActual} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), esMesActual && 'pointer-events-none opacity-50')}>
        <ConEstado>Este mes</ConEstado>
      </Link>
      <Link href={`/calendario?mes=${siguiente}`} aria-label="Mes siguiente" className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}>
        <ConEstado><ChevronRight aria-hidden /></ConEstado>
      </Link>
    </div>
  );
}
