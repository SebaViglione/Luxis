'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

// El logo como indicador de carga: los ladrillos se apoyan de abajo hacia arriba, como una pared
// que se levanta, y vuelven a empezar. Misma geometría que LogoMarca.
const ORDEN = [
  { x: 12, y: 17, w: 11 },
  { x: 1, y: 17, w: 9 },
  { x: 1, y: 9, w: 9 },
  { x: 1, y: 1, w: 9 },
];

export function LadrillosCargando({ className }: { className?: string }) {
  const reducido = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-6 shrink-0 overflow-visible text-primary', className)}>
      {ORDEN.map((l, i) => (
        <motion.rect
          key={`${l.x}-${l.y}`}
          x={l.x}
          y={l.y}
          width={l.w}
          height={6}
          rx={1.2}
          fill="currentColor"
          initial={false}
          animate={reducido ? { opacity: 0.7 } : { opacity: [0.12, 1, 1, 0.12], y: [l.y - 3, l.y, l.y, l.y] }}
          transition={reducido ? undefined : { duration: 1.8, times: [0, 0.18, 0.8, 1], delay: i * 0.18, repeat: Infinity, repeatDelay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </svg>
  );
}
