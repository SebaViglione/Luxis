import { Info } from 'lucide-react';
import type { ItemLicitacion, PrecioHistorico } from '@/lib/types';
import { cantidad, fecha, monto, suavizarMayusculas } from './formato';

function Banda({ p }: { p: PrecioHistorico }) {
  if (p.minimo === null || p.maximo === null || p.p25 === null || p.p75 === null || p.maximo <= p.minimo) return null;
  const pos = (v: number) => `${((v - p.minimo!) / (p.maximo! - p.minimo!)) * 100}%`;
  return (
    <div aria-hidden className="relative h-2 rounded-full bg-primary/15">
      <div className="absolute inset-y-0 rounded-full bg-primary/45" style={{ left: pos(p.p25), right: `calc(100% - ${pos(p.p75)})` }} />
      {p.precioSugerido !== null && (
        <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-primary ring-2 ring-card" style={{ left: pos(p.precioSugerido) }} />
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="font-mono text-sm tabular-nums">{valor}</dd>
    </div>
  );
}

function TarjetaPrecio({ p, item }: { p: PrecioHistorico; item: ItemLicitacion | undefined }) {
  return (
    <article className="space-y-4 rounded-md border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm">
          <span className="mr-2 font-mono text-muted-foreground">#{p.nroItem}</span>
          {suavizarMayusculas(p.descripcion)}
        </h3>
        {item && <span className="text-xs text-muted-foreground">Piden <span className="font-mono">{cantidad(item.cantidad)}</span> {item.unidad.toLowerCase()}</span>}
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
              <p className="text-xs text-muted-foreground">Precio sugerido por {p.unidad.toLowerCase()}</p>
              <p className="font-mono text-2xl font-semibold tabular-nums">{monto(p.precioSugerido, p.moneda)}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en <span className="font-mono text-foreground">{p.n}</span> {p.n === 1 ? 'adjudicación' : 'adjudicaciones'}
            </p>
          </div>
          <Banda p={p} />
          <dl className="grid grid-cols-3 gap-3">
            <Dato etiqueta="Percentil 25" valor={monto(p.p25, p.moneda)} />
            <Dato etiqueta="Mediana" valor={monto(p.mediana, p.moneda)} />
            <Dato etiqueta="Percentil 75" valor={monto(p.p75, p.moneda)} />
          </dl>
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

export function PanelPrecio({ precios, items }: { precios: PrecioHistorico[]; items: ItemLicitacion[] }) {
  const porNro = new Map(items.map((i) => [i.nroItem, i]));
  if (!precios.length) {
    return <p className="text-sm text-muted-foreground">No hay ítems de tu lista en esta licitación, así que no calculamos precios.</p>;
  }
  return (
    <section className="space-y-3" aria-labelledby="titulo-precios">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-precios" className="text-base">Precio ganador histórico</h2>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info aria-hidden className="size-3.5" /> Precios sin IVA, últimos 24 meses, misma unidad y moneda.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {precios.map((p) => <TarjetaPrecio key={p.nroItem} p={p} item={porNro.get(p.nroItem)} />)}
      </div>
    </section>
  );
}
