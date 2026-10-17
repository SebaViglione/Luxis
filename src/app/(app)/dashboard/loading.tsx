import { Skeleton } from '@/components/ui/skeleton';
import { ListaCargando } from '@/components/licitaciones/lista-cargando';

/** Feedback inmediato al navegar al dashboard (mismo layout que la página: sin saltos). */
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando tus licitaciones">
      <div className="space-y-1"><Skeleton className="h-12 w-72" /><Skeleton className="h-5 w-40" /></div>
      <Skeleton className="h-24 w-full rounded-md" />
      <Skeleton className="h-[9.5rem] w-full rounded-md" />
      <div className="min-h-[24rem] pt-2"><ListaCargando /></div>
    </div>
  );
}
