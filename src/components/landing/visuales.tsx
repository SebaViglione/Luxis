'use client';

import { motion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import CountUp from '@/components/reactbits/count-up';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;
const enVista = { initial: 'oculto', whileInView: 'visible', viewport: { once: true, amount: 0.4 } } as const;

function Marco({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden className={cn('w-full rounded-xl border bg-card p-5 shadow-[0_24px_48px_-28px_rgba(27,27,27,0.25)]', className)}>
        <p className="mb-4 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{titulo}</p>
        {children}
      </div>
      <p className="mt-3 text-center font-mono text-[11px] text-muted-foreground">Ejemplo ilustrativo</p>
    </MotionConfig>
  );
}

// ——— 01 Encontrá: catálogo vs. ítems del llamado ———

const ITEMS_LLAMADO = [
  { texto: 'Cemento portland CPN 40, bolsa 25 kg', ok: true },
  { texto: 'Arena gruesa lavada, m³', ok: true },
  { texto: 'Bloque de hormigón 12×19×39', ok: true },
  { texto: 'Hierro Ø8 mm, barra 12 m', ok: true },
  { texto: 'Membrana asfáltica 4 mm', ok: false },
  { texto: 'Pedregullo lavado, m³', ok: true },
];

export function VisualMatching() {
  return (
    <Marco titulo="Matching · ANEP · Canelones">
      <div className="mb-4 flex items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm font-medium">Refacción de escuela n.º 142</p>
          <p className="text-xs text-muted-foreground">Compra Directa · cierra en 6 días</p>
        </div>
        <div className="text-right">
          <CountUp to={92} duration={1.4} trigger="view" className="text-4xl leading-none font-semibold tracking-tight" />
          <p className="mt-1 text-xs text-muted-foreground">confianza</p>
        </div>
      </div>
      <motion.ul {...enVista} variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }} className="space-y-2">
        {ITEMS_LLAMADO.map((i) => (
          <motion.li
            key={i.texto}
            variants={{ oculto: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } } }}
            className="flex items-center gap-2.5 text-sm"
          >
            <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full', i.ok ? 'bg-exito-suave text-exito' : 'bg-muted text-muted-foreground')}>
              {i.ok ? <Check className="size-3" /> : <Minus className="size-3" />}
            </span>
            <span className={cn(!i.ok && 'text-muted-foreground line-through decoration-border')}>{i.texto}</span>
          </motion.li>
        ))}
      </motion.ul>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="mt-4 rounded-md bg-secondary px-3 py-2 text-xs"
      >
        <span className="font-medium">Por qué:</span> vendés 5 de los 6 ítems y entregás en Canelones. La membrana no está en tu catálogo.
      </motion.p>
    </Marco>
  );
}

// ——— 02 Cotizá: rango histórico de precios ———

const MIN = 360, MAX = 480;
const pos = (v: number) => `${((v - MIN) / (MAX - MIN)) * 100}%`;
const ADJUDICADOS = [372, 389, 398, 404, 411, 415, 419, 421, 426, 433, 441, 447, 452, 468];

export function VisualPrecio() {
  return (
    <Marco titulo="Precio histórico · últimos 24 meses">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Cemento portland CPN 40 · bolsa 25 kg</p>
          <p className="text-xs text-muted-foreground">14 adjudicaciones · 6 organismos</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl leading-none font-semibold tracking-tight">
            $ <CountUp to={412} duration={1.2} trigger="view" />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">precio sugerido</p>
        </div>
      </div>
      <div className="relative h-24">
        <div className="absolute inset-x-0 top-12 h-px bg-border" />
        {/* Rango intercuartil */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
          className="absolute top-8 h-8 origin-left rounded-md border border-primary/30 bg-primary/10"
          style={{ left: pos(398), width: `calc(${pos(447)} - ${pos(398)})` }}
        />
        {/* Mediana */}
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 1 }}
          className="absolute top-6 h-12 w-0.5 bg-primary"
          style={{ left: pos(420) }}
        />
        {ADJUDICADOS.map((v, k) => (
          <motion.span
            key={k}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + k * 0.05, duration: 0.35 }}
            className="absolute top-[2.85rem] size-2 -translate-x-1/2 rounded-full bg-foreground/70 ring-2 ring-card"
            style={{ left: pos(v) }}
          />
        ))}
        {/* Sugerido */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="absolute top-0 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background"
          style={{ left: pos(412) }}
        >
          sugerido
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>$ {MIN}</span><span>$ {MAX}</span>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-xs">
        <div><dt className="text-muted-foreground">p25</dt><dd className="font-mono text-sm">$ 398</dd></div>
        <div><dt className="text-muted-foreground">Mediana</dt><dd className="font-mono text-sm">$ 420</dd></div>
        <div><dt className="text-muted-foreground">p75</dt><dd className="font-mono text-sm">$ 447</dd></div>
      </dl>
    </Marco>
  );
}

// ——— 03 Presentate: gap documental ———

const ESTADOS = {
  cumple: { etiqueta: 'Cumple', clase: 'bg-exito-suave text-exito' },
  alcanzable: { etiqueta: 'Alcanzable', clase: 'bg-alerta-suave text-alerta-fuerte' },
  dificil: { etiqueta: 'Difícil', clase: 'bg-error-suave text-error' },
} as const;

const DOCUMENTOS: { doc: string; estado: keyof typeof ESTADOS; nota: string }[] = [
  { doc: 'Inscripción activa en RUPE', estado: 'cumple', nota: 'Ya lo tenés' },
  { doc: 'Certificado único de DGI', estado: 'cumple', nota: 'Vigente hasta marzo' },
  { doc: 'Certificado común de BPS', estado: 'alcanzable', nota: '≈ 2 días hábiles' },
  { doc: 'Garantía de mantenimiento de oferta', estado: 'alcanzable', nota: '≈ 3 días con tu banco' },
  { doc: 'Certificado UNIT del producto', estado: 'dificil', nota: '≈ 20 días · cierra en 6' },
];

export function VisualDocumentos() {
  return (
    <Marco titulo="Documentación · qué te falta">
      <motion.ul {...enVista} variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } } }} className="divide-y">
        {DOCUMENTOS.map((d) => (
          <motion.li
            key={d.doc}
            variants={{ oculto: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{d.doc}</p>
              <p className="text-xs text-muted-foreground">{d.nota}</p>
            </div>
            <motion.span
              variants={{ oculto: { scale: 0.6, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 18, delay: 0.15 } } }}
              className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', ESTADOS[d.estado].clase)}
            >
              {ESTADOS[d.estado].etiqueta}
            </motion.span>
          </motion.li>
        ))}
      </motion.ul>
    </Marco>
  );
}
