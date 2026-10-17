import Link from 'next/link';
import { FondoTinta } from '@/components/landing/fondos';
import { Logo } from '@/components/marca/logo';
import { Marca } from '@/components/onboarding/marca';

const PUNTOS = [
  'Los llamados de ARCE que podés ofertar, con el motivo',
  'A qué precio ganaron otras barracas en 24 meses',
  'Qué papeles te faltan y si llegás antes del cierre',
];

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca (solo desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex xl:p-14">
        <FondoTinta />
        <Logo variante="claro" className="relative" />
        <div className="relative max-w-md">
          <p className="font-mono text-xs tracking-wide text-background/60 uppercase">Licitaciones de ARCE para barracas</p>
          <p className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tighter text-balance xl:text-5xl">
            Vendele al Estado sin leer 80 páginas de pliego.
          </p>
          <ul className="mt-8 space-y-3 text-background/80">
            {PUNTOS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span aria-hidden className="mt-3 h-px w-5 shrink-0 bg-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-xs text-background/50">Datos: ARCE, datos abiertos de Uruguay.</p>
      </aside>

      <main className="relative flex flex-col items-center justify-center bg-background px-4 py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <Link href="/" className="relative mb-8 lg:hidden" aria-label="Ir al inicio">
          <Marca />
        </Link>
        <div className="relative w-full max-w-sm animate-in duration-500 fade-in-0 slide-in-from-bottom-2">{children}</div>
        <p className="relative mt-10 text-xs text-muted-foreground lg:hidden">Datos: ARCE, datos abiertos de Uruguay.</p>
      </main>
    </div>
  );
}
