'use client';

import Link from 'next/link';
import { useRef, type PointerEvent } from 'react';
import { motion, MotionConfig, useMotionValue, useScroll, useTransform } from 'motion/react';
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
  const opacidadTexto = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const yTexto = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  const mover = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <MotionConfig reducedMotion="user">
      <section ref={ref} onPointerMove={mover} onPointerLeave={() => { px.set(0); py.set(0); }} className="relative overflow-hidden">
        {/* Fondo: hilos en ladrillo que se mueven solos y reaccionan al puntero. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[115svh] [mask-image:linear-gradient(to_bottom,black_45%,transparent)]">
          <Threads color="#C4502B" amplitude={1.2} distance={0.3} lineCount={70} thickness={0.5} speed={0.35} opacity={0.55} enableMouseInteraction />
        </div>
        <div className="relative flex min-h-[74svh] flex-col justify-center px-4 pt-16 pb-12 md:px-8">
          <motion.div style={{ opacity: opacidadTexto, y: yTexto }} className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <motion.p {...entrada(0)} className="mb-7 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 font-mono text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Licitaciones de ARCE para barracas
            </motion.p>
            <BlurText
              as="h1"
              text="Vendele al Estado sin leer 80 páginas de pliego."
              trigger="load"
              delay={70}
              distance={20}
              blur={8}
              className="justify-center text-5xl leading-[1.02] font-semibold tracking-tighter text-balance sm:text-6xl lg:text-[5.5rem]"
            />
            <motion.p {...entrada(0.5)} className="mt-7 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Luxis encuentra las licitaciones donde tu barraca puede ganar, te dice a qué precio y qué papeles te faltan.
            </motion.p>
            <motion.p {...entrada(0.6)} className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-lg">
              <span>Llamados de</span>
              <RotatingText
                texts={RUBROS}
                effect="blur"
                splitBy="characters"
                staggerDuration={0.02}
                rotationInterval={2200}
                highlight
                highlightColor="#C4502B"
                mainClassName="font-medium"
              />
              <span>que podés ofertar hoy.</span>
            </motion.p>
            <motion.div {...entrada(0.75)} className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/registro" className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-6 text-base')}>
                <ShinyText text="Crear cuenta" color="rgba(255,255,255,0.82)" shineColor="#ffffff" speed={2.6} delay={1.2} />
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 bg-card/80 px-6 text-base')}>
                Ya tengo cuenta
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative px-4 pb-24 md:px-8 md:pb-32"
        >
          <Escenario3D progreso={scrollYProgress} px={px} py={py} />
          <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">Ejemplo ilustrativo</p>
        </motion.div>
      </section>
    </MotionConfig>
  );
}
