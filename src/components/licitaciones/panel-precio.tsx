import { Info } from 'lucide-react';
import type { ItemLicitacion, Moneda, PrecioHistorico } from '@/lib/types';
import type { HistorialItem } from '@/server/precios/historial';
import { cantidad, fecha, monto, suavizarMayusculas } from './formato';
import { GraficoPrecios } from './grafico-precios';

const NOMBRE_MONEDA: Record<Moneda, string> = {
  UYU: 'pesos uruguayos (UYU)', USD: 'dólares (USD)', UI: 'unidades indexadas (UI)', UR: 'unidades reajustables (UR)', OTRA: 'otra moneda',
};

function TarjetaPrecio({ p, item, historial, mostrarMoneda }: { p: PrecioHistorico; item: ItemLicitacion | undefined; historial: HistorialItem | undefined; mostrarMoneda: boolean }) {
  const unidad = p.unidad.toLowerCase();
  return (
    <article className="space-y-4 rounded-md border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm">
          <span className="mr-2 font-mono text-muted-foreground">#{p.nroItem}</span>
          {suavizarMayusculas(p.descripcion)}
        </h3>
        <span className="text-xs text-muted-foreground">
          {item && Number.isFinite(item.cantidad) && <>Piden <span className="font-mono">{cantidad(item.cantidad)}</span> {item.unidad.toLowerCase()}</>}
          {mostrarMoneda && <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 font-mono">{p.moneda}</span>}
        </span>
      </header>

      {p.n === 0 ? (
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <p className="font-medium">Sin historial para este artículo</p>
          <p className="text-muted-foreground">No hay adjudicaciones en la misma unidad y moneda en los últimos 24 meses. Usá tu precio de lista como referencia.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Precio sugerido por {unidad}</p>
              <p className="font-mono text-2xl font-semibold tabular-nums">{monto(p.precioSugerido, p.moneda)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en <span className="font-mono text-foreground">{p.n}</span> {p.n === 1 ? 'adjudicación' : 'adjudicaciones'}
            </p>
          </div>
          {historial && historial.puntos.length > 0 && (
            <GraficoPrecios puntos={historial.puntos} n={p.n} precioSugerido={p.precioSugerido} moneda={p.moneda} unidad={unidad} descripcion={suavizarMayusculas(p.descripcion)} />
          )}
          <dl className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Último ganador</dt>
              <dd className="text-sm">
                {p.ultimoGanador ?? '—'}
                {p.ultimoPrecio !== null && <> · <span className="font-mono">{monto(p.ultimoPrecio, p.moneda)}</span></>}
                {p.ultimaFecha && <span className="text-muted-foreground"> · {fecha(p.ultimaFecha)}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Competencia frecuente</dt>
              <dd className="text-sm">
                {p.competidores.length ? (
                  <ul>{p.competidores.slice(0, 3).map((c) => (
                    <li key={c.nroDoc}>{c.nombre} <span className="text-muted-foreground">({c.vecesAdjudicado} {c.vecesAdjudicado === 1 ? 'vez' : 'veces'})</span></li>
                  ))}</ul>
                ) : '—'}
              </dd>
            </div>
          </dl>
          {p.explicacion && <p className="text-sm text-muted-foreground">{p.explicacion}</p>}
        </>
      )}
    </article>
  );
}

export function PanelPrecio({ precios, items, historial, monedaSupuesta = false }: {
  precios: PrecioHistorico[];
  items: ItemLicitacion[];
  historial: Record<number, HistorialItem>;
  /** La moneda no vino de ARCE (ítems leídos del pliego sin moneda informada). */
  monedaSupuesta?: boolean;
}) {
  if (!precios.length) {
    return (
      <p className="rounded-md border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        Ningún ítem de esta licitación coincide con tus productos, así que no mostramos precios.
      </p>
    );
  }
  const porNro = new Map(items.map((i) => [i.nroItem, i]));
  const monedas = [...new Set(precios.map((p) => p.moneda))];
  const variasMonedas = monedas.length > 1;
  const encabezado = variasMonedas
    ? 'Precios en distintas monedas: cada ítem indica la suya. Sin IVA.'
    : `Precios en ${NOMBRE_MONEDA[monedas[0]]}, sin IVA.${monedaSupuesta ? ' ARCE no informó la moneda de estos ítems: asumimos pesos.' : ''}`;

  return (
    <section className="space-y-3" aria-labelledby="titulo-precios">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="titulo-precios" className="text-base">Precio ganador histórico</h2>
          <p className="text-sm text-muted-foreground">{encabezado}</p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info aria-hidden className="size-3.5" /> Solo los ítems que podés ofertar · últimos 24 meses, misma unidad y moneda.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {precios.map((p) => (
          <TarjetaPrecio key={p.nroItem} p={p} item={porNro.get(p.nroItem)} historial={historial[p.nroItem]} mostrarMoneda={variasMonedas} />
        ))}
      </div>
    </section>
  );
}
