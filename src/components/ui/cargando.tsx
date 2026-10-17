import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Cargando({ texto, className }: { texto: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground', className)}>
      <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
      {texto}
    </div>
  );
}
