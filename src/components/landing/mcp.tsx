import { Suspense, type ComponentType } from 'react';
import { cacheLife } from 'next/cache';
import { Coins, FileText, Search } from 'lucide-react';
import { precioGanador } from '@/server/mcp/herramientas';
import { Aparecer } from './aparecer';
import { GuiaMcp } from './guia-mcp';

type Herramienta = { nombre: string; Icono: ComponentType<{ className?: string }>; texto: string };

const HERRAMIENTAS: Herramienta[] = [
  { nombre: 'precio_ganador', Icono: Coins, texto: 'A qué precio se adjudica un artículo y quién lo gana.' },
  { nombre: 'buscar_licitaciones', Icono: Search, texto: 'Qué llamados están abiertos y cuándo cierran.' },
  { nombre: 'detalle_licitacion', Icono: FileText, texto: 'Ítems, papeles, fechas y precio por ítem de un llamado.' },
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
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Respuesta real de precio_ganador, hoy</p>
      <p className="mt-3 text-lg text-balance">«¿A qué precio se adjudicó el cemento portland en bolsa?»</p>
      <dl className="mt-5 grid gap-5 border-t pt-5 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Adjudicaciones, {EJEMPLO.meses} meses</dt>
          <dd className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums">{g.n}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Mediana por bolsa, sin IVA</dt>
          <dd className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums text-primary">{pesos(g.mediana)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Zona ganadora, p25 a p75</dt>
          <dd className="mt-1 font-mono text-xl font-semibold tracking-tight tabular-nums">{pesos(g.p25)} a {pesos(g.p75)}</dd>
        </div>
      </dl>
      <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
        {ultima && (
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-primary" />
            <span>Última: {nombrePropio(ultima.ganador)}, {pesos(ultima.precioUnit)} la bolsa, {ultima.organismo ?? 'organismo sin nombre'}, {fechaUy(ultima.fecha)}.</span>
          </li>
        )}
        {rival && (
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-primary" />
            <span>Quien más lo gana: {nombrePropio(rival.nombre)}, {rival.veces} {rival.veces === 1 ? 'vez' : 'veces'}.</span>
          </li>
        )}
      </ul>
    </div>
  );
}

export function Mcp() {
  return (
    <section id="mcp" className="relative scroll-mt-16 border-b">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <Aparecer>
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Para la IA que ya usás</p>
            <h2 className="mt-3 text-3xl text-balance md:text-5xl">La misma base, desde tu IA.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Un servidor MCP de solo lectura con los precios ganadores, las licitaciones abiertas y la lectura de cada pliego. Sin cuenta ni clave: datos públicos de ARCE.
            </p>
            <ul className="mt-8 divide-y border-y">
              {HERRAMIENTAS.map(({ nombre, Icono, texto }) => (
                <li key={nombre} className="flex items-center gap-4 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card">
                    <Icono className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm">{nombre}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Aparecer>

          <Aparecer retraso={0.1} className="min-w-0">
            <GuiaMcp />
            <Suspense fallback={null}>
              <Ejemplo />
            </Suspense>
          </Aparecer>
        </div>
      </div>
    </section>
  );
}
