'use client';

import { Download, ListX, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { cantidad as formatoCantidad, suavizarMayusculas } from '@/components/licitaciones/formato';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Moneda, PrecioHistorico } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MONEDAS } from '@/server/onboarding/constantes';
import { importe, totalesCotizacion } from '@/server/postulacion/documentos';
import type { Cotizacion, DatosPagina, LineaCotizacion } from '@/server/postulacion/tipos';
import { lineasIniciales } from './cotizacion';
import { descargarPlanillaSice } from './exportar';

interface Props {
  datos: DatosPagina;
  cotizacion: Cotizacion;
  onCotizacion: (c: Cotizacion) => void;
}

export function PasoCotizacion({ datos, cotizacion, onCotizacion }: Props) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const precios = new Map(datos.precios.map((p) => [p.nroItem, p]));
  const { incluidas, porMoneda } = totalesCotizacion(cotizacion.lineas);
  const sinPrecio = cotizacion.lineas.filter((l) => l.incluir && l.precioUnitario == null).length;

  const cambiar = (nroItem: number, cambios: Partial<LineaCotizacion>) =>
    onCotizacion({ ...cotizacion, lineas: cotizacion.lineas.map((l) => (l.nroItem === nroItem ? { ...l, ...cambios } : l)) });

  const descargar = async () => {
    setDescargando(true);
    setError(null);
    try {
      await descargarPlanillaSice(datos, cotizacion);
    } catch (e) {
      console.error(e);
      setError('No pudimos generar la planilla. Probá de nuevo.');
    } finally {
      setDescargando(false);
    }
  };

  if (cotizacion.lineas.length === 0) {
    return (
      <EstadoVacio
        icono={ListX}
        titulo="Esta compra no publicó ítems en ARCE"
        descripcion="Cotizá según lo que pide el pliego (lo podés preguntar en el chat del detalle) y adjuntá tu propuesta. La carta y el formulario de identificación igual te sirven."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Tu cotización</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Marcamos los ítems que vendés y prellenamos el precio con el sugerido por el histórico de adjudicaciones o con tu precio de lista.
            Marcá otro ítem para cotizarlo. Los precios van <strong className="font-medium text-foreground">sin impuestos</strong>, como los pide SICE.
            El borrador se guarda en este navegador.
          </p>
        </div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Cotizás <span className="font-medium text-foreground">{incluidas.length}</span> de {cotizacion.lineas.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border bg-card">
        <Table className="min-w-[58rem] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Ítem</TableHead>
              <TableHead>Qué piden</TableHead>
              <TableHead className="w-36 text-right">Cantidad</TableHead>
              <TableHead className="w-64">Precio unitario sin imp.</TableHead>
              <TableHead className="w-24">IVA</TableHead>
              <TableHead className="w-32 text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cotizacion.lineas.map((l) => (
              <FilaCotizacion key={l.nroItem} linea={l} precio={precios.get(l.nroItem)} cambiar={(c) => cambiar(l.nroItem, c)} />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Field>
            <FieldLabel htmlFor="plazo-entrega">Plazo de entrega</FieldLabel>
            <Input
              id="plazo-entrega"
              placeholder="Ej.: 5 días hábiles desde la orden de compra"
              value={cotizacion.plazoEntrega}
              onChange={(e) => onCotizacion({ ...cotizacion, plazoEntrega: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="mantenimiento">Mantenimiento de la oferta</FieldLabel>
            <Input
              id="mantenimiento"
              placeholder="Ej.: 60 días desde la apertura"
              value={cotizacion.mantenimientoOferta}
              onChange={(e) => onCotizacion({ ...cotizacion, mantenimientoOferta: e.target.value })}
            />
            {datos.condiciones?.mantenimientoOferta && <FieldDescription>El pliego dice: {datos.condiciones.mantenimientoOferta}</FieldDescription>}
          </Field>
        </div>

        <aside className="self-start rounded-md border bg-card" aria-labelledby="titulo-totales">
          <p id="titulo-totales" className="border-b px-4 py-2.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Total de la oferta · {incluidas.length} de {cotizacion.lineas.length} ítems
          </p>
          <div className="space-y-4 px-4 py-3">
            {[...porMoneda].length === 0 && <p className="text-sm text-muted-foreground">Marcá al menos un ítem con precio para ver el total.</p>}
            {[...porMoneda].map(([moneda, t]) => (
              <dl key={moneda} className="space-y-1.5 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Subtotal sin impuestos</dt>
                  <dd className="font-mono tabular-nums">{importe(t.neto, moneda)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">IVA</dt>
                  <dd className="font-mono tabular-nums">{importe(t.iva, moneda)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t pt-2 font-medium">
                  <dt>Total con impuestos</dt>
                  <dd className="font-mono text-base tabular-nums">{importe(t.neto + t.iva, moneda)}</dd>
                </div>
              </dl>
            ))}
            {sinPrecio > 0 && (
              <p className="text-xs text-alerta-fuerte">
                {sinPrecio === 1 ? '1 ítem marcado no tiene precio.' : `${sinPrecio} ítems marcados no tienen precio.`}
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {error && <p className="mr-auto text-sm text-error">{error}</p>}
        <Button variant="ghost" onClick={() => onCotizacion({ ...cotizacion, lineas: lineasIniciales(datos) })}>
          <RotateCcw aria-hidden /> Volver a los precios sugeridos
        </Button>
        <Button onClick={descargar} disabled={descargando || incluidas.length === 0}>
          {descargando ? <Spinner /> : <Download aria-hidden />}
          Descargar planilla para SICE (.xlsx)
        </Button>
      </div>
    </div>
  );
}

/**
 * Una línea de la cotización. Sin marcar es una fila quieta (lo que pide ARCE y el precio sugerido);
 * al marcarla aparecen los campos para cotizar.
 */
function FilaCotizacion({ linea: l, precio: p, cambiar }: { linea: LineaCotizacion; precio: PrecioHistorico | undefined; cambiar: (c: Partial<LineaCotizacion>) => void }) {
  const subtotal = l.incluir && l.precioUnitario != null ? l.cantidad * l.precioUnitario : null;
  const unidad = l.unidad.toLowerCase();
  const idCheck = `cotizar-${l.nroItem}`;
  const sugerido = p?.precioSugerido != null ? importe(p.precioSugerido, p.moneda) : null;
  const habitual = p && p.p25 != null && p.p75 != null ? `${importe(p.p25, p.moneda)} – ${importe(p.p75, p.moneda)}` : null;

  return (
    <TableRow className={cn('align-top', !l.incluir && 'text-muted-foreground')}>
      <TableCell className="pt-3.5">
        <div className="flex items-center gap-2">
          <Checkbox id={idCheck} checked={l.incluir} onCheckedChange={(v) => cambiar({ incluir: v === true })} aria-label={`Cotizar ítem ${l.nroItem}`} />
          <label htmlFor={idCheck} className="font-mono text-xs text-muted-foreground tabular-nums">{l.nroItem}</label>
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        <p className={cn('pt-1 leading-snug', l.incluir && 'font-medium')}>{suavizarMayusculas(l.descripcion)}</p>
        {l.productoEmpresa && <p className="mt-0.5 text-xs text-muted-foreground">Tu producto: {l.productoEmpresa}</p>}
        {l.incluir && (
          <Input
            aria-label={`Características del ítem ${l.nroItem}`}
            placeholder="Marca, modelo o medida (opcional)"
            className="mt-2 h-7 max-w-xs text-xs md:text-xs"
            value={l.caracteristicas}
            onChange={(e) => cambiar({ caracteristicas: e.target.value })}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
        {l.incluir ? (
          <InputGroup className="ml-auto w-32">
            <InputGroupInput
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              aria-label={`Cantidad del ítem ${l.nroItem}`}
              className="text-right font-mono tabular-nums"
              value={l.cantidad}
              onChange={(e) => cambiar({ cantidad: Number(e.target.value) || 0 })}
            />
            <InputGroupAddon align="inline-end"><InputGroupText className="text-xs">{unidad}</InputGroupText></InputGroupAddon>
          </InputGroup>
        ) : (
          <p className="pt-1">
            <span className="font-mono tabular-nums">{formatoCantidad(l.cantidad)}</span>
            <span className="ml-1.5 text-xs">{unidad}</span>
          </p>
        )}
      </TableCell>
      <TableCell className="whitespace-normal">
        {l.incluir ? (
          <div className="space-y-1">
            <div className="flex gap-1.5">
              <NativeSelect
                aria-label={`Moneda del ítem ${l.nroItem}`}
                className="w-20 shrink-0"
                value={l.moneda}
                onChange={(e) => cambiar({ moneda: e.target.value as Moneda })}
              >
                {MONEDAS.map((m) => (
                  <NativeSelectOption key={m} value={m}>{m}</NativeSelectOption>
                ))}
              </NativeSelect>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                aria-label={`Precio unitario sin impuestos del ítem ${l.nroItem}`}
                className="font-mono tabular-nums"
                value={l.precioUnitario ?? ''}
                onChange={(e) => cambiar({ precioUnitario: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            {sugerido && (
              <p className="font-mono text-[11px] leading-snug text-muted-foreground tabular-nums" title={habitual ? 'La mitad de las ofertas que ganaron estuvo en ese rango' : undefined}>
                Sugerido {sugerido}{habitual && <> · habitual {habitual}</>}
              </p>
            )}
          </div>
        ) : (
          <p className="pt-1 font-mono text-xs tabular-nums">{sugerido ? <>Sugerido {sugerido}</> : '—'}</p>
        )}
      </TableCell>
      <TableCell>
        {l.incluir ? (
          <NativeSelect aria-label={`IVA del ítem ${l.nroItem}`} className="w-full" value={String(l.iva)} onChange={(e) => cambiar({ iva: Number(e.target.value) })}>
            <NativeSelectOption value="22">22 %</NativeSelectOption>
            <NativeSelectOption value="10">10 %</NativeSelectOption>
            <NativeSelectOption value="0">Exento</NativeSelectOption>
          </NativeSelect>
        ) : (
          <p className="pt-1">—</p>
        )}
      </TableCell>
      <TableCell className="pt-[calc(--spacing(2.5)+0.35rem)] text-right font-mono tabular-nums">
        {subtotal != null ? <span className="font-medium">{importe(subtotal, l.moneda)}</span> : '—'}
      </TableCell>
    </TableRow>
  );
}
