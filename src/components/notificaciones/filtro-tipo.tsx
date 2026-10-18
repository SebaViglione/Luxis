'use client';

import Link, { useLinkStatus } from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function Pendiente() {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle aria-label="Cargando" className="size-3.5 animate-spin motion-reduce:animate-none" /> : null;
}

/** Pastillas para filtrar por tipo, con spinner en la que se está cargando. */
export function FiltroTipo({ filtros, activo }: { filtros: { href: string; etiqueta: string; valor?: string }[]; activo?: string }) {
  return (
    <nav aria-label="Filtrar por tipo" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
      {filtros.map((f) => {
        const es = f.valor === activo;
        return (
          <Link key={f.etiqueta} href={f.href} aria-current={es ? 'page' : undefined} scroll={false}
            className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors',
              es ? 'border-foreground/30 bg-card font-medium text-foreground' : 'bg-background text-muted-foreground hover:bg-secondary hover:text-foreground')}>
            {f.etiqueta}<Pendiente />
          </Link>
        );
      })}
    </nav>
  );
}
