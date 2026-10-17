import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="Luxis, inicio" className={cn('inline-flex items-center gap-2 text-foreground', className)}>
      <span aria-hidden className="size-3 rounded-[2px] bg-primary" />
      <span className="text-lg leading-none font-semibold tracking-tighter">Luxis</span>
    </Link>
  );
}
