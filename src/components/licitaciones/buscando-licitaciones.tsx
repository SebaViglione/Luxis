'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

const CADA_MS = 10_000;

export function BuscandoLicitaciones() {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), CADA_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card px-6 py-12 text-center">
      <LoaderCircle aria-hidden className="size-6 animate-spin text-primary motion-reduce:animate-none" />
      <div className="space-y-1">
        <p className="font-medium">Buscando licitaciones para tu barraca…</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Estamos comparando tu perfil con los llamados vigentes de ARCE. Tarda uno o dos minutos y esta página se actualiza sola.
        </p>
      </div>
    </div>
  );
}
