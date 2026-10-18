'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Moneda } from '@/lib/types';
import type { PuntoPrecio } from '@/server/precios/historial';
import { cn } from '@/lib/utils';
import { cantidad, fecha, monto, montoCorto, nombrePropio } from './formato';

const ALTO = 190;
const M = { arriba: 16, derecha: 16, abajo: 28, izquierda: 80 };
const DIA = 864e5;
const RADIO_ACIERTO = 28;
const fmtMes = new Intl.DateTimeFormat('es-UY', { month: 'short', year: '2-digit', timeZone: 'America/Montevideo' });
const fmtDia = new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: '2-digit', timeZone: 'America/Montevideo' });

function pasoLindo(rango: number, divisiones: number) {
  const bruto = rango / divisiones;
  const magnitud = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / magnitud;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * magnitud;
}

function escalaY(valores: number[]) {
  const min = Math.min(...valores), max = Math.max(...valores);
  const margen = (max - min || max || 1) * 0.08;
  const paso = pasoLindo(max + margen - Math.max(0, min - margen), 3);
  const y0 = Math.max(0, Math.floor((min - margen) / paso) * paso);
  const y1 = Math.ceil((max + margen) / paso) * paso;
  const ticks: number[] = [];
  for (let v = y0; v <= y1 + paso / 2; v += paso) ticks.push(v);
  return { y0, y1, ticks };
}

export function GraficoPrecios({ puntos, n, precioSugerido, moneda, unidad, descripcion }: {
  puntos: PuntoPrecio[];
  n: number;
  precioSugerido: number | null;
  moneda: Moneda;
  unidad: string;
  descripcion: string;
}) {
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

  const datos = useMemo(() => puntos.map((p) => ({ ...p, t: Date.parse(p.fecha) })).sort((a, b) => a.t - b.t), [puntos]);
  if (!datos.length) return null;

  const t0 = datos[0].t === datos.at(-1)!.t ? datos[0].t - 15 * DIA : datos[0].t;
  const t1 = datos[0].t === datos.at(-1)!.t ? datos[0].t + 15 * DIA : datos.at(-1)!.t;
  const { y0, y1, ticks: ticksY } = escalaY([...datos.map((d) => d.precioUnit), ...(precioSugerido !== null ? [precioSugerido] : [])]);
  const anchoPlot = Math.max(ancho - M.izquierda - M.derecha, 1);
  const altoPlot = ALTO - M.arriba - M.abajo;
  const x = (t: number) => M.izquierda + ((t - t0) / (t1 - t0)) * anchoPlot;
  const y = (v: number) => M.arriba + (1 - (v - y0) / (y1 - y0 || 1)) * altoPlot;
  const formatoX = t1 - t0 > 120 * DIA ? fmtMes : fmtDia;
  const ticksX = [0, 1, 2, 3].map((i) => t0 + (i * (t1 - t0)) / 3);
  const trazo = datos.map((d, i) => `${i ? 'L' : 'M'}${x(d.t).toFixed(1)},${y(d.precioUnit).toFixed(1)}`).join(' ');

  const precios = datos.map((d) => d.precioUnit);
  const resumen = `Precios ganadores de ${descripcion}: ${datos.length} adjudicaciones entre ${fecha(datos[0].fecha)} y ${fecha(datos.at(-1)!.fecha)}, `
    + `de ${monto(Math.min(...precios), moneda)} a ${monto(Math.max(...precios), moneda)} por ${unidad}.`
    + (precioSugerido !== null ? ` Precio sugerido ${monto(precioSugerido, moneda)}.` : '');

  const alMover = (e: React.PointerEvent<SVGSVGElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - caja.left, py = e.clientY - caja.top;
    let mejor: number | null = null, distancia = RADIO_ACIERTO;
    datos.forEach((d, i) => {
      const dist = Math.hypot(x(d.t) - px, y(d.precioUnit) - py);
      if (dist < distancia) { distancia = dist; mejor = i; }
    });
    setActivo(mejor);
  };

  const punto = activo !== null ? datos[activo] : null;
  const aLaIzquierda = punto ? x(punto.t) > ancho / 2 : false;

  return (
    <figure className="space-y-2">
      <div ref={contenedor} className="relative w-full" style={{ height: ALTO }}>
        {ancho > 0 && (
          <svg width={ancho} height={ALTO} role="img" aria-label={resumen} className="block touch-none select-none"
            onPointerMove={alMover} onPointerLeave={() => setActivo(null)}>
            {ticksY.map((v) => (
              <g key={v}>
                <line x1={M.izquierda} x2={ancho - M.derecha} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
                <text x={M.izquierda - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">{montoCorto(v, moneda)}</text>
              </g>
            ))}
            {ticksX.map((t, i) => (
              <text key={i} x={x(t)} y={ALTO - 8} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'} className="fill-muted-foreground font-mono text-[11px]">
                {formatoX.format(new Date(t))}
              </text>
            ))}
            {precioSugerido !== null && (
              <line x1={M.izquierda} x2={ancho - M.derecha} y1={y(precioSugerido)} y2={y(precioSugerido)} className="stroke-foreground" strokeWidth={1} strokeDasharray="4 4" />
            )}
            <path d={trazo} fill="none" className="stroke-primary" strokeOpacity={0.45} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {punto && <line x1={x(punto.t)} x2={x(punto.t)} y1={M.arriba} y2={ALTO - M.abajo} className="stroke-foreground/30" strokeWidth={1} />}
            {datos.map((d, i) => (
              <circle key={`${d.idCompra}-${i}`} cx={x(d.t)} cy={y(d.precioUnit)} r={activo === i ? 6 : 4} className="fill-primary stroke-card" strokeWidth={2} />
            ))}
            {/* El rótulo va último para que quede legible por encima de los puntos (halo del color de la tarjeta). */}
            {precioSugerido !== null && (
              <text x={ancho - M.derecha} y={y(precioSugerido) - 7} textAnchor="end" className="fill-foreground stroke-card font-mono text-[11px] font-medium" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke">
                Sugerido {monto(precioSugerido, moneda)}
              </text>
            )}
          </svg>
        )}
        {punto && (
          <div aria-hidden className={cn('pointer-events-none absolute z-10 w-56 rounded-md border bg-popover p-2.5 text-xs shadow-md', aLaIzquierda ? '-translate-x-full' : '')}
            style={{ left: x(punto.t) + (aLaIzquierda ? -12 : 12), top: Math.min(Math.max(y(punto.precioUnit) - 40, 0), ALTO - 110) }}>
            <p className="font-mono text-muted-foreground">{fecha(punto.fecha)}</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{monto(punto.precioUnit, moneda)} <span className="font-sans text-xs font-normal text-muted-foreground">por {unidad}</span></p>
            <p className="mt-1 text-foreground">{punto.ganador ? nombrePropio(punto.ganador) : 'Ganador sin nombre'}</p>
            {punto.cantidad !== null && <p className="text-muted-foreground">Cantidad: <span className="font-mono">{cantidad(punto.cantidad)}</span> {punto.unidad?.toLowerCase() ?? ''}</p>}
            {punto.organismo && <p className="text-muted-foreground">{punto.organismo}</p>}
          </div>
        )}
      </div>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span>Cada punto es una adjudicación ganada{datos.length < n ? ` (últimas ${datos.length} de ${n})` : ''}.</span>
        <details className="group">
          <summary className="cursor-pointer text-foreground underline-offset-4 hover:underline">Ver como tabla</summary>
          <div className="mt-2 max-h-64 overflow-auto rounded-md border bg-card">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">{resumen}</caption>
              <thead className="sticky top-0 bg-muted/90 font-mono text-[11px] tracking-wide text-muted-foreground uppercase backdrop-blur-sm">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Fecha</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Precio</th>
                  <th scope="col" className="px-3 py-2 font-medium">Ganador</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Cantidad</th>
                  <th scope="col" className="px-3 py-2 font-medium">Organismo</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {[...datos].reverse().map((d, i) => (
                  <tr key={`${d.idCompra}-${i}`} className="border-t">
                    <td className="px-3 py-1.5 font-mono whitespace-nowrap text-muted-foreground">{fecha(d.fecha)}</td>
                    <td className="px-3 py-1.5 text-right font-mono whitespace-nowrap tabular-nums">{monto(d.precioUnit, moneda)}</td>
                    <td className="max-w-56 truncate px-3 py-1.5">{d.ganador ? nombrePropio(d.ganador) : '—'}</td>
                    <td className="px-3 py-1.5 text-right font-mono whitespace-nowrap tabular-nums">{d.cantidad !== null ? cantidad(d.cantidad) : '—'}{d.unidad ? <span className="ml-1 text-muted-foreground">{d.unidad.toLowerCase()}</span> : null}</td>
                    <td className="max-w-64 truncate px-3 py-1.5 text-muted-foreground">{d.organismo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </figcaption>
    </figure>
  );
}
