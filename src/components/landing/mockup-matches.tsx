'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CalendarClock } from 'lucide-react';
import { nivelConfianza } from '@/components/licitaciones/badge-confianza';
import CountUp from '@/components/reactbits/count-up';
import { cn } from '@/lib/utils';
import { MATCHES_EJEMPLO, type MatchEjemplo } from './ejemplos';

const VISIBLES = 3;

function TarjetaMatch({ m }: { m: MatchEjemplo }) {
  const nivel = nivelConfianza(m.confianza);
  return (
    <div className="rounded-md border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-1 text-sm font-medium">{m.objeto}</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <span>{m.organismo}</span>
            <span aria-hidden>·</span>
            <span>{m.tipo}</span>
            <span aria-hidden>·</span>
            <span className={cn('inline-flex items-center gap-1', m.cierraEn <= 5 && 'font-medium text-alerta-fuerte')}>
              <CalendarClock aria-hidden className="size-3" /> cierra en {m.cierraEn} días
            </span>
          </p>
        </div>
        <div className={cn('flex w-14 shrink-0 flex-col items-start gap-1 rounded-md px-2 py-1.5', nivel.fondo)}>
          <span className="text-lg leading-none font-semibold">{m.confianza}</span>
          <span className="h-1 w-full overflow-hidden rounded-full bg-background/70">
            <motion.span
              className={cn('block h-full rounded-full', nivel.barra)}
              initial={{ width: 0 }}
              animate={{ width: `${m.confianza}%` }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-xs">{m.razon}</p>
    </div>
  );
}

/** Lista del dashboard: las licitaciones van entrando arriba como si llegaran del matching. */
export function ListaMatches() {
  const reducido = useReducedMotion();
  const [inicio, setInicio] = useState(0);

  useEffect(() => {
    if (reducido) return;
    const t = setInterval(() => setInicio((i) => (i + 1) % MATCHES_EJEMPLO.length), 3400);
    return () => clearInterval(t);
  }, [reducido]);

  const visibles = Array.from({ length: VISIBLES }, (_, k) => MATCHES_EJEMPLO[(inicio - k + MATCHES_EJEMPLO.length) % MATCHES_EJEMPLO.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="flex items-baseline gap-2">
          <CountUp to={12} duration={1.2} trigger="load" className="text-3xl font-semibold tracking-tight" />
          <span className="text-base font-semibold tracking-tight">licitaciones para vos</span>
        </p>
        <span className="relative flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          en vivo
        </span>
      </div>
      <div className="relative h-[19.5rem] overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {visibles.map((m) => (
            <motion.div
              key={m.objeto}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="mb-3"
            >
              <TarjetaMatch m={m} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
