import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variante = 'color' | 'claro';

// La marca: una "L" de cuatro ladrillos en aparejo que se van llenando de abajo hacia arriba,
// como una pared que se levanta. Grilla de 24, juntas de 2, esquinas de 1.2.
// Reglas de uso en docs/07-marca.md.
const LADRILLOS = [
  { x: 1, y: 1, w: 9, opacidad: 0.4 },
  { x: 1, y: 9, w: 9, opacidad: 0.7 },
  { x: 1, y: 17, w: 9, opacidad: 1 },
  { x: 12, y: 17, w: 11, opacidad: 1 },
];

export function LogoMarca({ variante = 'color', className }: { variante?: Variante; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('size-5 shrink-0', variante === 'color' ? 'text-primary' : 'text-white', className)}
    >
      {LADRILLOS.map((l) => (
        <rect key={`${l.x}-${l.y}`} x={l.x} y={l.y} width={l.w} height={6} rx={1.2} fill="currentColor" fillOpacity={l.opacidad} />
      ))}
    </svg>
  );
}

export function Logo({ href = '/', className, variante = 'color' }: { href?: string; className?: string; variante?: Variante }) {
  return (
    <Link
      href={href}
      aria-label="Luxis, inicio"
      className={cn('inline-flex items-center gap-2', variante === 'color' ? 'text-foreground' : 'text-white', className)}
    >
      <LogoMarca variante={variante} />
      <span className="text-lg leading-none font-semibold tracking-tighter">Luxis</span>
    </Link>
  );
}
