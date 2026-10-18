import { CircleCheck, CircleHelp, Clock, TriangleAlert } from 'lucide-react';
import type { EstadoDocumental } from '@/lib/types';
import { cn } from '@/lib/utils';

const ESTADOS: Record<EstadoDocumental, { texto: string; icono: typeof CircleCheck; clases: string; icono_clase: string }> = {
  cumple: { texto: 'Tenés los papeles', icono: CircleCheck, clases: 'bg-exito-suave text-exito', icono_clase: 'text-exito' },
  alcanzable: { texto: 'Te faltan papeles, pero llegás', icono: Clock, clases: 'bg-alerta-suave text-alerta-fuerte', icono_clase: 'text-alerta' },
  dificil: { texto: 'Te falta un papel difícil de conseguir', icono: TriangleAlert, clases: 'bg-error-suave text-error', icono_clase: 'text-error' },
  desconocido: { texto: 'Papeles sin revisar', icono: CircleHelp, clases: 'bg-muted text-muted-foreground', icono_clase: 'text-muted-foreground' },
};

export function BadgeDocumentacion({ estado, className }: { estado: EstadoDocumental; className?: string }) {
  const e = ESTADOS[estado];
  const Icono = e.icono;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', e.clases, className)}>
      <Icono aria-hidden className={cn('size-3.5', e.icono_clase)} />
      {e.texto}
    </span>
  );
}
