'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { Bell, CalendarDays, Check, FileText, LayoutDashboard, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListaMatches } from './mockup-matches';

const NAV = [
  { Icono: LayoutDashboard, texto: 'Licitaciones', activo: true },
  { Icono: CalendarDays, texto: 'Calendario' },
  { Icono: Bell, texto: 'Avisos' },
  { Icono: UserRound, texto: 'Cuenta' },
];

function PanelApp() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-[0_2px_0_rgba(0,0,0,0.03),0_60px_120px_-40px_rgba(27,27,27,0.35)]">
      <div className="flex items-center gap-1.5 border-b bg-card px-4 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="mx-auto rounded-md bg-background px-10 py-1 font-mono text-[11px] text-muted-foreground">luxis.uy/dashboard</span>
      </div>
      <div className="grid md:grid-cols-[11rem_1fr] lg:grid-cols-[11rem_1fr_17rem]">
        <aside className="hidden border-r bg-card p-3 md:block">
          <p className="mb-4 flex items-center gap-2 px-2 text-sm font-semibold tracking-tighter">
            <span className="size-2.5 rounded-[2px] bg-primary" /> Luxis
          </p>
          <ul className="space-y-0.5">
            {NAV.map(({ Icono, texto, activo }) => (
              <li key={texto} className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-xs', activo ? 'bg-secondary font-medium' : 'text-muted-foreground')}>
                <Icono className={cn('size-3.5', activo && 'text-primary')} /> {texto}
              </li>
            ))}
          </ul>
        </aside>
        <div className="p-4 md:p-5">
          <ListaMatches />
        </div>
        <aside className="hidden space-y-4 border-l bg-card p-4 lg:block">
          <div>
            <p className="mb-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Resumen IA</p>
            <p className="text-xs leading-relaxed">Refacción de escuela n.º 142. Obra gruesa, entrega en obra en 30 días, pago a 60.</p>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Precio portland</p>
            <div className="relative h-6">
              <div className="absolute inset-x-0 top-3 h-px bg-border" />
              <div className="absolute top-1 h-4 rounded border border-primary/30 bg-primary/10" style={{ left: '30%', width: '42%' }} />
              <div className="absolute top-0 h-6 w-0.5 bg-primary" style={{ left: '50%' }} />
            </div>
            <p className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>$ 398</span><span>$ 420</span><span>$ 447</span></p>
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Documentación</p>
            <ul className="space-y-1.5 text-xs">
              <li className="flex justify-between"><span>RUPE</span><span className="text-exito">Cumple</span></li>
              <li className="flex justify-between"><span>DGI</span><span className="text-exito">Cumple</span></li>
              <li className="flex justify-between"><span>BPS</span><span className="text-alerta-fuerte">Alcanzable</span></li>
            </ul>
          </div>
        </aside>
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
  const inclinacion = useTransform(progreso, [0, 0.45], [reducido ? 8 : 24, 0]);
  const rotateX = useTransform([inclinacion, sy] as MotionValue<number>[], ([a, b]: number[]) => a - (reducido ? 0 : b * 8));
  const rotateY = useTransform(sx, (v) => (reducido ? 0 : v * 10));
  const scale = useTransform(progreso, [0, 0.45], [0.9, 1]);
  const y = useTransform(progreso, [0, 0.45], [0, -40]);

  return (
    <div className="relative mx-auto w-full max-w-6xl [perspective:1800px]">
      <motion.div style={{ rotateX, rotateY, scale, y, transformStyle: 'preserve-3d' }} className="relative origin-top" aria-hidden>
        <PanelApp />
        <Flotante z={110} retraso={0} className="top-20 -left-10 w-56">
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Precio sugerido</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">$ 412</p>
          <p className="text-[11px] text-muted-foreground">mediana $ 420 · 14 adjudicaciones</p>
        </Flotante>
        <Flotante z={160} retraso={0.3} className="-right-8 bottom-24 w-64">
          <p className="flex items-center gap-2 text-xs">
            <FileText className="size-3.5 text-primary" /> ¿Aceptan otra marca de portland?
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sí, si cumple UNIT 20. <span className="rounded bg-primary/10 px-1 font-mono text-[10px] text-primary">[pliego.pdf, p. 12]</span>
          </p>
        </Flotante>
        <Flotante z={80} retraso={0.6} className="-top-6 right-24">
          <p className="flex items-center gap-2 text-xs font-medium">
            <span className="flex size-4 items-center justify-center rounded-full bg-exito text-white"><Check className="size-2.5" /></span>
            Pliego leído · 4 archivos
          </p>
        </Flotante>
      </motion.div>
    </div>
  );
}
