'use client';

import ScrollVelocity from '@/components/reactbits/scroll-velocity';
import { ORGANISMOS } from './ejemplos';

// Cada organismo es una pastilla propia para que se distingan uno de otro.
const FILA = (
  <span className="flex items-center gap-3 pr-3">
    {ORGANISMOS.map((o) => (
      <span key={o} className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2">
        <span aria-hidden className="size-1.5 rounded-full bg-primary" />
        {o}
      </span>
    ))}
  </span>
);

export function MarqueeOrganismos() {
  return (
    <section aria-label="Organismos que compran materiales" className="relative border-y bg-card py-8">
      <p className="mx-auto mb-5 max-w-7xl px-4 font-mono text-xs tracking-wide text-muted-foreground uppercase md:px-8">
        Organismos públicos que compran materiales de construcción
      </p>
      <div className="overflow-hidden">
        <ScrollVelocity texts={[FILA]} velocity={30} numCopies={3} fadeEdges className="text-sm font-medium text-foreground/85 md:text-base" />
      </div>
      <p className="sr-only">{ORGANISMOS.join(', ')}</p>
    </section>
  );
}
