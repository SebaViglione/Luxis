import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando notificaciones" className="space-y-4">
      <div className="flex items-center justify-between"><Skeleton className="h-8 w-56" /><Skeleton className="h-8 w-36" /></div>
      <div className="flex gap-2" aria-hidden>{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-7 w-24" />)}</div>
      <div className="space-y-2" aria-hidden>{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
    </div>
  );
}
