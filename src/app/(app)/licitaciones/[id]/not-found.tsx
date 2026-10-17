import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EstadoVacio } from '@/components/ui/estado-vacio';

export default function LicitacionNoEncontrada() {
  return (
    <EstadoVacio icono={SearchX} titulo="No encontramos esta licitación"
      descripcion="Puede que el link esté mal o que la licitación no sea del rubro de tu empresa."
      accion={<Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Volver a licitaciones</Link>} />
  );
}
