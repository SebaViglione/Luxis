import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Estado vacío de la marca: ícono en baldosa, título 600 y una salida concreta (docs/07-marca.md §9). */
export function EstadoVacio({ icono: Icono, titulo, descripcion, accion, className }: {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex animate-in flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border bg-card px-6 py-14 text-center duration-500 fade-in-0 slide-in-from-bottom-2',
        className,
      )}
    >
      {/* Grilla de puntos de la marca, desvanecida hacia los bordes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]"
      />
      {Icono && (
        <span className="relative flex size-12 items-center justify-center rounded-xl border bg-background shadow-[0_12px_24px_-16px_rgba(27,27,27,0.35)]">
          <Icono aria-hidden className="size-5 text-primary" />
        </span>
      )}
      <div className="relative space-y-1.5">
        <p className="text-base font-semibold tracking-tight">{titulo}</p>
        {descripcion && <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{descripcion}</p>}
      </div>
      {accion && <div className="relative">{accion}</div>}
    </div>
  );
}
