'use client';

import { RotateCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EstadoError({ titulo = 'No pudimos cargar esta información', descripcion, onReintentar }: {
  titulo?: string;
  descripcion?: string;
  onReintentar?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-md border border-error/30 bg-error-suave px-6 py-12 text-center">
      <TriangleAlert aria-hidden className="size-6 text-error" />
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {descripcion ?? 'Puede ser un problema de conexión o que el portal de ARCE esté lento. Probá de nuevo en unos segundos.'}
        </p>
      </div>
      {onReintentar && (
        <Button variant="outline" onClick={onReintentar}>
          <RotateCw aria-hidden /> Reintentar
        </Button>
      )}
    </div>
  );
}
