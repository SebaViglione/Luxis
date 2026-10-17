'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, MotionConfig, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { ArrowRight, Menu } from 'lucide-react';
import { Logo } from '@/components/marca/logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ANCLAS } from './anclas';

/** Sección visible ahora, según qué ancla cruza la franja superior del viewport. */
function useSeccionActiva() {
  const [activa, setActiva] = useState<string | null>(null);
  useEffect(() => {
    const secciones = ANCLAS.map((a) => document.querySelector(a.href)).filter((e): e is Element => e !== null);
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActiva(`#${e.target.id}`);
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    secciones.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return activa;
}

export function Encabezado() {
  const { scrollY, scrollYProgress } = useScroll();
  const progreso = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const [compacto, setCompacto] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [encima, setEncima] = useState<string | null>(null);
  const activa = useSeccionActiva();
  useMotionValueEvent(scrollY, 'change', (y) => setCompacto(y > 24));
  const resaltada = encima ?? activa;

  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 h-16 px-3"
      >
        <div
          className={cn(
            'relative mx-auto flex items-center justify-between overflow-hidden border transition-[max-width,height,margin,border-radius,background-color,border-color,box-shadow,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            compacto
              ? 'mt-2.5 h-12 max-w-4xl rounded-full border-border bg-card/95 pr-1.5 pl-5 shadow-[0_12px_32px_-16px_rgba(27,27,27,0.3)]'
              : 'mt-0 h-16 max-w-7xl rounded-none border-transparent bg-transparent px-1 md:px-5',
          )}
        >
          <Logo />

          <nav aria-label="Secciones" className="hidden md:block" onMouseLeave={() => setEncima(null)}>
            <ul className="flex items-center">
              {ANCLAS.map((a) => {
                const esActiva = activa === a.href;
                return (
                  <li key={a.href} className="relative">
                    {resaltada === a.href && (
                      <motion.span
                        layoutId="nav-resaltado"
                        className="absolute inset-0 rounded-full bg-secondary"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <a
                      href={a.href}
                      onMouseEnter={() => setEncima(a.href)}
                      aria-current={esActiva ? 'location' : undefined}
                      className={cn(
                        'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-300',
                        esActiva || encima === a.href ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn('size-1 rounded-full bg-primary transition-all duration-300', esActiva ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}
                      />
                      {a.texto}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden items-center gap-1 md:flex">
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full px-3.5')}>Ingresar</Link>
            <Link href="/registro" className={cn(buttonVariants({ size: 'sm' }), 'group h-8 rounded-full px-4')}>
              Crear cuenta
              <ArrowRight data-icon="inline-end" className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <Sheet open={abierto} onOpenChange={setAbierto}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Abrir menú" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle><Logo /></SheetTitle>
              </SheetHeader>
              <nav aria-label="Secciones" className="flex flex-col gap-1 px-4">
                {ANCLAS.map((a) => (
                  <a
                    key={a.href}
                    href={a.href}
                    onClick={() => setAbierto(false)}
                    className={cn('flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted', activa === a.href && 'bg-secondary font-medium')}
                  >
                    {a.texto}
                  </a>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-2 px-4">
                <Link href="/registro" className={buttonVariants({ size: 'lg' })}>Crear cuenta</Link>
                <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Ingresar</Link>
              </div>
            </SheetContent>
          </Sheet>

          {/* Progreso de lectura, solo con la barra compacta. */}
          <motion.span
            aria-hidden
            style={{ scaleX: progreso }}
            className={cn('absolute inset-x-6 bottom-0 h-px origin-left bg-primary transition-opacity duration-500', compacto ? 'opacity-100' : 'opacity-0')}
          />
        </div>
      </motion.header>
    </MotionConfig>
  );
}
