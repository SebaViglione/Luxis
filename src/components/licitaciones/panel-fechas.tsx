import { CalendarClock, CalendarPlus, DoorOpen, FileText, MapPinned, MessageCircleQuestion, Package, Truck, type LucideIcon } from 'lucide-react';
import type { DetalleLicitacion, FechaClave } from '@/lib/types';
import { cn } from '@/lib/utils';
import { diasHasta, fechaHora, textoFaltan } from './formato';

interface Evento { clave: string; titulo: string; fecha: string; icono: LucideIcon; detalle?: string; destacado?: boolean; obligatoria?: boolean }

const ICONO_CLAVE: Record<FechaClave['tipo'], LucideIcon> = {
  visita: MapPinned, consultas: MessageCircleQuestion, prorroga: CalendarPlus, apertura: CalendarClock, entrega: Truck, muestras: Package, otro: CalendarClock,
};

function eventos(d: DetalleLicitacion): Evento[] {
  const l = d.licitacion;
  const lista: Evento[] = [];
  const push = (e: Omit<Evento, 'fecha'> & { fecha: string | null }) => { if (e.fecha) lista.push(e as Evento); };
  push({ clave: 'publicacion', titulo: 'Publicación', fecha: l.fechaPublicacion, icono: FileText });
  push({ clave: 'consultas', titulo: 'Consultas hasta', fecha: l.fechaSolAclar, icono: MessageCircleQuestion });
  push({ clave: 'prorroga', titulo: 'Pedido de prórroga hasta', fecha: l.fechaSolProrr, icono: CalendarPlus });
  push({ clave: 'ofertas', titulo: 'Recepción de ofertas hasta', fecha: l.fechaTopeOfertas, icono: CalendarClock, destacado: true });
  if (l.fechaApertura && l.fechaApertura !== l.fechaTopeOfertas) push({ clave: 'apertura', titulo: 'Apertura de ofertas', fecha: l.fechaApertura, icono: DoorOpen });
  push({ clave: 'entrega', titulo: 'Entrega', fecha: l.fechaTopeEntrega, icono: Truck });
  for (const [i, f] of (d.analisis?.fechasClave ?? []).entries()) {
    if (f.tipo === 'apertura' || !f.fecha) continue;
    push({ clave: `clave-${i}`, titulo: f.descripcion, fecha: f.fecha, icono: ICONO_CLAVE[f.tipo], detalle: f.fuente ?? undefined, obligatoria: f.obligatoria });
  }
  return lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function PanelFechas({ detalle, ahora }: { detalle: DetalleLicitacion; ahora: number }) {
  return (
    <ol className="space-y-2">
      {eventos(detalle).map((e) => {
        const dias = diasHasta(e.fecha, ahora);
        const paso = dias !== null && dias < 0;
        const Icono = e.icono;
        return (
          <li key={e.clave} className={cn('flex items-start gap-3 rounded-md border bg-card p-3', e.destacado && 'border-primary/40', paso && 'opacity-60')}>
            <Icono aria-hidden className={cn('mt-0.5 size-4 shrink-0', e.destacado ? 'text-primary' : 'text-muted-foreground')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {e.titulo}
                {e.obligatoria && <span className="ml-2 rounded-md bg-alerta-suave px-1.5 py-0.5 text-xs font-medium text-alerta-fuerte">Obligatoria</span>}
              </p>
              {e.detalle && <p className="text-xs text-muted-foreground">Fuente: {e.detalle}</p>}
            </div>
            <div className="text-right">
              <p className="font-mono text-sm tabular-nums">{fechaHora(e.fecha)}</p>
              <p className="text-xs text-muted-foreground">{textoFaltan(dias)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
