import { CalendarClock, FileWarning, Inbox, Info, MapPinned, MessageSquareText, type LucideIcon } from 'lucide-react';
import type { Notificacion } from '@/lib/types';

export const TIPO_NOTIFICACION: Record<Notificacion['tipo'], { etiqueta: string; icono: LucideIcon }> = {
  nuevo_match: { etiqueta: 'Nueva licitación', icono: Inbox },
  cierre_proximo: { etiqueta: 'Cierre próximo', icono: CalendarClock },
  visita_proxima: { etiqueta: 'Visita', icono: MapPinned },
  aclaracion: { etiqueta: 'Aclaración', icono: MessageSquareText },
  doc_alcanzable: { etiqueta: 'Documentación', icono: FileWarning },
  sistema: { etiqueta: 'Sistema', icono: Info },
};
