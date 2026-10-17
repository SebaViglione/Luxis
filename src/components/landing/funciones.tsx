import type { ComponentType, ReactNode } from 'react';
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
  demo: ReactNode;
};

const FUNCIONES: Funcion[] = [
  {
    Icono: FileSearch,
    titulo: 'El pliego, resumido',
    texto: 'La IA lee todos los archivos del llamado y te devuelve lo que importa en una pantalla.',
    detalle: ['Qué piden, cuánto y dónde se entrega', 'Plazos y forma de pago', 'Riesgos: multas, muestras, visitas obligatorias'],
    demo: <DemoAnalisis />,
  },
  {
    Icono: Link2,
    titulo: 'Analizá cualquier llamado',
    texto: 'Pegás el link de ARCE y en un minuto lo tenés descargado, leído y analizado, aunque no te haya aparecido como match.',
    detalle: ['PDF, Word, Excel, ZIP y RAR', 'Progreso real, etapa por etapa', 'El mismo análisis que reciben tus matches'],
    demo: <DemoUrl />,
  },
  {
    Icono: MessageSquareText,
    titulo: 'Preguntale al pliego',
    texto: 'Un chat que conoce cada archivo del llamado y responde con la página exacta de donde sacó el dato.',
    detalle: ['Citas [archivo, página] en cada respuesta', 'Si no está en el pliego, te lo dice', 'Podés dictar la pregunta'],
    demo: <DemoChat />,
  },
  {
    Icono: Upload,
    titulo: 'Tu perfil en minutos',
    texto: 'Subí tu lista de precios, tu catálogo o tu web. Lo que falte, te lo preguntamos en una charla corta.',
    detalle: ['Hasta 5 archivos o una URL', 'Perfil editable: rubros, zonas, papeles', 'Contalo por voz si te queda más cómodo'],
    demo: <DemoOnboarding />,
  },
  {
    Icono: CalendarDays,
    titulo: 'Fechas que no se te pasan',
    texto: 'Consultas, visitas y aperturas de todo lo que guardaste, ordenadas en un calendario.',
    detalle: ['Fechas extraídas del pliego', 'Los próximos 14 días de un vistazo', 'Marcadas por tipo de evento'],
    demo: <DemoCalendario />,
  },
  {
    Icono: Bell,
    titulo: 'Avisos con criterio',
    texto: 'Te avisamos cuando aparece algo para vos, cuando se acerca un cierre o el organismo publica una aclaración.',
    detalle: ['Nuevos matches con su confianza', 'Cierres y visitas que se acercan', 'Aclaraciones nuevas del organismo'],
    demo: <DemoAvisos />,
  },
];

function FilaFuncion({ f, indice }: { f: Funcion; indice: number }) {
  const { Icono } = f;
  const invertida = indice % 2 === 1;
  return (
    <article className="grid min-h-[80svh] items-center gap-10 py-16 lg:grid-cols-2 lg:gap-24 lg:py-24">
      <Aparecer className={cn('min-w-0', invertida && 'lg:order-2')}>
        <p className="flex items-baseline gap-2 font-mono text-sm text-muted-foreground">
          <span className="text-primary">{String(indice + 1).padStart(2, '0')}</span>
          <span>/ {String(FUNCIONES.length).padStart(2, '0')}</span>
        </p>
        <h3 className="mt-4 flex items-center gap-3 text-3xl md:text-[2.75rem] md:leading-[1.1]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card">
            <Icono className="size-5 text-primary" />
          </span>
          {f.titulo}
        </h3>
        <p className="mt-5 max-w-md text-lg text-muted-foreground">{f.texto}</p>
        <ul className="mt-7 space-y-3">
          {f.detalle.map((d) => (
            <li key={d} className="flex items-start gap-3">
              <span aria-hidden className="mt-3 h-px w-5 shrink-0 bg-primary" />
              {d}
            </li>
          ))}
        </ul>
      </Aparecer>
      <Aparecer retraso={0.15} distancia={40} className="min-w-0">
        <div className="relative rounded-2xl border bg-card/90 p-6 shadow-[0_40px_80px_-40px_rgba(27,27,27,0.3)] backdrop-blur-[2px] md:p-10">
          <div className="lg:[zoom:1.12]">{f.demo}</div>
        </div>
      </Aparecer>
    </article>
  );
}

export function Funciones() {
  return (
    <section id="funciones" className="relative scroll-mt-16 border-b">
      <FondoHilos />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 pb-12 md:px-8 md:pt-32">
        <Aparecer className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Funciones</p>
          <h2 className="mt-3 text-4xl text-balance md:text-6xl">Todo lo que hacías a mano con el pliego, resuelto.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Seis herramientas que trabajan juntas desde que aparece el llamado hasta que presentás la oferta.</p>
        </Aparecer>
        <div className="mt-8 divide-y divide-border/70">
          {FUNCIONES.map((f, i) => (
            <FilaFuncion key={f.titulo} f={f} indice={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
