import { LadrillosCargando } from '@/components/marca/ladrillos-cargando';
import { cn } from '@/lib/utils';

export function Cargando({ texto, className }: { texto: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex flex-col items-center justify-center gap-4 py-12 text-center', className)}>
      <LadrillosCargando className="size-7" />
      <p className="max-w-xs animate-in text-sm text-muted-foreground duration-500 fade-in-0">{texto}</p>
    </div>
  );
}
