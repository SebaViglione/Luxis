'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { LogoMarca } from '@/components/marca/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Guía inicial de la app: oscurece la pantalla, recorta la parte que explica y la acompaña con
// una tarjeta. Se muestra una vez (localStorage) en /dashboard y se puede volver a abrir con
// el evento ABRIR_GUIA. Los pasos sin ancla visible (p. ej. el sidebar en mobile) se saltean.

const CLAVE = 'luxis:guia-vista';
export const ABRIR_GUIA = 'luxis:abrir-guia';
const MARGEN = 8;

type Paso = { selector?: string; titulo: string; texto: string };

const PASOS: Paso[] = [
  { titulo: 'Bienvenido a Luxis', texto: 'En un minuto te mostramos dónde está cada cosa. Podés saltear la guía cuando quieras.' },
  { selector: '[data-guia="resumen"]', titulo: 'Tus licitaciones', texto: 'Cuántas licitaciones abiertas tienen cosas que vendés, cuántas cierran esta semana y cuántas aparecieron hoy.' },
  { selector: '[data-guia="lista"] article', titulo: 'Cada tarjeta es un llamado', texto: 'Cuándo cierra, quién compra, por qué te sirve y qué podés vender. Desde acá la guardás, marcás "No me interesa" o entrás al detalle.' },
  { selector: '[data-guia="lista"] article [aria-label^="Confianza"]', titulo: 'Coincidencia con tu empresa', texto: 'Un puntaje de 0 a 100 según lo que vendés, tu zona y los papeles que piden. Alta desde 75, media desde 50.' },
  { selector: '[data-guia="filtros"]', titulo: 'Filtrá a tu medida', texto: 'Elegí la coincidencia mínima y la fecha de cierre. En "Tipo de compra y organismo" afinás por quién compra o el tamaño de la compra.' },
  { selector: '[data-guia="analizar-url"]', titulo: 'Analizá cualquier llamado', texto: '¿Viste uno en ARCE? Pegá el link y lo leemos aunque no te haya aparecido como match.' },
  { selector: 'header button[aria-label^="Notificaciones"]', titulo: 'Avisos', texto: 'Nuevos matches, cierres y visitas que se acercan y aclaraciones del organismo.' },
  { selector: 'header button[title^="Trae novedades"]', titulo: 'Buscar novedades', texto: 'Trae lo último publicado en ARCE y lo compara con lo que vendés. Suele tardar entre 10 y 30 segundos.' },
  { selector: 'aside a[href="/calendario"]', titulo: 'Calendario', texto: 'Cierres, consultas y visitas de tus licitaciones, ordenados por fecha.' },
  { titulo: 'Listo', texto: 'Empezá por la primera licitación de la lista. Si querés repasar, la guía está en el menú.' },
];

type Rect = { top: number; left: number; width: number; height: number };

function buscar(selector?: string): HTMLElement | null {
  if (!selector) return null;
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

export function GuiaInicial() {
  const pathname = usePathname();
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [indice, setIndice] = useState(0);
  // Última medida del ancla. Al cambiar de paso se conserva hasta medir la nueva: así el recorte se
  // desliza de un ancla a la otra en vez de desaparecer un cuadro (eso hacía un "flash" del velo).
  const [medida, setMedida] = useState<Rect | null>(null);

  // Primera visita al dashboard: espera a que la lista cargue y abre.
  useEffect(() => {
    if (pathname !== '/dashboard') return;
    let vista = true;
    try { vista = localStorage.getItem(CLAVE) === '1'; } catch { /* sin storage: no insistimos */ }
    if (vista) return;
    let intentos = 0;
    const t = setInterval(() => {
      intentos++;
      if (buscar('[data-guia="lista"] article') || intentos > 20) {
        clearInterval(t);
        setIndice(0);
        setAbierta(true);
      }
    }, 500);
    return () => clearInterval(t);
  }, [pathname]);

  useEffect(() => {
    const abrir = () => {
      if (pathname !== '/dashboard') router.push('/dashboard');
      setIndice(0);
      setAbierta(true);
    };
    window.addEventListener(ABRIR_GUIA, abrir);
    return () => window.removeEventListener(ABRIR_GUIA, abrir);
  }, [pathname, router]);

  const cerrar = useCallback(() => {
    setAbierta(false);
    try { localStorage.setItem(CLAVE, '1'); } catch { /* nada */ }
  }, []);

  // Avanza o retrocede salteando pasos cuya ancla no está visible.
  const mover = useCallback((direccion: 1 | -1) => {
    setIndice((i) => {
      let j = i + direccion;
      while (j > 0 && j < PASOS.length - 1 && PASOS[j].selector && !buscar(PASOS[j].selector)) j += direccion;
      if (j >= PASOS.length) { cerrar(); return i; }
      return Math.max(0, j);
    });
  }, [cerrar]);

  const paso = PASOS[indice];

  // Lleva el ancla a la vista y sigue su posición mientras dure el paso.
  useLayoutEffect(() => {
    if (!abierta) return;
    const el = buscar(paso.selector);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    let raf = 0;
    const medir = () => {
      const r = el.getBoundingClientRect();
      setMedida((prev) =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev
          : { top: r.top, left: r.left, width: r.width, height: r.height },
      );
      raf = requestAnimationFrame(medir);
    };
    raf = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(raf);
  }, [abierta, indice, paso.selector]);

  const rect = paso.selector ? medida : null;

  useEffect(() => {
    if (!abierta) return;
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowRight' || e.key === 'Enter') mover(1);
      if (e.key === 'ArrowLeft') mover(-1);
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [abierta, cerrar, mover]);

  if (!abierta) return null;

  const ultimo = indice === PASOS.length - 1;
  const centrada = !paso.selector || !rect;
  const hueco = rect && !centrada
    ? { top: rect.top - MARGEN, left: rect.left - MARGEN, width: rect.width + MARGEN * 2, height: rect.height + MARGEN * 2 }
    : null;

  // La tarjeta va debajo del ancla si entra; si no, arriba. En horizontal, alineada y dentro de la pantalla.
  const ancho = 340;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  let tarjeta: React.CSSProperties = {};
  if (hueco) {
    const abajo = hueco.top + hueco.height + 16;
    const left = Math.min(Math.max(16, hueco.left), vw - ancho - 16);
    tarjeta = abajo + 230 < vh ? { top: abajo, left } : { top: Math.max(16, hueco.top - 16 - 230), left };
  }
  // "Saltar guía" va arriba a la derecha, salvo que ahí esté lo que se resalta ("Actualizar" en la topbar):
  // en ese caso baja a la esquina inferior para no taparlo.
  const saltarAbajo = Boolean(hueco && hueco.top < 72 && hueco.left + hueco.width > vw - 220);
  const velo = hueco ?? { top: vh / 2, left: vw / 2, width: 0, height: 0 };

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Guía de Luxis">
        {/* Velo con recorte: un solo elemento siempre montado. En los pasos centrados el recorte se
            achica a un punto en el centro, así pasar de paso nunca apaga y vuelve a prender el velo. */}
        <motion.div
          className={cn('pointer-events-none absolute rounded-xl shadow-[0_0_0_9999px_rgba(27,27,27,0.62)]', hueco && 'ring-2 ring-primary')}
          initial={{ ...velo, opacity: 0 }}
          animate={{ ...velo, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30, opacity: { duration: 0.25 } }}
        >
          {hueco && <span className="absolute -inset-1.5 animate-ping rounded-xl ring-2 ring-primary/40 [animation-duration:2s] motion-reduce:hidden" />}
        </motion.div>
        {/* Bloquea clics al resto de la app mientras dura la guía */}
        <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

        <Button
          variant="secondary"
          size="sm"
          onClick={cerrar}
          className={cn('absolute right-4 z-10 rounded-full bg-background/95 px-4 shadow-lg', saltarAbajo ? 'bottom-4' : 'top-4')}
        >
          Saltar guía <X data-icon="inline-end" />
        </Button>

        <AnimatePresence mode="wait">
          <motion.div
            key={indice}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={centrada ? undefined : { ...tarjeta, width: ancho }}
            className={cn(
              'absolute z-10 rounded-2xl border bg-card p-5 shadow-[0_30px_60px_-20px_rgba(27,27,27,0.5)]',
              centrada && 'top-1/2 left-1/2 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 p-7 text-center',
            )}
          >
            {centrada && (
              <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border bg-background">
                {ultimo ? <Compass className="size-6 text-primary" /> : <LogoMarca className="size-7" />}
              </span>
            )}
            {!centrada && (
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                <span className="text-primary">{String(indice).padStart(2, '0')}</span> / {String(PASOS.length - 2).padStart(2, '0')}
              </p>
            )}
            <p className={cn('font-semibold tracking-tight', centrada ? 'text-2xl' : 'mt-2 text-lg')}>{paso.titulo}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{paso.texto}</p>

            {!centrada && (
              <div className="mt-4 flex gap-1" aria-hidden>
                {PASOS.slice(1, -1).map((_, i) => (
                  <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i + 1 <= indice ? 'bg-primary' : 'bg-border')} />
                ))}
              </div>
            )}

            <div className={cn('mt-5 flex items-center gap-2', centrada ? 'justify-center' : 'justify-between')}>
              {indice > 0 && !ultimo ? (
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => mover(-1)}>
                  <ArrowLeft data-icon="inline-start" /> Atrás
                </Button>
              ) : indice === 0 ? (
                <Button variant="ghost" className="rounded-full" onClick={cerrar}>Ahora no</Button>
              ) : <span />}
              <Button
                size={centrada ? 'lg' : 'sm'}
                className={cn('rounded-full', centrada && 'h-10 px-5')}
                onClick={() => (ultimo ? cerrar() : mover(1))}
                autoFocus
              >
                {indice === 0 ? 'Empezar la guía' : ultimo ? 'Ver mis licitaciones' : 'Siguiente'}
                {!ultimo && <ArrowRight data-icon="inline-end" />}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

/** Botón para volver a ver la guía (va en el menú lateral). */
export function BotonGuia({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(ABRIR_GUIA))}
      className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground', className)}
    >
      <Compass aria-hidden className="size-4" /> Ver la guía
    </button>
  );
}
