'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookOpen, CalendarDays, CircleUser, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAVEGACION = [
  { href: '/dashboard', etiqueta: 'Licitaciones', icono: LayoutList, prefijos: ['/dashboard', '/licitaciones'] },
  { href: '/calendario', etiqueta: 'Calendario', icono: CalendarDays, prefijos: ['/calendario'] },
  { href: '/notificaciones', etiqueta: 'Notificaciones', icono: Bell, prefijos: ['/notificaciones'] },
  { href: '/como-funciona', etiqueta: 'Cómo funciona', icono: BookOpen, prefijos: ['/como-funciona'] },
  { href: '/cuenta', etiqueta: 'Cuenta', icono: CircleUser, prefijos: ['/cuenta'] },
];

export function Navegacion({ activo, onNavegar }: { activo: string | null; onNavegar?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5 px-3">
      {NAVEGACION.map(({ href, etiqueta, icono: Icono, prefijos }) => {
        const esActivo = activo !== null && prefijos.some((p) => activo.startsWith(p));
        return (
          <Link key={href} href={href} onClick={onNavegar} aria-current={esActivo ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
              esActivo && 'bg-sidebar-accent font-medium text-foreground',
            )}>
            {esActivo && <span aria-hidden className="absolute top-1.5 bottom-1.5 -left-3 w-0.5 rounded-r-full bg-primary" />}
            <Icono aria-hidden className={cn('size-4', esActivo && 'text-primary')} />
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavegacionActiva({ onNavegar }: { onNavegar?: () => void }) {
  return <Navegacion activo={usePathname()} onNavegar={onNavegar} />;
}
