'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListaMatches } from './mockup-matches';

function PanelApp() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-[0_2px_0_rgba(0,0,0,0.03),0_60px_120px_-40px_rgba(27,27,27,0.35)]">
      <div className="flex items-center gap-1.5 border-b bg-card px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="mx-auto rounded-md bg-background px-8 py-1 font-mono text-[11px] text-muted-foreground">luxis.uy/dashboard</span>
      </div>
      <div className="p-4 md:p-5">
        <ListaMatches />
      </div>
    </div>
  );
}

/** Tarjeta que flota delante del panel, a `z` px de profundidad, con un vaivén suave. */
function Flotante({ z, retraso, className, children }: { z: number; retraso: number; className?: string; children: ReactNode }) {
  const reducido = useReducedMotion();
  return (
    <motion.div
      className={cn('absolute hidden md:block', className)}
      style={{ z }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, y: reducido ? 0 : [0, -10, 0] }}
      transition={{
        opacity: { delay: 0.9 + retraso, duration: 0.6 },
        scale: { delay: 0.9 + retraso, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        y: { delay: 1.5 + retraso, duration: 5 + retraso * 2, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <div className="rounded-xl border bg-card p-3.5 shadow-[0_30px_60px_-24px_rgba(27,27,27,0.35)]">{children}</div>
    </motion.div>
  );
}

type EscenarioProps = {
  /** Progreso de scroll del hero (0 → 1). */
  progreso: MotionValue<number>;
  /** Posición del puntero normalizada (-0.5 → 0.5). */
  px: MotionValue<number>;
  py: MotionValue<number>;
};

export function Escenario3D({ progreso, px, py }: EscenarioProps) {
  const reducido = useReducedMotion();
  const sx = useSpring(px, { stiffness: 80, damping: 20 });
  const sy = useSpring(py, { stiffness: 80, damping: 20 });
  // Arranca girado hacia el texto y se endereza al scrollear; el puntero suma una inclinación leve.
  const giro = useTransform(progreso, [0, 0.6], [reducido ? -6 : -16, 0]);
  const caida = useTransform(progreso, [0, 0.6], [reducido ? 4 : 8, 0]);
  const rotateY = useTransform([giro, sx] as MotionValue<number>[], ([a, b]: number[]) => a + (reducido ? 0 : b * 12));
  const rotateX = useTransform([caida, sy] as MotionValue<number>[], ([a, b]: number[]) => a - (reducido ? 0 : b * 10));

  return (
    <div className="relative mx-auto w-full max-w-xl [perspective:1600px]">
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative" aria-hidden>
        <PanelApp />
        <Flotante z={120} retraso={0} className="-top-12 -left-14 w-52">
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Precio sugerido</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">$ 412</p>
          <p className="text-[11px] text-muted-foreground">mediana $ 420 · 14 adjudicaciones</p>
        </Flotante>
        <Flotante z={90} retraso={0.45} className="-bottom-16 -left-12 w-48">
          <p className="mb-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Documentación</p>
          <ul className="space-y-1 text-xs">
            <li className="flex justify-between"><span>RUPE</span><span className="text-exito">Cumple</span></li>
            <li className="flex justify-between"><span>BPS</span><span className="text-alerta-fuerte">Alcanzable</span></li>
          </ul>
        </Flotante>
        <Flotante z={160} retraso={0.3} className="-right-10 -bottom-20 w-64">
          <p className="flex items-center gap-2 text-xs">
            <FileText className="size-3.5 text-primary" /> ¿Aceptan otra marca de portland?
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sí, si cumple UNIT 20. <span className="rounded bg-primary/10 px-1 font-mono text-[10px] text-primary">[pliego.pdf, p. 12]</span>
          </p>
        </Flotante>
        <Flotante z={80} retraso={0.6} className="-top-14 right-4">
          <p className="flex items-center gap-2 text-xs font-medium">
            <span className="flex size-4 items-center justify-center rounded-full bg-exito text-white"><Check className="size-2.5" /></span>
            Pliego leído · 4 archivos
          </p>
        </Flotante>
      </motion.div>
    </div>
  );
}
