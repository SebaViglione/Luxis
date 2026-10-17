'use client';

import type { ReactNode } from 'react';
import DotGrid from '@/components/reactbits/dot-grid';
import Noise from '@/components/reactbits/noise';
import Threads from '@/components/reactbits/threads';
import { cn } from '@/lib/utils';

// Fondos animados de reactbits en la paleta papel/tinta/ladrillo. Todos escuchan el puntero en
// window, así que van con pointer-events-none, y se pausan solos fuera de pantalla.

/** Capa que acompaña el scroll de la sección: el canvas mide un viewport, no la sección entera. */
function CapaFija({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-clip', className)}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">{children}</div>
    </div>
  );
}

/** Grano de papel sobre toda la página. */
export function FondoGrano() {
  return <Noise fixed opacity={0.035} fps={12} blendMode="multiply" contrast={0.5} zIndex={0} />;
}

/** Grilla de puntos que se aparta del puntero, para "Cómo funciona". */
export function FondoPuntos() {
  return (
    <CapaFija className="[mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
      <DotGrid dotSize={2.5} gap={26} baseColor="#dcd8cf" activeColor="#C4502B" proximity={160} glow={0} clickShock={false} fade={0.35} opacity={0.9} />
    </CapaFija>
  );
}

/** Hilos finos en tinta que acompañan el scroll, para "Funciones". */
export function FondoHilos() {
  return (
    <CapaFija className="[mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
      <Threads color="#1b1b1b" accentColor="#C4502B" amplitude={1} distance={0.25} lineCount={48} thickness={0.4} speed={0.25} angle={-18} opacity={0.18} enableMouseInteraction />
    </CapaFija>
  );
}

/** Hilos claros sobre la franja ladrillo del cierre. */
export function FondoLadrillo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <Threads color="#ffffff" amplitude={1.1} distance={0.3} lineCount={56} thickness={0.45} speed={0.3} angle={12} opacity={0.22} enableMouseInteraction />
    </div>
  );
}

/** Hilos ladrillo sobre tinta, para la sección de datos. */
export function FondoTinta() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_left,black,transparent_85%)]">
      <Threads color="#C4502B" amplitude={1} distance={0.25} lineCount={60} thickness={0.45} speed={0.25} angle={-10} opacity={0.5} enableMouseInteraction />
    </div>
  );
}
