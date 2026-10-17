'use client';

import { useRef, useState, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { Bell, CalendarDays, FileSearch, Link2, MessageSquareText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Aparecer } from './aparecer';
import { DemoAnalisis, DemoAvisos, DemoCalendario, DemoChat, DemoOnboarding, DemoUrl } from './demos';
import { FondoHilos } from './fondos';

type Funcion = {
  Icono: ComponentType<{ className?: string }>;
  titulo: string;
  texto: string;
  detalle: string[];
  Demo: ComponentType;
};

const FUNCIONES: Funcion[] = [
  {
    Icono: FileSearch,
    titulo: 'El pliego, resumido',
    texto: 'La IA lee todos los archivos del llamado y te devuelve lo que importa en una pantalla.',
    detalle: ['Qué piden, cuánto y dónde se entrega', 'Plazos y forma de pago', 'Riesgos: multas, muestras, visitas obligatorias'],
    Demo: DemoAnalisis,
  },
  {
    Icono: Link2,
    titulo: 'Analizá cualquier llamado',
    texto: 'Pegás el link de ARCE y en un minuto lo tenés descargado, leído y analizado, aunque no te haya aparecido como match.',
    detalle: ['PDF, Word, Excel, ZIP y RAR', 'Progreso real, etapa por etapa', 'El mismo análisis que reciben tus matches'],
    Demo: DemoUrl,
  },
  {
    Icono: MessageSquareText,
    titulo: 'Preguntale al pliego',
    texto: 'Un chat que conoce cada archivo del llamado y responde con la página exacta de donde sacó el dato.',
    detalle: ['Citas [archivo, página] en cada respuesta', 'Si no está en el pliego, te lo dice', 'Podés dictar la pregunta'],
    Demo: DemoChat,
  },
  {
    Icono: Upload,
    titulo: 'Tu perfil en minutos',
    texto: 'Subí tu lista de precios, tu catálogo o tu web. Lo que falte, te lo preguntamos en una charla corta.',
    detalle: ['Hasta 5 archivos o una URL', 'Perfil editable: rubros, zonas, papeles', 'Contalo por voz si te queda más cómodo'],
    Demo: DemoOnboarding,
  },
  {
    Icono: CalendarDays,
    titulo: 'Fechas que no se te pasan',
    texto: 'Consultas, visitas y aperturas de todo lo que guardaste, ordenadas en un calendario.',
    detalle: ['Fechas extraídas del pliego', 'Los próximos 14 días de un vistazo', 'Marcadas por tipo de evento'],
    Demo: DemoCalendario,
  },
  {
    Icono: Bell,
    titulo: 'Avisos con criterio',
    texto: 'Te avisamos cuando aparece algo para vos, cuando se acerca un cierre o el organismo publica una aclaración.',
    detalle: ['Nuevos matches con su confianza', 'Cierres y visitas que se acercan', 'Aclaraciones nuevas del organismo'],
    Demo: DemoAvisos,
  },
];

const N = FUNCIONES.length;
const numero = (i: number) => String(i + 1).padStart(2, '0');

function Texto({ f, i }: { f: Funcion; i: number }) {
  const { Icono } = f;
  return (
    <>
      <p className="flex items-baseline gap-2 font-mono text-sm text-muted-foreground">
        <span className="text-primary">{numero(i)}</span>
        <span>/ {numero(N - 1)}</span>
      </p>
      <span className="mt-5 flex size-10 items-center justify-center rounded-lg border bg-card">
        <Icono className="size-5 text-primary" />
      </span>
      <h3 className="mt-4 text-3xl text-balance md:text-[2.6rem] md:leading-[1.1]">{f.titulo}</h3>
      <p className="mt-5 max-w-md text-lg text-muted-foreground">{f.texto}</p>
      <ul className="mt-7 space-y-3">
        {f.detalle.map((d) => (
          <li key={d} className="flex items-start gap-3">
            <span aria-hidden className="mt-3 h-px w-5 shrink-0 bg-primary" />
            {d}
          </li>
        ))}
      </ul>
    </>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-2xl border bg-card/90 p-6 shadow-[0_40px_80px_-40px_rgba(27,27,27,0.3)] backdrop-blur-[2px] md:p-10">
      {children}
    </div>
  );
}

/** Desktop: la sección queda fija y las funciones van pasando a medida que se scrollea. */
function EscenarioFijo() {
  const pista = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: pista, offset: ['start start', 'end end'] });
  const avance = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [activa, setActiva] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActiva(Math.min(N - 1, Math.max(0, Math.floor(v * N)))));
  const f = FUNCIONES[activa];

  const irA = (i: number) => {
    const el = pista.current;
    if (!el) return;
    const recorrido = el.offsetHeight - window.innerHeight;
    const inicio = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: inicio + recorrido * ((i + 0.5) / N), behavior: 'smooth' });
  };

  return (
    <div ref={pista} className="relative hidden lg:block" style={{ height: `${N * 90}svh` }}>
      <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[15rem_1fr_1.1fr] items-center gap-12 px-8">
          {/* Índice */}
          <nav aria-label="Funciones" className="relative self-center">
            <div aria-hidden className="absolute top-0 bottom-0 left-0 w-px bg-border">
              <motion.div style={{ scaleY: avance }} className="absolute inset-0 origin-top bg-primary" />
            </div>
            <ol className="space-y-1">
              {FUNCIONES.map((x, i) => (
                <li key={x.titulo}>
                  <button
                    type="button"
                    onClick={() => irA(i)}
                    aria-current={i === activa ? 'step' : undefined}
                    className={cn(
                      'flex w-full items-baseline gap-3 py-2 pl-5 text-left text-sm whitespace-nowrap transition-colors duration-300',
                      i === activa ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className={cn('font-mono text-xs', i === activa && 'text-primary')}>{numero(i)}</span>
                    {x.titulo}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          {/* Texto */}
          <div className="relative min-h-[22rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activa}
                initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -28, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Texto f={f} i={activa} />
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Demo */}
          <div className="relative [perspective:1400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activa}
                initial={{ opacity: 0, rotateY: -14, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 14, x: -40, scale: 0.96 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <Panel>
                  <div className="[zoom:1.12]"><f.Demo /></div>
                </Panel>
                <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">Ejemplo ilustrativo</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile y tablet: una debajo de la otra. */
function ListaApilada() {
  return (
    <div className="divide-y divide-border/70 px-4 md:px-8 lg:hidden">
      {FUNCIONES.map((f, i) => (
        <article key={f.titulo} className="grid gap-8 py-14">
          <Aparecer className="min-w-0"><Texto f={f} i={i} /></Aparecer>
          <Aparecer retraso={0.1} className="min-w-0"><Panel><f.Demo /></Panel></Aparecer>
        </article>
      ))}
    </div>
  );
}

export function Funciones() {
  return (
    <MotionConfig reducedMotion="user">
      <section id="funciones" className="relative scroll-mt-16 border-b">
        <FondoHilos />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 pb-8 md:px-8 md:pt-32">
          <Aparecer className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Funciones</p>
            <h2 className="mt-3 text-4xl text-balance md:text-6xl">Todo lo que hacías a mano con el pliego, resuelto.</h2>
          </Aparecer>
        </div>
        <div className="relative">
          <EscenarioFijo />
          <ListaApilada />
        </div>
      </section>
    </MotionConfig>
  );
}
