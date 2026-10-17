'use client';

import ScrollVelocity from '@/components/reactbits/scroll-velocity';
import { ORGANISMOS } from './ejemplos';

export function MarqueeOrganismos() {
  return (
    <section aria-label="Organismos que compran materiales" className="border-y bg-card py-6">
      <p className="mx-auto mb-4 max-w-6xl px-4 font-mono text-xs tracking-wide text-muted-foreground uppercase md:px-8">
        Organismos públicos que compran materiales de construcción
      </p>
      <div className="overflow-hidden">
        <ScrollVelocity
          texts={[ORGANISMOS.join('   ·   ')]}
          velocity={40}
          numCopies={4}
          separator={<span aria-hidden className="px-3 text-primary">·</span>}
          fadeEdges
          className="text-xl font-medium tracking-tight text-foreground/80 md:text-2xl"
        />
      </div>
    </section>
  );
}
