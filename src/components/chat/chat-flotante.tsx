'use client';

import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CURVA = [0.22, 1, 0.36, 1] as const;

/**
 * Ventana del chat con el pliego que acompaña mientras se navega la licitación.
 * Minimizada es un botón abajo a la derecha; abierta es un panel fijo en la misma esquina.
 * En pantallas anchas (xl) el contenido se corre para que el panel no lo tape (ver VistaLicitacion);
 * en el celular ocupa la pantalla entera por encima de la barra inferior.
 * El panel queda montado al minimizar (solo se oculta) para no cortar una respuesta ni perder lo escrito.
 */
export function ChatFlotante({ abierto, onCambio, subtitulo, children }: {
  abierto: boolean;
  onCambio: (abierto: boolean) => void;
  /** Qué licitación es (tipo y número), para no perderse al cambiar de pestaña. */
  subtitulo: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);

  // Escape minimiza el panel cuando el foco está adentro; al abrir, el foco va a la pregunta.
  useEffect(() => {
    if (!abierto) return;
    const el = panel.current;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCambio(false);
    };
    el?.addEventListener('keydown', alTeclear);
    const foco = window.setTimeout(() => el?.querySelector<HTMLElement>('textarea, input, button')?.focus(), 350);
    return () => {
      el?.removeEventListener('keydown', alTeclear);
      window.clearTimeout(foco);
    };
  }, [abierto, onCambio]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.aside
        ref={panel}
        role="region"
        aria-label="Chat con el pliego"
        aria-hidden={!abierto}
        inert={!abierto}
        initial={false}
        animate={abierto
          ? { opacity: 1, y: 0, scale: 1, visibility: 'visible' }
          : { opacity: 0, y: 24, scale: 0.98, transitionEnd: { visibility: 'hidden' } }}
        transition={{ duration: 0.4, ease: CURVA }}
        className={cn(
          'fixed z-40 flex flex-col overflow-hidden border bg-card shadow-[0_40px_80px_-40px_rgba(27,27,27,0.35)]',
          // Celular: toda la pantalla debajo de la barra superior, tapando la barra de navegación inferior.
          'inset-x-0 top-14 bottom-0 rounded-t-xl pb-[env(safe-area-inset-bottom)]',
          // Escritorio: ventana abajo a la derecha, sin pasar el alto de la pantalla.
          'md:inset-auto md:right-4 md:bottom-4 md:h-[min(40rem,calc(100dvh-6rem))] md:w-96 md:rounded-xl md:pb-0',
        )}
      >
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <MessageCircleQuestion aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">Preguntale al pliego</h2>
            <p className="truncate font-mono text-[11px] text-muted-foreground">{subtitulo}</p>
          </div>
          <Button type="button" size="icon" variant="ghost" aria-label="Minimizar el chat" onClick={() => onCambio(false)}>
            <ChevronDown />
          </Button>
        </header>
        <div className="min-h-0 flex-1 p-3">{children}</div>
      </motion.aside>

      <AnimatePresence initial={false}>
        {!abierto && (
          <motion.div
            key="boton"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: CURVA }}
            // En el celular queda por encima de la barra de navegación inferior.
            className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 md:bottom-4"
          >
            <Button
              type="button"
              size="lg"
              className="h-11 rounded-full px-4 shadow-[0_24px_48px_-20px_rgba(27,27,27,0.5)]"
              onClick={() => onCambio(true)}
            >
              <MessageCircleQuestion aria-hidden /> Preguntale al pliego
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
