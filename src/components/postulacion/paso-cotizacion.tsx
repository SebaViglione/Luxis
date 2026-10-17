'use client';

import { Download, ListX, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Moneda } from '@/lib/types';
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
      <div className="space-y-1">
        <h2 className="font-semibold">Tu cotización</h2>
        <p className="text-sm text-muted-foreground">
          Marcamos los ítems que vendés y prellenamos el precio con el sugerido por el histórico de adjudicaciones o con tu precio de lista.
          Los precios van <strong className="font-medium text-foreground">sin impuestos</strong>, como los pide SICE. El borrador se guarda en este
          navegador.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border bg-card">
        <Table className="min-w-[68rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <span className="sr-only">Cotizar</span>
              </TableHead>
              <TableHead className="w-12">Ítem</TableHead>
              <TableHead className="min-w-56">Descripción</TableHead>
              <TableHead className="w-28">Cantidad</TableHead>
              <TableHead className="w-40">Precio unit. sin imp.</TableHead>
              <TableHead className="w-28">Moneda</TableHead>
              <TableHead className="w-28">IVA</TableHead>
              <TableHead className="w-48">Características</TableHead>
              <TableHead className="w-36 text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cotizacion.lineas.map((l) => {
              const p = precios.get(l.nroItem);
              const subtotal = l.precioUnitario != null ? l.cantidad * l.precioUnitario : null;
              return (
                <TableRow key={l.nroItem} className={l.incluir ? undefined : 'text-muted-foreground'}>
                  <TableCell>
                    <Checkbox checked={l.incluir} onCheckedChange={(v) => cambiar(l.nroItem, { incluir: v === true })} aria-label={`Cotizar ítem ${l.nroItem}`} />
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{l.nroItem}</TableCell>
                  <TableCell className="max-w-80 min-w-56 whitespace-normal">
                    <span className="block">{l.descripcion}</span>
                    {l.productoEmpresa && <span className="block text-xs text-muted-foreground">Tu producto: {l.productoEmpresa}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        aria-label={`Cantidad del ítem ${l.nroItem}`}
                        className="font-mono tabular-nums"
                        value={l.cantidad}
                        disabled={!l.incluir}
                        onChange={(e) => cambiar(l.nroItem, { cantidad: Number(e.target.value) || 0 })}
                      />
                      <span className="text-xs text-muted-foreground">{l.unidad}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      aria-label={`Precio unitario sin impuestos del ítem ${l.nroItem}`}
                      className="font-mono tabular-nums"
                      value={l.precioUnitario ?? ''}
                      disabled={!l.incluir}
                      onChange={(e) => cambiar(l.nroItem, { precioUnitario: e.target.value === '' ? null : Number(e.target.value) })}
                    />
                    {p?.precioSugerido != null && (
                      <span className="mt-1 block font-mono text-xs text-muted-foreground">
                        Sugerido {importe(p.precioSugerido, p.moneda)}
                        {p.p25 != null && p.mediana != null && ` · ${importe(p.p25, p.moneda)}–${importe(p.mediana, p.moneda)}`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <NativeSelect
                      aria-label={`Moneda del ítem ${l.nroItem}`}
                      className="w-full min-w-24"
                      value={l.moneda}
                      disabled={!l.incluir}
                      onChange={(e) => cambiar(l.nroItem, { moneda: e.target.value as Moneda })}
                    >
                      {MONEDAS.map((m) => (
                        <NativeSelectOption key={m} value={m}>
                          {m}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </TableCell>
                  <TableCell>
                    <NativeSelect
                      aria-label={`IVA del ítem ${l.nroItem}`}
                      className="w-full min-w-24"
                      value={String(l.iva)}
                      disabled={!l.incluir}
                      onChange={(e) => cambiar(l.nroItem, { iva: Number(e.target.value) })}
                    >
                      <NativeSelectOption value="22">22 %</NativeSelectOption>
                      <NativeSelectOption value="10">10 %</NativeSelectOption>
                      <NativeSelectOption value="0">Exento</NativeSelectOption>
                    </NativeSelect>
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Características del ítem ${l.nroItem}`}
                      placeholder="Marca, modelo, medida"
                      value={l.caracteristicas}
                      disabled={!l.incluir}
                      onChange={(e) => cambiar(l.nroItem, { caracteristicas: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{l.incluir && subtotal != null ? importe(subtotal, l.moneda) : '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-5">
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
        <div className="space-y-3 rounded-md border bg-card p-4">
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            {incluidas.length} de {cotizacion.lineas.length} ítems
          </p>
          {[...porMoneda].length === 0 && <p className="text-sm text-muted-foreground">Cargá al menos un precio para ver el total.</p>}
          {[...porMoneda].map(([moneda, t]) => (
            <dl key={moneda} className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal sin impuestos</dt>
                <dd className="font-mono tabular-nums">{importe(t.neto, moneda)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">IVA</dt>
                <dd className="font-mono tabular-nums">{importe(t.iva, moneda)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Total con impuestos</dt>
                <dd className="font-mono tabular-nums">{importe(t.neto + t.iva, moneda)}</dd>
              </div>
            </dl>
          ))}
          {sinPrecio > 0 && (
            <p className="text-xs text-alerta-fuerte">
              {sinPrecio === 1 ? '1 ítem marcado no tiene precio.' : `${sinPrecio} ítems marcados no tienen precio.`}
            </p>
          )}
        </div>
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
