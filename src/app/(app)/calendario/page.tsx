import { CalendarDays } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';

export default function CalendarioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Calendario</h1>
      <EstadoVacio icono={CalendarDays} titulo="Próximamente"
        descripcion="Vas a ver en un mes los cierres de ofertas, las visitas obligatorias, los plazos de consultas y las entregas de tus licitaciones." />
    </div>
  );
}
