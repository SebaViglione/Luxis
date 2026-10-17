import Link from 'next/link';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EventoCalendario } from '@/lib/types';
import { cn } from '@/lib/utils';
import { suavizarMayusculas } from '@/components/licitaciones/formato';
import { agruparPorDia, objetoDelEvento, TIPO_EVENTO } from './tipos-evento';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_POR_DIA = 2;

export function diasDeLaGrilla(mes: Date): Date[] {
  return eachDayOfInterval({ start: startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }) });
}

export function GrillaMes({ mes, eventos, hoy }: { mes: Date; eventos: EventoCalendario[]; hoy: string }) {
  const porDia = agruparPorDia(eventos);
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {DIAS.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <ol className="grid grid-cols-7">
        {diasDeLaGrilla(mes).map((d) => {
          const clave = format(d, 'yyyy-MM-dd');
          const delDia = porDia.get(clave) ?? [];
          const esHoy = clave === hoy;
          const fuera = !isSameMonth(d, mes);
          return (
            <li key={clave} className={cn('min-h-16 border-r border-b p-1 sm:min-h-24 sm:p-1.5 [&:nth-child(7n)]:border-r-0', fuera && 'bg-muted/30')}>
              <p className={cn('mb-1 text-xs tabular-nums', fuera ? 'text-muted-foreground/60' : 'text-muted-foreground', esHoy && 'inline-flex size-5 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground')}>
                <span className="sr-only">{format(d, "EEEE d 'de' MMMM", { locale: es })}</span>
                <span aria-hidden>{format(d, 'd')}</span>
              </p>
              {delDia.length > 0 && (
                <ul className="space-y-0.5">
                  {delDia.slice(0, MAX_POR_DIA).map((e) => (
                    <li key={e.id}>
                      <Link href={`/licitaciones/${encodeURIComponent(e.idCompra)}`} title={e.titulo}
                        className="flex items-center gap-1 rounded-sm px-0.5 text-xs hover:bg-muted">
                        <span aria-hidden className={cn('h-3 w-1 shrink-0 rounded-full', TIPO_EVENTO[e.tipo].marca)} />
                        <span className="sr-only">{TIPO_EVENTO[e.tipo].etiqueta}: </span>
                        <span className="hidden truncate sm:inline">{suavizarMayusculas(objetoDelEvento(e))}</span>
                      </Link>
                    </li>
                  ))}
                  {delDia.length > MAX_POR_DIA && <li className="px-0.5 text-xs text-muted-foreground">+{delDia.length - MAX_POR_DIA}</li>}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
