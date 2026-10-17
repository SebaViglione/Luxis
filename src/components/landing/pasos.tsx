'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { AnimatePresence, motion, MotionConfig, useInView, useScroll, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';
import { Aparecer } from './aparecer';
import { FondoPuntos } from './fondos';
import { VisualDocumentos, VisualMatching, VisualPrecio } from './visuales';

const PASOS: { numero: string; titulo: string; texto: string; detalle: string[]; Visual: ComponentType }[] = [
  {
    numero: '01',
    titulo: 'Encontrá',
    texto: 'Cruzamos lo que vendés con los llamados vigentes de ARCE y te mostramos solo los que podés ofertar, con el motivo.',
    detalle: ['Confianza de 0 a 100 por llamado', 'Qué ítems podés cotizar y cuáles no', 'Filtros por organismo, tipo y cierre'],
    Visual: VisualMatching,
  },
  {
    numero: '02',
    titulo: 'Cotizá',
    texto: 'Para cada ítem ves a qué precio ganaron otras barracas en los últimos 24 meses y quiénes fueron.',
    detalle: ['Rango p25 · mediana · p75 de adjudicaciones', 'Último ganador y competidores frecuentes', 'Precio sugerido para entrar en carrera'],
    Visual: VisualPrecio,
  },
  {
    numero: '03',
    titulo: 'Presentate',
    texto: 'Leemos el pliego por vos: qué papeles piden, cuáles te faltan y si llegás a tenerlos antes del cierre.',
    detalle: ['Cumple · Alcanzable · Difícil según los días que quedan', 'Fechas clave: consultas, visita, apertura', 'Riesgos del pliego en lenguaje claro'],
    Visual: VisualDocumentos,
  },
];

function Paso({ indice, onActivo }: { indice: number; onActivo: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: '-45% 0px -45% 0px' });
  const p = PASOS[indice];
  const { Visual } = p;

  useEffect(() => {
    if (visible) onActivo(indice);
  }, [visible, indice, onActivo]);

  return (
    <div ref={ref} className="flex flex-col justify-center py-10 lg:min-h-[78vh] lg:py-0">
      <Aparecer>
        <p className="font-mono text-sm text-primary">{p.numero}</p>
        <h3 className="mt-2 text-3xl md:text-4xl">{p.titulo}</h3>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">{p.texto}</p>
        <ul className="mt-6 space-y-2.5">
          {p.detalle.map((d) => (
            <li key={d} className="flex items-start gap-3 text-sm">
              <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-primary" />
              {d}
            </li>
          ))}
        </ul>
      </Aparecer>
      <div className="mt-8 lg:hidden">
        <Visual />
      </div>
    </div>
  );
}

export function Pasos() {
  const [activo, setActivo] = useState(0);
  const seccion = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start center', 'end center'] });
  const progreso = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const { Visual } = PASOS[activo];

  return (
    <MotionConfig reducedMotion="user">
      <section id="como-funciona" className="relative scroll-mt-16 border-b">
        <FondoPuntos />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-20 md:px-8 md:pt-28">
          <Aparecer className="max-w-2xl">
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Cómo funciona</p>
            <h2 className="mt-3 text-3xl text-balance md:text-5xl">De un llamado perdido en ARCE a una oferta lista, en tres pasos.</h2>
          </Aparecer>
          <div ref={seccion} className="relative grid gap-8 pb-16 lg:grid-cols-[auto_1fr_1.1fr] lg:gap-14 lg:pb-0">
            {/* Riel de progreso */}
            <div aria-hidden className="relative hidden w-px bg-border lg:block">
              <motion.div style={{ scaleY: progreso }} className="absolute inset-0 origin-top bg-primary" />
            </div>
            <div>
              {PASOS.map((p, i) => (
                <Paso key={p.numero} indice={i} onActivo={setActivo} />
              ))}
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-24 flex h-[calc(100vh-8rem)] flex-col justify-center">
                <div className="mb-6 flex gap-2" aria-hidden>
                  {PASOS.map((p, i) => (
                    <span key={p.numero} className={cn('h-1 flex-1 rounded-full transition-colors duration-500', i <= activo ? 'bg-primary' : 'bg-border')} />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activo}
                    initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -24, filter: 'blur(6px)' }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Visual />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
