import { Info } from 'lucide-react';
import type { ItemLicitacion, PrecioHistorico } from '@/lib/types';
import { cantidad, fecha, monto, suavizarMayusculas } from './formato';

function Banda({ p }: { p: PrecioHistorico }) {
  if (p.minimo === null || p.maximo === null || p.p25 === null || p.p75 === null || p.maximo <= p.minimo) return null;
  const pos = (v: number) => `${((v - p.minimo!) / (p.maximo! - p.minimo!)) * 100}%`;
  return (
    <div aria-hidden className="relative h-2 rounded-full bg-primary/15">
      <div className="absolute inset-y-0 origin-left animate-in rounded-full bg-primary/45 duration-700 fade-in-0" style={{ left: pos(p.p25), right: `calc(100% - ${pos(p.p75)})` }} />
      {p.precioSugerido !== null && (
        <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-primary ring-2 ring-card" style={{ left: pos(p.precioSugerido) }} />
      )}
    </div>
  );
}


function TarjetaPrecio({ p, item }: { p: PrecioHistorico; item: ItemLicitacion | undefined }) {
  const unidad = p.unidad.toLowerCase();
  return (
    <article className="space-y-4 rounded-md border bg-card p-4 sm:p-5">
      <header className="space-y-0.5">
        <h3 className="text-base leading-snug font-semibold">{suavizarMayusculas(p.descripcion)}</h3>
        {item && <p className="text-sm text-muted-foreground">Piden <span className="font-mono">{cantidad(item.cantidad)}</span> {item.unidad.toLowerCase()}</p>}
      </header>

      {p.n === 0 ? (
        <div className="rounded-md bg-muted px-3 py-2.5 text-sm">
          <p className="font-medium">Sin ventas parecidas al Estado</p>
          <p className="text-muted-foreground">No encontramos compras de este producto en los últimos 2 años. Usá tu precio de lista como referencia.</p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Para ganar, cotizá cerca de</p>
            <p className="font-mono text-3xl font-semibold tabular-nums">{monto(p.precioSugerido, p.moneda)} <span className="font-sans text-sm font-normal text-muted-foreground">por {unidad}</span></p>
          </div>
          {p.p25 !== null && p.p75 !== null && (
            <div className="space-y-2">
              <Banda p={p} />
              <p className="text-sm text-muted-foreground">
                La mitad de las ofertas que ganaron estuvo entre <span className="font-mono text-foreground">{monto(p.p25, p.moneda)}</span> y <span className="font-mono text-foreground">{monto(p.p75, p.moneda)}</span>.
                {' '}Lo calculamos con {p.n} {p.n === 1 ? 'compra' : 'compras'} del Estado.
              </p>
            </div>
          )}
          <dl className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">La última vez ganó</dt>
              <dd className="text-sm">
                {p.ultimoGanador ?? '—'}
                {p.ultimoPrecio !== null && <> a <span className="font-mono">{monto(p.ultimoPrecio, p.moneda)}</span></>}
                {p.ultimaFecha && <span className="text-muted-foreground"> ({fecha(p.ultimaFecha)})</span>}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Quién suele ganar</dt>
              <dd className="text-sm">
                {p.competidores.length ? (
                  <ul className="space-y-0.5">{p.competidores.slice(0, 3).map((c) => (
                    <li key={c.nroDoc}>{c.nombre} <span className="text-muted-foreground">({c.vecesAdjudicado} {c.vecesAdjudicado === 1 ? 'vez' : 'veces'})</span></li>
                  ))}</ul>
                ) : '—'}
              </dd>
            </div>
          </dl>
        </>
      )}
    </article>
  );
}

export function PanelPrecio({ precios, items }: { precios: PrecioHistorico[]; items: ItemLicitacion[] }) {
  const porNro = new Map(items.map((i) => [i.nroItem, i]));
  if (!precios.length) {
    return <p className="text-sm text-muted-foreground">Esta licitación no tiene productos de tu lista, así que no calculamos precios.</p>;
  }
  return (
    <section className="space-y-3" aria-labelledby="titulo-precios">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-precios" className="text-lg font-semibold">A qué precio ganan las ofertas</h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info aria-hidden className="size-4" /> Precios sin IVA de compras del Estado de los últimos 2 años.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {precios.map((p) => <TarjetaPrecio key={p.nroItem} p={p} item={porNro.get(p.nroItem)} />)}
      </div>
    </section>
  );
}
