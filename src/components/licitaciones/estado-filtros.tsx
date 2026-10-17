'use client';

import { createContext, useContext, useOptimistic, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface EstadoFiltros {
  /** Parámetros que ve la UI: los optimistas mientras el servidor responde, los de la URL después. */
  params: URLSearchParams;
  pendiente: boolean;
  aplicar: (cambios: Record<string, string | null> | 'limpiar') => void;
}

const Contexto = createContext<EstadoFiltros | null>(null);

/**
 * Estado compartido de los filtros del dashboard: los controles cambian al instante (useOptimistic) y la
 * lista sabe que hay una búsqueda en curso (useTransition) para atenuarse en vez de quedar "congelada".
 */
export function ProveedorFiltros({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pendiente, iniciar] = useTransition();
  const [optimista, setOptimista] = useOptimistic(sp.toString());

  const aplicar: EstadoFiltros['aplicar'] = (cambios) => {
    const p = new URLSearchParams(cambios === 'limpiar' ? '' : optimista);
    if (cambios !== 'limpiar') {
      for (const [k, v] of Object.entries(cambios)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
    }
    const qs = p.toString();
    iniciar(() => {
      setOptimista(qs);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <Contexto.Provider value={{ params: new URLSearchParams(optimista), pendiente, aplicar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useEstadoFiltros(): EstadoFiltros {
  const c = useContext(Contexto);
  if (!c) throw new Error('useEstadoFiltros fuera de ProveedorFiltros');
  return c;
}

/** Barra de progreso fina e indeterminada mientras se busca con los filtros nuevos. */
export function BarraBuscando({ activa }: { activa: boolean }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-md transition-opacity duration-200', activa ? 'opacity-100' : 'opacity-0')}>
      <div className="h-full w-1/3 animate-[luxis-barra_1.1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}

/** Envuelve la lista: mientras hay búsqueda en curso se atenúa y muestra "Buscando…", sin desmontar ni saltar. */
export function ListaConEstado({ children }: { children: ReactNode }) {
  const { pendiente } = useEstadoFiltros();
  return (
    <div aria-busy={pendiente} className="relative min-h-[24rem]">
      <p role="status" aria-live="polite" className={cn('absolute -top-6 right-0 text-xs text-muted-foreground transition-opacity duration-200', pendiente ? 'opacity-100' : 'opacity-0')}>
        {pendiente ? 'Buscando con los filtros nuevos…' : ''}
      </p>
      <div className={cn('transition-opacity duration-200', pendiente && 'pointer-events-none opacity-50')}>{children}</div>
    </div>
  );
}
