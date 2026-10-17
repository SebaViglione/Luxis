'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface OpcionSegmentada<T extends string> {
  valor: T;
  texto: string;
  /** Explicación corta (tooltip nativo y lectores de pantalla). */
  ayuda?: string;
}

/**
 * Selector de una opción con resaltado que se desliza (mismo gesto que el menú de la landing).
 * Pensado para pocas opciones con texto llano.
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
  return (
    <div role="radiogroup" aria-label={etiqueta} className={cn('inline-flex flex-wrap gap-1 rounded-full border bg-background p-1', className)}>
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
              'relative rounded-full px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activo ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {activo && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full border bg-card shadow-xs"
                aria-hidden
              />
            )}
            <span className="relative">{o.texto}</span>
          </button>
        );
      })}
    </div>
  );
}
