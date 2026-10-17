import { Skeleton } from '@/components/ui/skeleton';
import { ListaCargando } from '@/components/licitaciones/lista-cargando';

/** Feedback inmediato al navegar al dashboard (mismo layout que la página: sin saltos). */
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando tus licitaciones">
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-[13rem] w-full rounded-md" />
      <div className="min-h-[24rem] pt-2"><ListaCargando /></div>
    </div>
  );
}
