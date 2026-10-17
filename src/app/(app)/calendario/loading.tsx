import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div role="status" aria-label="Armando tu calendario" className="space-y-4">
      <div className="flex items-center justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-8 w-40" /></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid grid-cols-7 gap-1" aria-hidden>
          {Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
        <div className="space-y-2" aria-hidden>{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      </div>
    </div>
  );
}
