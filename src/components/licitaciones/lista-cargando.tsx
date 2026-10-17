import { Skeleton } from '@/components/ui/skeleton';

/** Esqueleto con la forma de CardLicitacion: ocupa el mismo lugar que la lista y no hay saltos al cargar. */
export function ListaCargando({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <div role="status" aria-label="Buscando licitaciones para tu empresa" className="space-y-3">
      <Skeleton className="h-4 w-56" />
      <ul className="space-y-3" aria-hidden>
        {Array.from({ length: cantidad }, (_, i) => (
          <li key={i} className="rounded-md border bg-card p-4 sm:p-5" style={{ opacity: 1 - i * 0.22 }}>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-1.5 pt-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <Skeleton className="h-16 w-[4.5rem] shrink-0" />
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-7 w-28" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
