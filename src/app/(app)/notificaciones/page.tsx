import { Bell } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';

export default function NotificacionesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Notificaciones</h1>
      <EstadoVacio icono={Bell} titulo="No tenés notificaciones"
        descripcion="Te avisamos acá cuando aparezca una licitación nueva para vos, cuando una esté por cerrar o cuando publiquen una aclaración." />
    </div>
  );
}
