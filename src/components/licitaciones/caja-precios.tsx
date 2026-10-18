'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PrecioHistorico } from '@/lib/types';
import type { PuntoPrecio } from '@/server/precios/historial';
import { cn } from '@/lib/utils';
import { cantidad, fecha, monto } from './formato';

/**
 * Diagrama de caja y bigote de los precios ganadores de un ítem, sin jerga estadística:
 * la caja es donde cayó la mitad central de las ofertas que ganaron, la zona ladrillo es la "zona ganadora"
 * (del borde bajo de la caja al precio del medio) y la marca es el precio sugerido. Debajo, las últimas
 * adjudicaciones como puntos, con detalle al pasar el mouse.
 */

const ALTO = 164;
const M = { izquierda: 12, derecha: 12 };
const Y = { etiqueta: 14, cajaArriba: 40, cajaAlto: 26, puntosArriba: 86, puntosAlto: 28, eje: 128, ticks: 146 };
const RADIO_ACIERTO = 22;
/** Montos del eje sin centavos cuando son redondos: "$ 200" en vez de "$ 200,00". */
const montoEje = (v: number, moneda: PrecioHistorico['moneda']) => monto(v, moneda).replace(/,00$/, '');

function pasoLindo(rango: number, divisiones: number) {
  const bruto = rango / divisiones;
  const magnitud = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / magnitud;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * magnitud;
}

function ticksLindos(x0: number, x1: number) {
  const paso = pasoLindo(x1 - x0 || x1 || 1, 4);
  const ticks: number[] = [];
  for (let v = Math.ceil(x0 / paso) * paso; v <= x1 + paso / 1000; v += paso) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/** Cómo leer el diagrama. Va una sola vez arriba del panel, no en cada tarjeta. */
export function LeyendaCaja() {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="mr-1.5 inline-block size-2.5 translate-y-px rounded-sm border bg-secondary" aria-hidden />
      La caja es donde cayó la mitad de las ofertas que ganaron; la línea negra, el precio del medio.
      {' '}<span className="mr-1.5 ml-1 inline-block size-2.5 translate-y-px rounded-sm bg-primary/30" aria-hidden />
      La zona ladrillo es la zona ganadora. Los puntos son las últimas adjudicaciones; las que quedan fuera del rango habitual no se dibujan, pero están en la tabla.
    </p>
  );
}

export function CajaPrecios({ p, puntos, unidad }: { p: PrecioHistorico; puntos: PuntoPrecio[]; unidad: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [activo, setActivo] = useState<number | null>(null);

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const datos = useMemo(() => [...puntos].sort((a, b) => a.precioUnit - b.precioUnit), [puntos]);

  const { p25, p75, mediana, minimo, maximo, precioSugerido, moneda } = p;
  if (p25 === null || p75 === null || mediana === null || minimo === null || maximo === null) return null;

  // Bigotes: hasta el valor más extremo dentro de 1,5 veces el alto de la caja. Lo que queda afuera se cuenta aparte.
  const iqr = Math.max(p75 - p25, 0);
  const margenCerca = iqr > 0 ? 1.5 * iqr : Math.max(mediana * 0.5, 1);
  const bigoteBajo = Math.max(minimo, p25 - margenCerca);
  const bigoteAlto = Math.min(maximo, p75 + margenCerca);
  const visibles = datos.filter((d) => d.precioUnit >= bigoteBajo && d.precioUnit <= bigoteAlto);

  const rango = bigoteAlto - bigoteBajo || bigoteAlto || 1;
  const x0 = Math.max(0, bigoteBajo - rango * 0.06);
  const x1 = bigoteAlto + rango * 0.06;
  const anchoPlot = Math.max(ancho - M.izquierda - M.derecha, 1);
  const x = (v: number) => M.izquierda + ((v - x0) / (x1 - x0)) * anchoPlot;
  const ticks = ticksLindos(x0, x1);
  const cajaCentro = Y.cajaArriba + Y.cajaAlto / 2;
  const cajaDegenerada = p75 - p25 <= 0;
  // Jitter vertical fijo (no aleatorio) para que los puntos no se pisen y el render sea estable.
  const yPunto = (i: number) => Y.puntosArriba + 4 + ((i * 7) % (Y.puntosAlto - 8));

  const resumen = `Precios ganadores de ${p.descripcion}, por ${unidad}, sin IVA: la mitad central de ${p.n} ofertas ganadoras estuvo entre `
    + `${monto(p25, moneda)} y ${monto(p75, moneda)}; precio del medio ${monto(mediana, moneda)}; `
    + (precioSugerido !== null ? `precio sugerido ${monto(precioSugerido, moneda)}. ` : '')
    + `Rango habitual de ${monto(bigoteBajo, moneda)} a ${monto(bigoteAlto, moneda)}.`;

  const alMover = (e: React.PointerEvent<SVGSVGElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - caja.left, py = e.clientY - caja.top;
    let mejor: number | null = null, distancia = RADIO_ACIERTO;
    visibles.forEach((d, i) => {
      const dist = Math.hypot(x(d.precioUnit) - px, yPunto(i) - py);
      if (dist < distancia) { distancia = dist; mejor = i; }
    });
    setActivo(mejor);
  };

  const punto = activo !== null ? visibles[activo] : null;
  const aLaIzquierda = punto ? x(punto.precioUnit) > ancho / 2 : false;
  const anclaEtiqueta = (v: number) => (x(v) < 90 ? 'start' : x(v) > ancho - 90 ? 'end' : 'middle');

  return (
    <figure className="space-y-2">
      <div ref={contenedor} className="relative w-full" style={{ height: ALTO }}>
        {ancho > 0 && (
          <svg width={ancho} height={ALTO} role="img" aria-label={resumen} className="block touch-none select-none"
            onPointerMove={alMover} onPointerLeave={() => setActivo(null)}>
            {/* Eje de precios */}
            <line x1={M.izquierda} x2={ancho - M.derecha} y1={Y.eje} y2={Y.eje} className="stroke-border" strokeWidth={1} />
            {ticks.map((v, i) => (
              <g key={v}>
                <line x1={x(v)} x2={x(v)} y1={Y.eje} y2={Y.eje + 4} className="stroke-border" strokeWidth={1} />
                <text x={x(v)} y={Y.ticks} textAnchor={i === 0 && x(v) < 40 ? 'start' : i === ticks.length - 1 && x(v) > ancho - 40 ? 'end' : 'middle'}
                  className="fill-muted-foreground font-mono text-[11px]">{montoEje(v, moneda)}</text>
              </g>
            ))}

            {/* Bigotes */}
            <line x1={x(bigoteBajo)} x2={x(cajaDegenerada ? mediana : p25)} y1={cajaCentro} y2={cajaCentro} className="stroke-foreground/50" strokeWidth={1.5} />
            <line x1={x(cajaDegenerada ? mediana : p75)} x2={x(bigoteAlto)} y1={cajaCentro} y2={cajaCentro} className="stroke-foreground/50" strokeWidth={1.5} />
            <line x1={x(bigoteBajo)} x2={x(bigoteBajo)} y1={cajaCentro - 7} y2={cajaCentro + 7} className="stroke-foreground/50" strokeWidth={1.5} />
            <line x1={x(bigoteAlto)} x2={x(bigoteAlto)} y1={cajaCentro - 7} y2={cajaCentro + 7} className="stroke-foreground/50" strokeWidth={1.5} />

            {/* Caja: la mitad central. Zona ganadora en ladrillo, del borde bajo al precio del medio. */}
            {!cajaDegenerada && (
              <g>
                <rect x={x(p25)} y={Y.cajaArriba} width={Math.max(x(p75) - x(p25), 2)} height={Y.cajaAlto} rx={3} className="fill-secondary stroke-border" strokeWidth={1} />
                <rect x={x(p25)} y={Y.cajaArriba} width={Math.max(x(mediana) - x(p25), 2)} height={Y.cajaAlto} rx={3} className="fill-primary" fillOpacity={0.3} />
                <line x1={x(mediana)} x2={x(mediana)} y1={Y.cajaArriba} y2={Y.cajaArriba + Y.cajaAlto} className="stroke-foreground" strokeWidth={2} />
              </g>
            )}
            {cajaDegenerada && (
              <line x1={x(mediana)} x2={x(mediana)} y1={Y.cajaArriba} y2={Y.cajaArriba + Y.cajaAlto} className="stroke-foreground" strokeWidth={2} />
            )}

            {/* Precio sugerido */}
            {precioSugerido !== null && (
              <g>
                <line x1={x(precioSugerido)} x2={x(precioSugerido)} y1={Y.cajaArriba - 8} y2={Y.cajaArriba + Y.cajaAlto + 8} className="stroke-primary" strokeWidth={3} strokeLinecap="round" />
                <text x={x(precioSugerido)} y={Y.etiqueta} textAnchor={anclaEtiqueta(precioSugerido)} className="fill-primary font-mono text-[12px] font-semibold">
                  Apuntá a {monto(precioSugerido, moneda)}
                </text>
              </g>
            )}

            {/* Últimas adjudicaciones */}
            {visibles.map((d, i) => (
              <circle key={`${d.idCompra}-${i}`} cx={x(d.precioUnit)} cy={yPunto(i)} r={activo === i ? 6 : 4}
                className={cn('stroke-card', activo === i ? 'fill-primary' : 'fill-foreground/35')} strokeWidth={1.5} />
            ))}
          </svg>
        )}
        {punto && (
          <div aria-hidden className={cn('pointer-events-none absolute z-10 w-56 rounded-md border bg-popover p-2.5 text-xs shadow-md', aLaIzquierda ? '-translate-x-full' : '')}
            style={{ left: x(punto.precioUnit) + (aLaIzquierda ? -12 : 12), top: 8 }}>
            <p className="font-mono text-muted-foreground">{fecha(punto.fecha)}</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{monto(punto.precioUnit, moneda)} <span className="font-sans text-xs font-normal text-muted-foreground">por {unidad}</span></p>
            <p className="mt-1 text-foreground">{punto.ganador ?? 'Ganador sin nombre'}</p>
            {punto.cantidad !== null && <p className="text-muted-foreground">Cantidad: <span className="font-mono">{cantidad(punto.cantidad)}</span> {punto.unidad?.toLowerCase() ?? ''}</p>}
            {punto.organismo && <p className="text-muted-foreground">{punto.organismo}</p>}
          </div>
        )}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {datos.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-foreground underline-offset-4 hover:underline">
              Ver {datos.length === 1 ? 'la adjudicación' : `las ${datos.length} adjudicaciones`} como tabla
            </summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-md border bg-card">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">{resumen}</caption>
                <thead className="sticky top-0 bg-card text-muted-foreground">
                  <tr><th scope="col" className="px-2 py-1.5 font-medium">Fecha</th><th scope="col" className="px-2 py-1.5 text-right font-medium">Precio</th><th scope="col" className="px-2 py-1.5 font-medium">Ganador</th><th scope="col" className="px-2 py-1.5 text-right font-medium">Cantidad</th><th scope="col" className="px-2 py-1.5 font-medium">Organismo</th></tr>
                </thead>
                <tbody>
                  {[...puntos].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)).map((d, i) => (
                    <tr key={`${d.idCompra}-${i}`} className="border-t">
                      <td className="px-2 py-1 font-mono whitespace-nowrap">{fecha(d.fecha)}</td>
                      <td className="px-2 py-1 text-right font-mono whitespace-nowrap tabular-nums">{monto(d.precioUnit, moneda)}</td>
                      <td className="px-2 py-1">{d.ganador ?? '—'}</td>
                      <td className="px-2 py-1 text-right font-mono tabular-nums">{d.cantidad !== null ? cantidad(d.cantidad) : '—'}</td>
                      <td className="px-2 py-1">{d.organismo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </figcaption>
    </figure>
  );
}
