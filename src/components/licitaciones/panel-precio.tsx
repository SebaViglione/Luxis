import { Info } from 'lucide-react';
import type { ItemLicitacion, Moneda, PrecioHistorico } from '@/lib/types';
import type { HistorialItem } from '@/server/precios/historial';
import { cantidad, fecha, monto, suavizarMayusculas } from './formato';
import { CajaPrecios } from './caja-precios';

const NOMBRE_MONEDA: Record<Moneda, string> = {
  UYU: 'pesos uruguayos', USD: 'dólares', UI: 'unidades indexadas', UR: 'unidades reajustables', OTRA: 'otra moneda',
};

function TarjetaPrecio({ p, item, historial, mostrarMoneda }: { p: PrecioHistorico; item: ItemLicitacion | undefined; historial: HistorialItem | undefined; mostrarMoneda: boolean }) {
  const unidad = p.unidad.toLowerCase();
  return (
    <article className="space-y-4 rounded-md border bg-card p-4 sm:p-5">
      <header className="space-y-0.5">
        <h3 className="text-base leading-snug font-semibold">{suavizarMayusculas(p.descripcion)}</h3>
        {item && Number.isFinite(item.cantidad) && (
          <p className="text-sm text-muted-foreground">
            Piden <span className="font-mono">{cantidad(item.cantidad)}</span> {item.unidad.toLowerCase()}
            {mostrarMoneda && <> · en {NOMBRE_MONEDA[p.moneda]}</>}
          </p>
        )}
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
          <CajaPrecios p={p} puntos={historial?.puntos ?? []} unidad={unidad} />
          {p.p25 !== null && p.p75 !== null && (
            <p className="text-sm text-muted-foreground">
              La mitad de las ofertas que ganaron estuvo entre <span className="font-mono text-foreground">{monto(p.p25, p.moneda)}</span> y <span className="font-mono text-foreground">{monto(p.p75, p.moneda)}</span>.
              {' '}Lo calculamos con {p.n} {p.n === 1 ? 'compra' : 'compras'} del Estado.
            </p>
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

export function PanelPrecio({ precios, items, historial = {}, monedaSupuesta = false }: {
  precios: PrecioHistorico[];
  items: ItemLicitacion[];
  /** Serie de precios ganadores en el tiempo por ítem (src/server/precios/historial.ts). */
  historial?: Record<number, HistorialItem>;
  /** La moneda no vino de ARCE (ítems leídos del pliego sin moneda informada). */
  monedaSupuesta?: boolean;
}) {
  const porNro = new Map(items.map((i) => [i.nroItem, i]));
  if (!precios.length) {
    return <p className="text-sm text-muted-foreground">Esta licitación no tiene productos de tu lista, así que no calculamos precios.</p>;
  }
  const monedas = [...new Set(precios.map((p) => p.moneda))];
  const variasMonedas = monedas.length > 1;
  const aclaracion = variasMonedas
    ? 'Precios sin IVA, en la moneda de cada producto, de compras del Estado de los últimos 2 años.'
    : `Precios en ${NOMBRE_MONEDA[monedas[0]]}, sin IVA, de compras del Estado de los últimos 2 años.${monedaSupuesta ? ' ARCE no informó la moneda: asumimos pesos.' : ''}`;
  return (
    <section className="space-y-3" aria-labelledby="titulo-precios">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-precios" className="text-lg font-semibold">A qué precio ganan las ofertas</h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info aria-hidden className="size-4" /> {aclaracion}
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
