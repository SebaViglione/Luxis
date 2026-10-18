import { Info } from 'lucide-react';
import type { ItemLicitacion, Moneda, PrecioHistorico } from '@/lib/types';
import type { HistorialItem } from '@/server/precios/historial';
import { cantidad, fecha, monto, nombrePropio, suavizarMayusculas } from './formato';
import { CajaPrecios, LeyendaCaja } from './caja-precios';

const NOMBRE_MONEDA: Record<Moneda, string> = {
  UYU: 'pesos uruguayos', USD: 'dólares', UI: 'unidades indexadas', UR: 'unidades reajustables', OTRA: 'otra moneda',
};

/** Rótulo chico de dato (eyebrow de la marca). */
function Rotulo({ children }: { children: React.ReactNode }) {
  return <dt className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{children}</dt>;
}

function TarjetaPrecio({ p, item, historial, mostrarMoneda }: { p: PrecioHistorico; item: ItemLicitacion | undefined; historial: HistorialItem | undefined; mostrarMoneda: boolean }) {
  const unidad = p.unidad.toLowerCase();
  const competidores = p.competidores.slice(0, 3);
  return (
    <article className="flex flex-col rounded-md border bg-card">
      <header className="space-y-0.5 border-b px-4 py-3 sm:px-5">
        <h3 className="text-base leading-snug font-semibold">{suavizarMayusculas(p.descripcion)}</h3>
        {item && Number.isFinite(item.cantidad) && (
          <p className="text-sm text-muted-foreground">
            Piden <span className="font-mono text-foreground tabular-nums">{cantidad(item.cantidad)}</span> {item.unidad.toLowerCase()}
            {mostrarMoneda && <> · en {NOMBRE_MONEDA[p.moneda]}</>}
          </p>
        )}
      </header>

      {p.n === 0 ? (
        <div className="m-4 rounded-md bg-muted px-3 py-2.5 text-sm sm:m-5">
          <p className="font-medium">Sin ventas parecidas al Estado</p>
          <p className="text-muted-foreground">No encontramos compras de este producto en los últimos 2 años. Usá tu precio de lista como referencia.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 px-4 pt-4 pb-3 sm:px-5">
            <div>
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Para ganar, cotizá cerca de</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
                {monto(p.precioSugerido, p.moneda)} <span className="font-sans text-sm font-normal text-muted-foreground">por {unidad}</span>
              </p>
            </div>
            <CajaPrecios p={p} puntos={historial?.puntos ?? []} unidad={unidad} />
          </div>

          <dl className="grid grid-cols-2 border-t">
            <div className="px-4 py-3 sm:px-5">
              <Rotulo>Rango habitual</Rotulo>
              <dd className="mt-1 font-mono text-sm tabular-nums">
                {p.p25 !== null && p.p75 !== null ? <>{monto(p.p25, p.moneda)} <span className="text-muted-foreground">–</span> {monto(p.p75, p.moneda)}</> : '—'}
              </dd>
              <dd className="text-xs text-muted-foreground">la mitad de las ofertas que ganaron</dd>
            </div>
            <div className="border-l px-4 py-3 sm:px-5">
              <Rotulo>Compras analizadas</Rotulo>
              <dd className="mt-1 font-mono text-sm tabular-nums">{p.n}</dd>
              <dd className="text-xs text-muted-foreground">del Estado en los últimos 2 años</dd>
            </div>
          </dl>

          <dl className="space-y-3 border-t px-4 py-3 sm:px-5">
            <div>
              <Rotulo>Última adjudicación</Rotulo>
              <dd className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                <span className="min-w-0 truncate">{p.ultimoGanador ? nombrePropio(p.ultimoGanador) : '—'}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {p.ultimoPrecio !== null && <span className="text-foreground">{monto(p.ultimoPrecio, p.moneda)}</span>}
                  {p.ultimaFecha && <> · {fecha(p.ultimaFecha)}</>}
                </span>
              </dd>
            </div>
            {competidores.length > 0 && (
              <div>
                <Rotulo>Quién suele ganar</Rotulo>
                <dd className="mt-1">
                  <ol className="space-y-1 text-sm">
                    {competidores.map((c) => (
                      <li key={c.nroDoc} className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate">{nombrePropio(c.nombre)}</span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{c.vecesAdjudicado} {c.vecesAdjudicado === 1 ? 'vez' : 'veces'}</span>
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
            )}
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
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="titulo-precios" className="text-lg font-semibold">A qué precio ganan las ofertas</h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info aria-hidden className="size-4 shrink-0" /> {aclaracion}
        </p>
      </div>
      <LeyendaCaja />
      <div className="grid gap-3 lg:grid-cols-2">
        {precios.map((p) => (
          <TarjetaPrecio key={p.nroItem} p={p} item={porNro.get(p.nroItem)} historial={historial[p.nroItem]} mostrarMoneda={variasMonedas} />
        ))}
      </div>
    </section>
  );
}
