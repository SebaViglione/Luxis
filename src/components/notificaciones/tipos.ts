import { CalendarClock, FileWarning, Inbox, Info, MapPinned, MessageSquareText, type LucideIcon } from 'lucide-react';
import type { Notificacion } from '@/lib/types';

export const TIPO_NOTIFICACION: Record<Notificacion['tipo'], { etiqueta: string; icono: LucideIcon }> = {
  nuevo_match: { etiqueta: 'Licitación nueva para vos', icono: Inbox },
  cierre_proximo: { etiqueta: 'Por cerrar', icono: CalendarClock },
  visita_proxima: { etiqueta: 'Visita al lugar', icono: MapPinned },
  aclaracion: { etiqueta: 'Cambio o aclaración del pliego', icono: MessageSquareText },
  doc_alcanzable: { etiqueta: 'Papeles', icono: FileWarning },
  sistema: { etiqueta: 'Aviso de Luxis', icono: Info },
};
