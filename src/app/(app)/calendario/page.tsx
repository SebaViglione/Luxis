import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { addDays, addMonths, format, parse, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { diasDeLaGrilla, GrillaMes } from '@/components/calendario/grilla-mes';
import { LeyendaEventos, ListaEventos } from '@/components/calendario/lista-eventos';
import { hoyMontevideo, sinEntregasDuplicadas } from '@/components/calendario/tipos-evento';
import { buttonVariants } from '@/components/ui/button';
import { Cargando } from '@/components/ui/cargando';
import { requerirSesion } from '@/server/auth/sesion';
import { listarEventos } from '@/server/consultas/eventos';

export const metadata: Metadata = { title: 'Calendario · Luxis' };

// Uruguay no tiene horario de verano: medianoche de Montevideo = 03:00 UTC.
const inicioDelDia = (dia: string) => new Date(`${dia}T00:00:00-03:00`);

async function Calendario({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  await connection();
  const sesion = await requerirSesion();
  const hoy = hoyMontevideo();
  const pedido = typeof sp.mes === 'string' && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : hoy.slice(0, 7);
  const mes = parse(`${pedido}-01`, 'yyyy-MM-dd', new Date(2000, 0, 1));
  const dias = diasDeLaGrilla(mes);
  const desdeGrilla = inicioDelDia(format(dias[0], 'yyyy-MM-dd'));
  const hastaGrilla = inicioDelDia(format(addDays(dias[dias.length - 1], 1), 'yyyy-MM-dd'));
  const desdeHoy = inicioDelDia(hoy);
  const hasta14 = new Date(desdeHoy.getTime() + 15 * 864e5);

  const [delMes, proximos] = (await Promise.all([
    listarEventos(sesion.empresaId, desdeGrilla, hastaGrilla),
    listarEventos(sesion.empresaId, desdeHoy, hasta14),
  ])).map(sinEntregasDuplicadas);
  const titulo = format(mes, 'MMMM yyyy', { locale: es });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="titulo-mes" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-mes" className="text-lg first-letter:uppercase">{titulo}</h2>
          <div className="flex items-center gap-1">
            <Link href={`/calendario?mes=${format(subMonths(mes, 1), 'yyyy-MM')}`} aria-label="Mes anterior" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}><ChevronLeft aria-hidden /></Link>
            <Link href="/calendario" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Hoy</Link>
            <Link href={`/calendario?mes=${format(addMonths(mes, 1), 'yyyy-MM')}`} aria-label="Mes siguiente" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}><ChevronRight aria-hidden /></Link>
          </div>
        </div>
        <LeyendaEventos />
        <GrillaMes mes={mes} eventos={delMes} hoy={hoy} />
      </section>
      {/* Columna fija con scroll propio: la lista no estira la página aunque haya muchos eventos. */}
      <section aria-labelledby="titulo-proximos" className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="titulo-proximos" className="text-lg">Próximos 14 días</h2>
          {proximos.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {proximos.length} {proximos.length === 1 ? 'evento' : 'eventos'}
            </span>
          )}
        </div>
        <div className="-mx-1 max-h-[28rem] overflow-y-auto overscroll-contain px-1 py-2 [mask-image:linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-2rem),transparent)] lg:max-h-[min(38rem,calc(100svh-12rem))]">
          <ListaEventos eventos={proximos} hoy={hoy} />
        </div>
      </section>
    </div>
  );
}

export default function CalendarioPage({ searchParams }: PageProps<'/calendario'>) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Fechas clave</p>
        <h1 className="text-2xl">Calendario</h1>
      </header>
      <Suspense fallback={<Cargando texto="Armando tu calendario…" />}>
        <Calendario searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
