'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LadrillosCargando } from '@/components/marca/ladrillos-cargando';

const CADA_MS = 10_000;

export function BuscandoLicitaciones() {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), CADA_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div role="status" aria-live="polite" className="relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border bg-card px-6 py-14 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
      <span className="relative flex size-12 items-center justify-center rounded-xl border bg-background shadow-[0_12px_24px_-16px_rgba(27,27,27,0.35)]">
        <LadrillosCargando />
      </span>
      <div className="relative space-y-1.5">
        <p className="text-base font-semibold tracking-tight">Buscando licitaciones para tu barraca…</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Estamos comparando tu perfil con los llamados vigentes de ARCE. Tarda uno o dos minutos y esta página se actualiza sola.
        </p>
      </div>
    </div>
  );
}
