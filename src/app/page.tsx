import Link from 'next/link';
import { Logo } from '@/components/marca/logo';
import BlurText from '@/components/reactbits/blur-text';
import { buttonVariants } from '@/components/ui/button';

const PASOS = [
  { titulo: 'Encontrá', texto: 'Cruzamos lo que vendés con los llamados vigentes de ARCE y te mostramos solo los que podés ofertar, con el motivo.' },
  { titulo: 'Cotizá', texto: 'Para cada ítem ves a qué precio ganaron otras barracas en los últimos 24 meses y quiénes fueron.' },
  { titulo: 'Presentate', texto: 'Leemos el pliego por vos: qué papeles piden, cuáles te faltan y si llegás a tenerlos antes del cierre.' },
];

export default function Inicio() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Ingresar</Link>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 md:px-8">
        <section className="max-w-3xl py-16 md:py-28">
          <BlurText as="h1" text="Vendele al Estado sin leer 80 páginas de pliego." trigger="load" delay={70} distance={20} blur={8}
            className="text-4xl leading-[1.08] font-semibold tracking-tight md:text-6xl" />
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Luxis encuentra las licitaciones donde tu barraca puede ganar, te dice a qué precio y qué papeles te faltan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/registro" className={buttonVariants({ size: 'lg' })}>Crear cuenta</Link>
            <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Ingresar</Link>
          </div>
        </section>
        <section aria-label="Cómo te ayuda Luxis" className="grid gap-8 border-t py-12 md:grid-cols-3">
          {PASOS.map((p) => (
            <div key={p.titulo} className="space-y-2">
              <h2 className="text-lg">{p.titulo}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t">
        <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground md:px-8">
          Datos: Agencia Reguladora de Compras Estatales (ARCE), Uruguay — datos abiertos.
        </p>
      </footer>
    </div>
  );
}
