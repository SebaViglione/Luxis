'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarDays, ChartColumn, CircleUser, Hourglass, LayoutList, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Contadores { noLeidas: number; enCurso: number }

interface Item {
  href: string;
  etiqueta: string;
  /** Etiqueta corta para la barra inferior del celular. */
  corta: string;
  icono: LucideIcon;
  prefijos: string[];
  contador?: keyof Contadores;
  /** Texto del contador para lectores de pantalla. */
  leerContador?: (n: number) => string;
}

const LICITACIONES: Item = { href: '/dashboard', etiqueta: 'Licitaciones', corta: 'Licitaciones', icono: LayoutList, prefijos: ['/dashboard', '/licitaciones'] };
const EN_CURSO: Item = {
  href: '/en-curso', etiqueta: 'En curso', corta: 'En curso', icono: Hourglass, prefijos: ['/en-curso'],
  contador: 'enCurso', leerContador: (n) => `${n} en curso`,
};
const CALENDARIO: Item = { href: '/calendario', etiqueta: 'Calendario', corta: 'Calendario', icono: CalendarDays, prefijos: ['/calendario'] };
const NOTIFICACIONES: Item = {
  href: '/notificaciones', etiqueta: 'Notificaciones', corta: 'Avisos', icono: Bell, prefijos: ['/notificaciones'],
  contador: 'noLeidas', leerContador: (n) => `${n} sin leer`,
};
const ESTADISTICAS: Item = { href: '/estadisticas', etiqueta: 'Mis estadísticas', corta: 'Estadísticas', icono: ChartColumn, prefijos: ['/estadisticas'] };
const CUENTA: Item = { href: '/cuenta', etiqueta: 'Cuenta', corta: 'Cuenta', icono: CircleUser, prefijos: ['/cuenta'] };

/** Barra lateral: lo del día a día arriba; la cuenta queda abajo, con el nombre de la empresa. */
const LATERAL = [LICITACIONES, EN_CURSO, CALENDARIO, NOTIFICACIONES, ESTADISTICAS];
/** Barra inferior del celular: cinco destinos fijos. Los avisos están en la campanita de arriba. */
const INFERIOR = [LICITACIONES, EN_CURSO, CALENDARIO, ESTADISTICAS, CUENTA];

const esActivo = (activo: string | null, item: Item) => activo !== null && item.prefijos.some((p) => activo.startsWith(p));

function Contador({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span aria-hidden className={cn('min-w-5 rounded-full px-1.5 text-center font-mono text-[11px] leading-5 tabular-nums', className)}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

export function Navegacion({ activo, contadores, onNavegar }: { activo: string | null; contadores?: Contadores; onNavegar?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5 px-3">
      {LATERAL.map((item) => {
        const { href, etiqueta, icono: Icono } = item;
        const on = esActivo(activo, item);
        const n = item.contador && contadores ? contadores[item.contador] : 0;
        return (
          <Link key={href} href={href} onClick={onNavegar} aria-current={on ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
              on && 'bg-sidebar-accent font-medium text-foreground',
            )}>
            {on && <span aria-hidden className="absolute top-1.5 bottom-1.5 -left-3 w-0.5 rounded-r-full bg-primary" />}
            <Icono aria-hidden className={cn('size-4', on && 'text-primary')} />
            <span className="flex-1">{etiqueta}</span>
            <Contador n={n} className={item.contador === 'noLeidas' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} />
            {n > 0 && item.leerContador && <span className="sr-only">({item.leerContador(n)})</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavegacionActiva({ contadores, onNavegar }: { contadores?: Contadores; onNavegar?: () => void }) {
  return <Navegacion activo={usePathname()} contadores={contadores} onNavegar={onNavegar} />;
}

function iniciales(nombre: string) {
  const palabras = nombre.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter((p) => p.length > 2 || /^\p{Lu}/u.test(p));
  return (palabras.slice(0, 2).map((p) => p[0]).join('') || nombre.slice(0, 1) || '·').toUpperCase();
}

/** La cuenta al pie de la barra lateral: quién está usando Luxis y acceso a sus datos. */
export function CuentaLateral({ empresa, email }: { empresa: string; email: string }) {
  const on = esActivo(usePathname(), CUENTA);
  return (
    <Link href="/cuenta" aria-current={on ? 'page' : undefined}
      className={cn('flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent', on && 'bg-sidebar-accent')}>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{iniciales(empresa)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{empresa || 'Tu empresa'}</span>
        <span className="block truncate text-xs text-muted-foreground">{on ? 'Estás en tu cuenta' : 'Tu cuenta y tu empresa'}</span>
      </span>
      <span className="sr-only">({email})</span>
    </Link>
  );
}

/** Barra inferior fija en el celular, como en las apps: cada destino siempre a la vista. */
export function NavegacionInferior({ contadores }: { contadores?: Contadores }) {
  return <BarraInferior activo={usePathname()} contadores={contadores} />;
}

/** Sin ruta activa: se usa de respaldo mientras cargan los contadores. */
export function BarraInferior({ activo, contadores }: { activo: string | null; contadores?: Contadores }) {
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {INFERIOR.map((item) => {
          const { href, corta, icono: Icono } = item;
          const on = esActivo(activo, item);
          const n = item.contador && contadores ? contadores[item.contador] : 0;
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? 'page' : undefined}
                className={cn('flex flex-col items-center gap-0.5 px-1 pt-2 pb-1.5 text-[11px] transition-colors', on ? 'font-medium text-primary' : 'text-muted-foreground')}>
                <span className="relative">
                  <Icono aria-hidden className="size-5" />
                  {n > 0 && (
                    <span aria-hidden className="absolute -top-1.5 left-3 min-w-4 rounded-full bg-foreground px-1 text-center font-mono text-[10px] leading-4 text-background tabular-nums">{n > 9 ? '9+' : n}</span>
                  )}
                </span>
                {corta}
                {n > 0 && item.leerContador && <span className="sr-only">({item.leerContador(n)})</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
