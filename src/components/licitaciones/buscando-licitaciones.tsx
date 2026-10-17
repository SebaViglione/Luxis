'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LadrillosCargando } from '@/components/marca/ladrillos-cargando';

const CADA_MS = 10_000;

interface Progreso {
  evaluadas?: number;
  total?: number;
}

/** Mientras corre el matching, refresca la página cada 10 s para que vayan apareciendo las licitaciones. */
function useRefrescoPeriodico() {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), CADA_MS);
    return () => window.clearInterval(id);
  }, [router]);
}

function BarraProgreso({ evaluadas, total }: Required<Progreso>) {
  const porcentaje = total > 0 ? Math.round((evaluadas / total) * 100) : 0;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={evaluadas}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${porcentaje}%` }} />
    </div>
  );
}

const textoProgreso = ({ evaluadas, total }: Progreso) =>
  total ? `Van ${evaluadas} de ${total} licitaciones evaluadas.` : null;

/** Pantalla completa cuando todavía no apareció ninguna licitación. */
export function BuscandoLicitaciones({ evaluadas, total }: Progreso = {}) {
  useRefrescoPeriodico();
  const progreso = textoProgreso({ evaluadas, total });

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
        {progreso && <p className="font-mono text-xs text-muted-foreground tabular-nums">{progreso}</p>}
      </div>
      {total ? (
        <div className="relative w-full max-w-xs">
          <BarraProgreso evaluadas={evaluadas ?? 0} total={total} />
        </div>
      ) : null}
    </div>
  );
}

/** Aviso arriba de la lista cuando ya aparecieron algunas pero el matching sigue corriendo. */
export function SiguenLlegando({ evaluadas, total }: Required<Progreso>) {
  useRefrescoPeriodico();
  return (
    <div role="status" aria-live="polite" className="space-y-2 rounded-md border bg-card px-4 py-3">
      <div className="flex items-center gap-3 text-sm">
        <LadrillosCargando className="size-4 shrink-0" />
        <p>
          <span className="font-medium">Seguimos buscando.</span>{' '}
          <span className="text-muted-foreground">
            {textoProgreso({ evaluadas, total })} La lista se actualiza sola.
          </span>
        </p>
      </div>
      <BarraProgreso evaluadas={evaluadas} total={total} />
    </div>
  );
}
