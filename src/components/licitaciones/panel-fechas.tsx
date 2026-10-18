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
  push({ clave: 'publicacion', titulo: 'Se publicó', fecha: l.fechaPublicacion, icono: FileText });
  push({ clave: 'consultas', titulo: 'Último día para hacer preguntas al organismo', fecha: l.fechaSolAclar, icono: MessageCircleQuestion });
  push({ clave: 'prorroga', titulo: 'Último día para pedir más plazo', fecha: l.fechaSolProrr, icono: CalendarPlus });
  push({ clave: 'ofertas', titulo: 'Cierre de ofertas: último momento para presentar la tuya', fecha: l.fechaTopeOfertas, icono: CalendarClock, destacado: true });
  if (l.fechaApertura && l.fechaApertura !== l.fechaTopeOfertas) push({ clave: 'apertura', titulo: 'Se abren las ofertas', fecha: l.fechaApertura, icono: DoorOpen });
  push({ clave: 'entrega', titulo: 'Entrega de la mercadería', fecha: l.fechaTopeEntrega, icono: Truck });
  for (const [i, f] of (d.analisis?.fechasClave ?? []).entries()) {
    if (f.tipo === 'apertura' || !f.fecha) continue;
    push({ clave: `clave-${i}`, titulo: f.descripcion, fecha: f.fecha, icono: ICONO_CLAVE[f.tipo], detalle: f.fuente ?? undefined, obligatoria: f.obligatoria });
  }
  return lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function PanelFechas({ detalle, ahora }: { detalle: DetalleLicitacion; ahora: number }) {
  const lista = eventos(detalle);
  const iHoy = lista.findIndex((e) => (diasHasta(e.fecha, ahora) ?? 0) >= 0);
  const hoy = (
    <li key="hoy" className="relative flex items-center gap-3 py-1 pl-0">
      <span aria-hidden className="relative z-10 flex size-7 items-center justify-center"><span className="size-2.5 rounded-full bg-primary ring-4 ring-primary/20" /></span>
      <span className="text-sm font-medium text-primary">Hoy</span>
    </li>
  );
  const items = lista.map((e) => {
    const dias = diasHasta(e.fecha, ahora);
    const paso = dias !== null && dias < 0;
    const Icono = e.icono;
    return (
      <li key={e.clave} className={cn('relative flex items-start gap-3', paso && 'opacity-55')}>
        <span aria-hidden className={cn('relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card',
          e.destacado && !paso && 'border-primary bg-primary text-primary-foreground')}>
          <Icono className={cn('size-3.5', e.destacado && !paso ? 'text-primary-foreground' : 'text-muted-foreground')} />
        </span>
        <div className={cn('min-w-0 flex-1 rounded-md pb-1', e.destacado && !paso && 'font-medium')}>
          <p className="text-sm">
            {e.titulo}
            {e.obligatoria && <span className="ml-2 rounded-full bg-alerta-suave px-2 py-0.5 text-xs font-medium text-alerta-fuerte">Obligatoria</span>}
          </p>
          <p className="text-sm text-muted-foreground"><span className="font-mono">{fechaHora(e.fecha)}</span> · {paso ? 'ya pasó' : textoFaltan(dias)}</p>
          {e.detalle && <p className="text-xs text-muted-foreground">Según {e.detalle}</p>}
        </div>
      </li>
    );
  });
  if (iHoy === -1) items.push(hoy); else items.splice(iHoy, 0, hoy);
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Fechas importantes</h2>
      <ol className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-3.5 before:w-px before:bg-border">
        {items}
      </ol>
    </div>
  );
}
