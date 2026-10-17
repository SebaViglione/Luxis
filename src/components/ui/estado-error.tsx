'use client';

import { RotateCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EstadoError({ titulo = 'No pudimos cargar esta información', descripcion, onReintentar }: {
  titulo?: string;
  descripcion?: string;
  onReintentar?: () => void;
}) {
  return (
    <div role="alert" className="flex animate-in flex-col items-center justify-center gap-4 rounded-xl border border-error/25 bg-error-suave/60 px-6 py-14 text-center duration-500 fade-in-0">
      <span className="flex size-12 items-center justify-center rounded-xl border border-error/20 bg-background">
        <TriangleAlert aria-hidden className="size-5 text-error" />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight">{titulo}</p>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          {descripcion ?? 'Puede ser un problema de conexión o que el portal de ARCE esté lento. Probá de nuevo en unos segundos.'}
        </p>
      </div>
      {onReintentar && (
        <Button variant="outline" className="rounded-full" onClick={onReintentar}>
          <RotateCw aria-hidden /> Reintentar
        </Button>
      )}
    </div>
  );
}
