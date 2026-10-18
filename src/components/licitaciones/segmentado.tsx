'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface OpcionSegmentada<T extends string> {
  valor: T;
  texto: string;
  /** Explicación corta (tooltip nativo y lectores de pantalla). */
  ayuda?: string;
  /** Cantidad que se muestra al lado del texto (p. ej. cuántas licitaciones hay en esa pestaña). */
  cantidad?: number;
}

/**
 * Selector de una opción con resaltado que se desliza (mismo gesto que el menú de la landing).
 * Pensado para pocas opciones con texto llano. Nunca se parte en dos renglones: con 4 opciones o más,
 * en pantallas angostas se muestra como grilla de 2 columnas.
 */
export function Segmentado<T extends string>({
  opciones, valor, onCambio, id, etiqueta, className,
}: {
  opciones: OpcionSegmentada<T>[];
  valor: T;
  onCambio: (v: T) => void;
  /** Único por pantalla: identifica la animación del resaltado. */
  id: string;
  etiqueta: string;
  className?: string;
}) {
  const grilla = opciones.length >= 4;
  return (
    <div role="radiogroup" aria-label={etiqueta} className={cn(
      'gap-1 border bg-background p-1',
      grilla ? 'grid w-full grid-cols-2 rounded-2xl sm:inline-flex sm:w-auto sm:flex-nowrap sm:rounded-full' : 'inline-flex flex-nowrap rounded-full',
      className,
    )}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            title={o.ayuda}
            onClick={() => !activo && onCambio(o.valor)}
            className={cn(
              'relative px-3 py-1 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              grilla ? 'rounded-xl sm:rounded-full' : 'rounded-full',
              activo ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {activo && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={cn('absolute inset-0 border bg-card shadow-xs', grilla ? 'rounded-xl sm:rounded-full' : 'rounded-full')}
                aria-hidden
              />
            )}
            <span className="relative">
              {o.texto}
              {o.cantidad !== undefined && (
                <span className={cn('ml-1.5 font-mono text-xs tabular-nums', activo ? 'text-muted-foreground' : 'text-muted-foreground/80')}>{o.cantidad}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
