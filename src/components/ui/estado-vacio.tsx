import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EstadoVacio({ icono: Icono, titulo, descripcion, accion, className }: {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-card px-6 py-12 text-center', className)}>
      {Icono && <Icono aria-hidden className="size-6 text-muted-foreground" />}
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        {descripcion && <p className="mx-auto max-w-md text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}
