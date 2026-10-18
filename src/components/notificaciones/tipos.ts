import { CalendarClock, FileWarning, Inbox, Info, MapPinned, MessageSquareText, type LucideIcon } from 'lucide-react';
import type { Notificacion } from '@/lib/types';

/** etiqueta: la que acompaña cada aviso. filtro: nombre corto para las pastillas de filtro. */
export const TIPO_NOTIFICACION: Record<Notificacion['tipo'], { etiqueta: string; filtro: string; icono: LucideIcon }> = {
  nuevo_match: { etiqueta: 'Licitación nueva para vos', filtro: 'Nuevas', icono: Inbox },
  cierre_proximo: { etiqueta: 'Por cerrar', filtro: 'Por cerrar', icono: CalendarClock },
  visita_proxima: { etiqueta: 'Visita al lugar', filtro: 'Visitas', icono: MapPinned },
  aclaracion: { etiqueta: 'Cambio o aclaración del pliego', filtro: 'Cambios en el pliego', icono: MessageSquareText },
  doc_alcanzable: { etiqueta: 'Papeles', filtro: 'Papeles', icono: FileWarning },
  sistema: { etiqueta: 'Aviso de Luxis', filtro: 'De Luxis', icono: Info },
};
