import { Suspense, type ComponentType, type ReactNode } from 'react';
import { cacheLife } from 'next/cache';
import { Coins, FileText, Search } from 'lucide-react';
import { precioGanador } from '@/server/mcp/herramientas';
import { Aparecer } from './aparecer';
import { ComandoClaudeCode, UrlMcp } from './url-mcp';

type Herramienta = { nombre: string; Icono: ComponentType<{ className?: string }>; texto: string };

const HERRAMIENTAS: Herramienta[] = [
  {
    nombre: 'precio_ganador',
    Icono: Coins,
    texto: 'A qué precio se adjudicó un artículo, cuántas veces, quién lo ganó la última vez y quién lo gana más seguido. Por unidad y moneda, sin IVA.',
  },
  {
    nombre: 'buscar_licitaciones',
    Icono: Search,
    texto: 'Qué llamados están abiertos, cuándo cierran, dónde se entrega y qué piden, con el resumen que hizo la IA del pliego.',
  },
  {
    nombre: 'detalle_licitacion',
    Icono: FileText,
    texto: 'La ficha completa de un llamado: ítems con cantidades, papeles que exige, fechas clave y precio ganador por ítem.',
  },
];

const PREGUNTAS = [
  '¿A qué precio se adjudicó el portland en bolsa este año y quién lo gana?',
  '¿Qué licitaciones de áridos cierran esta semana?',
  '¿Qué papeles pide la licitación 1375519?',
];

const EJEMPLO = { articulo: 'cemento portland', unidad: 'BOLSA', meses: 24 } as const;

// Si la consulta falla tira y no se cachea; Ejemplo lo atrapa y no muestra el bloque.
async function leerEjemplo() {
  'use cache';
  cacheLife('hours');
  return precioGanador(EJEMPLO);
}

const pesos = (v: number | null) => (v === null ? '—' : `$ ${v.toLocaleString('es-UY', { maximumFractionDigits: 2 })}`);
const fechaUy = (iso: string) => new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium', timeZone: 'America/Montevideo' }).format(new Date(iso));
const nombrePropio = (s: string | null) => (s ?? 'un proveedor').toLowerCase().replace(/(^|[\s.])([a-záéíóúñ])/g, (m) => m.toUpperCase());

/** Lo que devuelve `precio_ganador` para la pregunta de ejemplo, con los datos actuales. Nada de este bloque está escrito a mano. */
async function Ejemplo() {
  let r: Awaited<ReturnType<typeof leerEjemplo>>;
  try {
    r = await leerEjemplo();
  } catch {
    return null;
  }
  if ('error' in r) return null;
  const g = r.porUnidad[0];
  if (!g || g.mediana === null || g.n < 5) return null;
  const ultima = g.ultimasAdjudicaciones[0];
  const rival = g.competidores[0];

  return (
    <div className="mt-6 rounded-2xl border bg-card p-6 md:p-8">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Lo que devuelve precio_ganador, con los datos de hoy</p>
      <p className="mt-3 text-lg text-balance">«¿A qué precio se adjudicó el cemento portland en bolsa?»</p>
      <dl className="mt-6 grid gap-6 border-t pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Adjudicaciones en {EJEMPLO.meses} meses</dt>
          <dd className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums">{g.n}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Mediana por bolsa, sin IVA</dt>
          <dd className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums text-primary">{pesos(g.mediana)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Zona ganadora (p25 a p75)</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums">{pesos(g.p25)} a {pesos(g.p75)}</dd>
        </div>
      </dl>
      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        {ultima && (
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-primary" />
            <span>Última: {nombrePropio(ultima.ganador)} ganó a {pesos(ultima.precioUnit)} la bolsa para {ultima.organismo ?? 'un organismo'}, el {fechaUy(ultima.fecha)}.</span>
          </li>
        )}
        {rival && (
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-primary" />
            <span>El que más lo gana: {nombrePropio(rival.nombre)}, {rival.veces} {rival.veces === 1 ? 'vez' : 'veces'} en el período.</span>
          </li>
        )}
      </ul>
    </div>
  );
}

function Paso({ n, titulo, children }: { n: string; titulo: string; children: ReactNode }) {
  return (
    <li className="grid gap-3 sm:grid-cols-[2.5rem_1fr]">
      <span className="font-mono text-sm text-primary">{n}</span>
      <div className="min-w-0">
        <p className="font-medium">{titulo}</p>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}

export function Mcp() {
  return (
    <section id="mcp" className="relative scroll-mt-16 border-b">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <Aparecer>
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Para la IA que ya usás</p>
            <h2 className="mt-3 text-3xl text-balance md:text-5xl">La misma base, también desde Claude o ChatGPT.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Luxis expone sus datos como un servidor MCP de solo lectura: el protocolo con el que Claude, ChatGPT y otros asistentes se conectan a
              herramientas externas. Lo conectás una vez y le preguntás a tu propia IA a qué precio se gana un artículo, quién lo gana o qué
              llamados cierran esta semana. Sin pasar por la app y sin cuenta: son datos públicos de ARCE.
            </p>
            <ul className="mt-8 divide-y border-y">
              {HERRAMIENTAS.map(({ nombre, Icono, texto }) => (
                <li key={nombre} className="flex gap-4 py-4">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card">
                    <Icono className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm">{nombre}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Aparecer>

          <Aparecer retraso={0.1} className="min-w-0">
            <div className="rounded-2xl border bg-card/90 p-6 shadow-[0_40px_80px_-40px_rgba(27,27,27,0.3)] backdrop-blur-[2px] md:p-8">
              <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Conectalo en dos minutos</p>
              <ol className="mt-6 space-y-7">
                <Paso n="01" titulo="Copiá la dirección del servidor">
                  <UrlMcp />
                </Paso>
                <Paso n="02" titulo="Agregalo como conector, sin autenticación">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><span className="text-foreground">Claude</span> (claude.ai o escritorio): Ajustes, Conectores, Agregar conector personalizado.</li>
                    <li><span className="text-foreground">ChatGPT</span>: Ajustes, Conectores, modo desarrollador, Crear.</li>
                    <li><span className="text-foreground">Claude Code</span>, desde la terminal:</li>
                  </ul>
                  <div className="mt-3"><ComandoClaudeCode /></div>
                </Paso>
                <Paso n="03" titulo="Preguntá como le preguntarías a alguien del rubro">
                  <ul className="flex flex-wrap gap-2">
                    {PREGUNTAS.map((p) => (
                      <li key={p} className="rounded-full border bg-secondary px-3 py-1.5 text-sm">{p}</li>
                    ))}
                  </ul>
                </Paso>
              </ol>
            </div>
            <Suspense fallback={null}>
              <Ejemplo />
            </Suspense>
          </Aparecer>
        </div>
      </div>
    </section>
  );
}
