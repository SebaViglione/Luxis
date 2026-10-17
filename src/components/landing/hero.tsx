'use client';

import Link from 'next/link';
import { useRef, type PointerEvent } from 'react';
import { motion, MotionConfig, useMotionValue, useScroll } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import BlurText from '@/components/reactbits/blur-text';
import RotatingText from '@/components/reactbits/rotating-text';
import ShinyText from '@/components/reactbits/shiny-text';
import Threads from '@/components/reactbits/threads';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RUBROS } from './ejemplos';
import { Escenario3D } from './escenario-3d';

const entrada = (retraso: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: retraso, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const mover = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <MotionConfig reducedMotion="user">
      <section ref={ref} onPointerMove={mover} onPointerLeave={() => { px.set(0); py.set(0); }} className="relative overflow-hidden">
        {/* Fondo: hilos en ladrillo que se mueven solos y reaccionan al puntero. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
          <Threads color="#C4502B" amplitude={1.2} distance={0.3} lineCount={70} thickness={0.5} speed={0.35} opacity={0.5} enableMouseInteraction />
        </div>
        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-14 px-4 py-16 md:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:py-10">
          <div className="max-w-xl">
            <BlurText
              as="h1"
              text="Vendele al Estado sin leer 80 páginas de pliego."
              trigger="load"
              delay={70}
              distance={20}
              blur={8}
              className="text-5xl leading-[1.02] font-semibold tracking-tighter sm:text-6xl xl:text-7xl"
            />
            <motion.div {...entrada(0.5)} className="mt-7 text-lg text-muted-foreground md:text-xl">
              <p className="flex items-center gap-2">
                <span>Licitaciones de</span>
                {/* Hueco de ancho fijo: todos los rubros apilados e invisibles reservan el ancho del más largo. */}
                <span className="inline-grid">
                  {RUBROS.map((r) => (
                    <span key={r} aria-hidden className="invisible col-start-1 row-start-1 px-2 py-0.5 font-medium whitespace-nowrap">{r}</span>
                  ))}
                  {/* La píldora se ajusta a cada palabra, pero nada la sigue en la línea: no corre texto. */}
                  <span className="col-start-1 row-start-1 justify-self-start font-medium">
                    <RotatingText texts={RUBROS} effect="blur" splitBy="characters" staggerDuration={0.02} rotationInterval={2200} highlight highlightColor="#C4502B" />
                  </span>
                </span>
              </p>
              <p className="mt-1.5">que podés ganar, con precio y papeles.</p>
            </motion.div>
            <motion.div {...entrada(0.7)} className="mt-10 flex flex-wrap gap-3">
              <Link href="/registro" className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-6 text-base has-data-[icon=inline-end]:pr-5')}>
                <ShinyText text="Crear cuenta" color="rgba(255,255,255,0.82)" shineColor="#ffffff" speed={2.6} delay={1.2} />
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 bg-card/80 px-6 text-base')}>
                Ya tengo cuenta
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:pl-10"
          >
            <Escenario3D progreso={scrollYProgress} px={px} py={py} />
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
