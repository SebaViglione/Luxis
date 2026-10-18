import { Suspense, type ComponentType } from 'react';
import { cacheLife } from 'next/cache';
import { connection } from 'next/server';
import { Coins, FileText, ListChecks, Search } from 'lucide-react';
import { precioGanador } from '@/server/mcp/herramientas';
import { coberturaDatos } from '@/server/consultas/cobertura';
import { Aparecer } from './aparecer';
import { FondoPuntos } from './fondos';
import { GuiaMcp } from './guia-mcp';
import { ConversacionMcp, type DatosConversacion } from './conversacion-mcp';

type Herramienta = { nombre: string; Icono: ComponentType<{ className?: string }>; texto: string; ejemplo: string };

const HERRAMIENTAS: Herramienta[] = [
  { nombre: 'precio_ganador', Icono: Coins, texto: 'A qué precio se adjudica un artículo y quién lo gana.', ejemplo: '{ articulo: "arena gruesa", unidad: "M3" }' },
  { nombre: 'cotizar_lista', Icono: ListChecks, texto: 'Tu lista de artículos cotizada de una vez, con el total.', ejemplo: '{ articulos: [{ articulo: "portland", cantidad: 50 }] }' },
  { nombre: 'buscar_licitaciones', Icono: Search, texto: 'Qué llamados están abiertos y cuándo cierran.', ejemplo: '{ texto: "balasto", dias: 15 }' },
  { nombre: 'detalle_licitacion', Icono: FileText, texto: 'Ítems, papeles, fechas y precio por ítem de un llamado.', ejemplo: '{ idCompra: "1377866" }' },
];

const EJEMPLO = { articulo: 'cemento portland', unidad: 'BOLSA', meses: 24 } as const;
const PREGUNTA = '¿A qué precio se adjudicó el cemento portland en bolsa y quién lo gana?';

// Si la consulta falla tira y no se cachea; Conversacion lo atrapa y muestra la ventana sin datos.
async function leerEjemplo() {
  'use cache';
  cacheLife('hours');
  return precioGanador(EJEMPLO);
}

const pesos = (v: number | null) => (v === null ? '—' : `$ ${v.toLocaleString('es-UY', { maximumFractionDigits: 2 })}`);
const entero = (v: number) => v.toLocaleString('es-UY');
const fechaUy = (iso: string) => new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium', timeZone: 'America/Montevideo' }).format(new Date(iso));
/** "BARRACA PANAMERICANA S A" → "Barraca Panamericana S A"; las siglas cortas (SA, SRL, SAS) quedan en mayúscula. */
const nombrePropio = (s: string | null) => (s ?? 'un proveedor')
  .toLowerCase()
  .replace(/(^|[\s.])([a-záéíóúñ])/g, (m) => m.toUpperCase())
  .replace(/\b(Sa|Srl|Sas)\b/g, (m) => m.toUpperCase());

/** La conversación de ejemplo con los datos de hoy. Nada de este bloque está escrito a mano. */
async function Conversacion() {
  // Se arma por pedido y no en el build: en Vercel el build no llegó a la base y el bloque quedó vacío horas en producción.
  await connection();
  const hoy = fechaUy(new Date().toISOString());
  const sinDatos: DatosConversacion = {
    pregunta: PREGUNTA, herramienta: 'precio_ganador', argumentos: `{ articulo: "${EJEMPLO.articulo}", unidad: "${EJEMPLO.unidad}" }`,
    estado: 'consultando la base…', lineas: [], json: null, pie: `Respuesta real de la base, ${hoy}.`,
  };
  let r: Awaited<ReturnType<typeof leerEjemplo>>;
  try {
    r = await leerEjemplo();
  } catch {
    return <ConversacionMcp d={sinDatos} />;
  }
  if ('error' in r) return <ConversacionMcp d={sinDatos} />;
  const g = r.porUnidad[0];
  if (!g || g.precioDelMedio === null || g.n < 5) return <ConversacionMcp d={sinDatos} />;
  const ultima = g.ultimasAdjudicaciones[0];
  const rival = g.competidores[0];
  const { desde, hasta } = g.mitadDeLasGanadorasEntre;

  const lineas = [
    `Precio del medio: ${pesos(g.precioDelMedio)} la bolsa, sin IVA, en ${entero(g.n)} adjudicaciones de ${EJEMPLO.meses} meses.`,
    desde !== null && hasta !== null ? `La mitad de las ofertas que ganaron estuvo entre ${pesos(desde)} y ${pesos(hasta)}.` : null,
    g.precioSugerido !== null ? `Para quedar en la zona ganadora: ${pesos(g.precioSugerido)}.` : null,
    ultima ? `Última: ${nombrePropio(ultima.ganador)}, ${pesos(ultima.precioUnit)} la bolsa, ${ultima.organismo ?? 'organismo sin nombre'}, ${fechaUy(ultima.fecha)}.` : null,
    rival ? `Quien más lo gana: ${nombrePropio(rival.nombre)}, ${rival.veces} ${rival.veces === 1 ? 'vez' : 'veces'}.` : null,
  ].filter((l): l is string => l !== null);

  const json = JSON.stringify({
    consulta: r.consulta,
    porUnidad: [{ ...g, ultimasAdjudicaciones: g.ultimasAdjudicaciones.slice(0, 2), competidores: g.competidores.slice(0, 3) }],
  }, null, 2);

  return (
    <ConversacionMcp d={{
      ...sinDatos, estado: `${entero(g.n)} adjudicaciones en ${EJEMPLO.meses} meses`, lineas, json,
      pie: `Respuesta real de la base, ${hoy}. Nada de este bloque está escrito a mano.`,
    }} />
  );
}

/** Cifras reales de la base, para que se entienda qué hay detrás del conector. */
async function Cifras() {
  await connection();
  const c = await coberturaDatos().catch(() => null);
  if (!c || !c.adjudicaciones) return null;
  return (
    <p className="mt-6 font-mono text-xs text-muted-foreground">
      <span className="text-foreground">{entero(c.adjudicaciones)}</span> adjudicaciones desde 2024
      <span aria-hidden className="mx-2">·</span>
      <span className="text-foreground">{entero(c.articulosConHistorial)}</span> artículos con historial de precio
      <span aria-hidden className="mx-2">·</span>
      <span className="text-foreground">{entero(c.pliegosLeidos)}</span> pliegos leídos
      {c.ultimaIngesta && <><span aria-hidden className="mx-2">·</span>actualizado el {fechaUy(c.ultimaIngesta)}</>}
    </p>
  );
}

export function Mcp() {
  return (
    <section id="mcp" className="relative scroll-mt-16 overflow-hidden border-b">
      <FondoPuntos />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <Aparecer className="max-w-3xl">
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Para tu software y para la IA que ya usás</p>
          <h2 className="mt-3 text-3xl text-balance md:text-5xl">¿Tu software depende de datos de ARCE? Conectalo.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Luxis expone su base por MCP, el protocolo abierto con el que un asistente o un sistema le habla a una fuente de datos.
            Precios ganadores de materiales de construcción desde 2024, todos los llamados abiertos y la lectura de cada pliego.
            Solo lectura, sin cuenta ni clave. Lo mismo que usa Luxis, para tu ERP, tu sistema de cotización o el Claude y el ChatGPT que ya usás.
          </p>
          <Suspense fallback={null}>
            <Cifras />
          </Suspense>
        </Aparecer>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          <Aparecer className="min-w-0">
            <Suspense fallback={null}>
              <Conversacion />
            </Suspense>
          </Aparecer>
          <Aparecer retraso={0.1} className="min-w-0">
            <GuiaMcp />
          </Aparecer>
        </div>

        <Aparecer className="mt-10">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HERRAMIENTAS.map(({ nombre, Icono, texto, ejemplo }) => (
              <li key={nombre} className="flex min-w-0 flex-col rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
                    <Icono aria-hidden className="size-4" />
                  </span>
                  <p className="truncate font-mono text-sm">{nombre}</p>
                </div>
                <p className="mt-2.5 text-sm text-muted-foreground">{texto}</p>
                <p className="mt-auto truncate pt-3 font-mono text-[11px] text-muted-foreground" title={ejemplo}>{ejemplo}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 font-mono text-[11px] text-muted-foreground">
            Streamable HTTP · JSON-RPC 2.0 · solo lectura · sin clave · datos de ARCE con Licencia de Datos Abiertos Uruguay
          </p>
        </Aparecer>
      </div>
    </section>
  );
}
