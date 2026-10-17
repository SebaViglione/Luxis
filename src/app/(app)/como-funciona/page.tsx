import { BookOpen } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';

export default function ComoFuncionaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Cómo funciona la IA</h1>
      <EstadoVacio icono={BookOpen} titulo="Próximamente"
        descripcion="Acá vamos a explicar qué hace cada parte de la IA, qué datos usa, sus limitaciones y cuántas licitaciones cubrimos." />
    </div>
  );
}
