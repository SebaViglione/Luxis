import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/marca/logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Aparecer } from './aparecer';
import { ANCLAS } from './anclas';
import { FondoLadrillo } from './fondos';

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <FondoLadrillo />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-4 py-20 md:flex-row md:items-end md:justify-between md:px-8 md:py-24">
        <Aparecer className="max-w-2xl">
          <h2 className="text-3xl text-balance md:text-5xl">La próxima licitación que podés ganar ya está publicada.</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">Creá tu cuenta, subí tu lista de precios y en unos minutos ves cuáles son.</p>
        </Aparecer>
        <Aparecer retraso={0.15} className="flex shrink-0 flex-wrap gap-3">
          <Link href="/registro" className={cn(buttonVariants({ size: 'lg' }), 'h-11 bg-background px-5 text-[0.95rem] text-foreground hover:bg-background/90')}>
            Crear cuenta <ArrowRight data-icon="inline-end" />
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 border-primary-foreground/40 bg-transparent px-5 text-[0.95rem] text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground')}
          >
            Ingresar
          </Link>
        </Aparecer>
      </div>
    </section>
  );
}

export function Pie() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">Datos: Agencia Reguladora de Compras Estatales (ARCE), Uruguay — datos abiertos.</p>
        </div>
        <nav aria-label="Pie" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {ANCLAS.map((a) => (
            <a key={a.href} href={a.href} className="hover:text-foreground">{a.texto}</a>
          ))}
          <Link href="/login" className="hover:text-foreground">Ingresar</Link>
        </nav>
      </div>
    </footer>
  );
}
