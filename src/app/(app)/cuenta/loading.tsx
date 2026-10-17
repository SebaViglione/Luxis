import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando tu cuenta" className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-2" aria-hidden><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-24" /></div>
      <div className="space-y-3" aria-hidden>{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full max-w-xl" />)}</div>
    </div>
  );
}
