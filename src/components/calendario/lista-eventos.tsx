import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { EventoCalendario } from '@/lib/types';
import { cn } from '@/lib/utils';
import { fecha, fechaHora, suavizarMayusculas } from '@/components/licitaciones/formato';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { agruparPorDia, objetoDelEvento, TIPO_EVENTO } from './tipos-evento';

export function ListaEventos({ eventos, hoy }: { eventos: EventoCalendario[]; hoy: string }) {
  if (!eventos.length) {
    return <EstadoVacio icono={CalendarDays} titulo="Nada en los próximos 14 días" descripcion="Cuando guardes o te aparezcan licitaciones, vas a ver acá sus cierres, visitas y plazos." />;
  }
  return (
    <ol className="space-y-4">
      {[...agruparPorDia(eventos)].map(([dia, delDia]) => (
        <li key={dia} className="space-y-1.5">
          <h3 className="text-sm text-muted-foreground">
            {dia === hoy ? 'Hoy' : null}
            <span className={cn('font-mono', dia === hoy && 'ml-2')}>{fecha(delDia[0].fecha)}</span>
          </h3>
          <ul className="space-y-1.5">
            {delDia.map((e) => (
              <li key={e.id}>
                <Link href={`/licitaciones/${encodeURIComponent(e.idCompra)}`} className="flex items-start gap-2.5 rounded-md border bg-card p-2.5 hover:bg-muted/50">
                  <span aria-hidden className={cn('mt-1 h-4 w-1 shrink-0 rounded-full', TIPO_EVENTO[e.tipo].marca)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">
                      {TIPO_EVENTO[e.tipo].etiqueta}{e.obligatoria && e.tipo === 'visita' ? ' obligatoria' : ''} · <span className="font-mono">{fechaHora(e.fecha).slice(11)}</span>
                    </span>
                    <span className="line-clamp-2 text-sm">{suavizarMayusculas(objetoDelEvento(e))}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function LeyendaEventos() {
  const tipos = (['apertura', 'visita', 'consultas', 'entrega'] as const);
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Referencias">
      {tipos.map((t) => (
        <li key={t} className="flex items-center gap-1.5"><span aria-hidden className={cn('h-3 w-1 rounded-full', TIPO_EVENTO[t].marca)} />{TIPO_EVENTO[t].etiqueta}</li>
      ))}
    </ul>
  );
}
