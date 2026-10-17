import { Skeleton } from '@/components/ui/skeleton';

/** Esqueleto con la forma del detalle (encabezado, datos, acciones y tabs): sin saltos al llegar el contenido. */
export function DetalleCargando() {
  return (
    <div role="status" aria-label="Cargando la licitación" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-4/5" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-28" /></div>
        ))}
      </div>
      <div className="flex gap-2" aria-hidden>
        <Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-32" />
      </div>
      <div className="flex gap-4 border-b pb-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-5 w-20" />)}
      </div>
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    </div>
  );
}
