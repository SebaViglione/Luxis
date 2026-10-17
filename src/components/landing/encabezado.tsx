'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/marca/logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ANCLAS } from './anclas';

export function Encabezado() {
  const { scrollY } = useScroll();
  const [conBorde, setConBorde] = useState(false);
  const [abierto, setAbierto] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setConBorde(y > 8));

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'sticky top-0 z-40 border-b bg-background transition-colors duration-300',
        conBorde ? 'border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 md:px-8">
        <Logo />
        <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
          {ANCLAS.map((a) => (
            <a key={a.href} href={a.href} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {a.texto}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Ingresar</Link>
          <Link href="/registro" className={buttonVariants({ size: 'sm' })}>Crear cuenta</Link>
        </div>
        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú" />}>
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Luxis</SheetTitle>
            </SheetHeader>
            <nav aria-label="Secciones" className="flex flex-col gap-1 px-4">
              {ANCLAS.map((a) => (
                <a key={a.href} href={a.href} onClick={() => setAbierto(false)} className="rounded-md px-2 py-2 text-sm hover:bg-muted">
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
      </div>
    </motion.header>
  );
}
