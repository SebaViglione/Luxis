'use client';

import { Info, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { DocumentoEmpresa, EstadoDoc, Moneda, PerfilEmpresa, ProductoEmpresa } from '@/lib/types';
import { DEPARTAMENTOS_UY, ESTADOS_DOC, MONEDAS, UNIDADES } from '@/server/onboarding/constantes';
import type { ResultadoAccion } from '@/server/onboarding/tipos';

interface ResumenPerfilProps {
  perfilInicial: PerfilEmpresa;
  /** onboarding: botón "Confirmar y buscar licitaciones". edicion: "Guardar cambios" (pantalla Cuenta). */
  modo: 'onboarding' | 'edicion';
  onGuardar: (perfil: PerfilEmpresa) => Promise<ResultadoAccion<unknown>>;
  onVolver?: () => void;
}

type Errores = Record<string, string[] | undefined>;

export function ResumenPerfil({ perfilInicial, modo, onGuardar, onVolver }: ResumenPerfilProps) {
  const [perfil, setPerfil] = useState(perfilInicial);
  const [organismos, setOrganismos] = useState((perfilInicial.organismosInteres ?? []).join(', '));
  const [pendiente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ error?: string; errores?: Errores; mensaje?: string } | null>(null);

  const actualizar = <K extends keyof PerfilEmpresa>(clave: K, valor: PerfilEmpresa[K]) =>
    setPerfil((p) => ({ ...p, [clave]: valor }));

  const actualizarProducto = (indice: number, cambios: Partial<ProductoEmpresa>) =>
    setPerfil((p) => ({ ...p, productos: p.productos.map((x, i) => (i === indice ? { ...x, ...cambios } : x)) }));

  const actualizarDocumento = (indice: number, cambios: Partial<DocumentoEmpresa>) =>
    setPerfil((p) => ({ ...p, documentacion: p.documentacion.map((x, i) => (i === indice ? { ...x, ...cambios } : x)) }));

  const alternarZona = (zona: string) =>
    setPerfil((p) => ({
      ...p,
      zonasEntrega: p.zonasEntrega.includes(zona) ? p.zonasEntrega.filter((z) => z !== zona) : [...p.zonasEntrega, zona],
    }));

  const guardar = () =>
    iniciar(async () => {
      setAviso(null);
      const final: PerfilEmpresa = {
        ...perfil,
        productos: perfil.productos.filter((p) => p.nombre.trim()),
        organismosInteres: organismos
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      };
      const resultado = await onGuardar(final);
      if (resultado.ok) setAviso({ mensaje: resultado.mensaje ?? 'Cambios guardados.' });
      else setAviso({ error: resultado.error, errores: resultado.errores });
    });

  const errores = aviso?.errores ?? {};
  const erroresDe = (campo: string) => errores[campo]?.map((message) => ({ message }));

  return (
    <div className="flex flex-col gap-6">
      {modo === 'onboarding' && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revisá el perfil de tu empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Esto es lo que entendió la IA. Corregí lo que haga falta: con estos datos buscamos las licitaciones para vos.
          </p>
        </div>
      )}

      {perfil.camposFaltantes.length > 0 && (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Todavía no sabemos</AlertTitle>
          <AlertDescription>
            {perfil.camposFaltantes.join(' · ')}. Podés completarlo acá o más tarde desde “Cuenta”.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <CampoTexto etiqueta="Nombre" valor={perfil.nombre} alCambiar={(v) => actualizar('nombre', v)} errores={erroresDe('nombre')} />
              <CampoTexto etiqueta="Razón social" valor={perfil.razonSocial} alCambiar={(v) => actualizar('razonSocial', v || undefined)} />
              <CampoTexto
                etiqueta="RUT"
                valor={perfil.rut}
                alCambiar={(v) => actualizar('rut', v.replace(/[\s.-]/g, '') || undefined)}
                errores={erroresDe('rut')}
                mono
              />
              <Field>
                <FieldLabel htmlFor="perfil-departamento">Departamento</FieldLabel>
                <NativeSelect
                  id="perfil-departamento"
                  className="w-full"
                  value={perfil.departamento ?? ''}
                  onChange={(e) => actualizar('departamento', e.target.value || undefined)}
                >
                  <NativeSelectOption value="">Sin especificar</NativeSelectOption>
                  {DEPARTAMENTOS_UY.map((d) => (
                    <NativeSelectOption key={d} value={d}>
                      {d}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <CampoTexto etiqueta="Localidad" valor={perfil.localidad} alCambiar={(v) => actualizar('localidad', v || undefined)} />
              <CampoTexto etiqueta="Web" valor={perfil.web} alCambiar={(v) => actualizar('web', v || undefined)} />
              <CampoTexto etiqueta="Teléfono" valor={perfil.telefono} alCambiar={(v) => actualizar('telefono', v || undefined)} />
              <CampoTexto
                etiqueta="Email de contacto"
                valor={perfil.emailContacto}
                alCambiar={(v) => actualizar('emailContacto', v || undefined)}
                errores={erroresDe('emailContacto')}
              />
            </div>
            <Field>
              <FieldLabel htmlFor="perfil-descripcion">Descripción</FieldLabel>
              <Textarea
                id="perfil-descripcion"
                value={perfil.descripcion}
                onChange={(e) => actualizar('descripcion', e.target.value)}
                rows={3}
              />
              <FieldDescription>Qué vendés, dónde y a quién. La usamos para explicar los matches.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Productos
            <Badge variant="secondary" className="font-mono tabular-nums">
              {perfil.productos.length}
            </Badge>
          </CardTitle>
          <CardDescription>Uno por línea comercial, con la unidad en que lo vendés. El precio es opcional y sin IVA.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {perfil.productos.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              Todavía no hay productos. Agregá al menos uno para que podamos buscarte licitaciones.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[44rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[38%]">Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="w-28">Unidad</TableHead>
                    <TableHead className="w-32">Precio ref.</TableHead>
                    <TableHead className="w-24">Moneda</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfil.productos.map((producto, i) => (
                    <FilaProducto
                      key={i}
                      producto={producto}
                      alCambiar={(cambios) => actualizarProducto(i, cambios)}
                      alQuitar={() => actualizar('productos', perfil.productos.filter((_, j) => j !== i))}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <FieldError errors={erroresDe('productos')} />
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              actualizar('productos', [
                ...perfil.productos,
                { nombre: '', categoria: '', unidad: 'unidad', precioReferencia: null, moneda: 'UYU', keywords: [], fuente: 'manual' },
              ])
            }
          >
            <Plus /> Agregar producto
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entregas</CardTitle>
          <CardDescription>Departamentos donde podés entregar. Tocá para marcar o desmarcar.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Zonas de entrega">
              {DEPARTAMENTOS_UY.map((d) => {
                const activo = perfil.zonasEntrega.includes(d);
                return (
                  <Button key={d} size="sm" variant={activo ? 'default' : 'outline'} aria-pressed={activo} onClick={() => alternarZona(d)}>
                    {d}
                  </Button>
                );
              })}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <CampoTexto
                etiqueta="Capacidad de entrega"
                valor={perfil.capacidadNotas}
                alCambiar={(v) => actualizar('capacidadNotas', v || undefined)}
                descripcion="Ej.: 4 camiones por semana, granel y bolsa."
              />
              <Field>
                <FieldLabel htmlFor="perfil-monto">Monto mínimo que te sirve (UYU)</FieldLabel>
                <Input
                  id="perfil-monto"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  className="font-mono tabular-nums"
                  value={perfil.montoMinimo ?? ''}
                  onChange={(e) => actualizar('montoMinimo', e.target.value === '' ? null : Number(e.target.value))}
                />
                <FieldError errors={erroresDe('montoMinimo')} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentación</CardTitle>
          <CardDescription>Con esto calculamos qué papeles te faltan en cada licitación y si llegás antes del cierre.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[36rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead className="w-40">Estado</TableHead>
                  <TableHead className="w-44">Vence</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfil.documentacion.map((doc, i) => (
                  <TableRow key={`${doc.tipo}-${i}`}>
                    <TableCell>
                      {doc.tipo === 'OTRO' ? (
                        <Input
                          aria-label="Nombre del documento"
                          value={doc.nombre}
                          onChange={(e) => actualizarDocumento(i, { nombre: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{doc.nombre}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <NativeSelect
                        aria-label={`Estado de ${doc.nombre}`}
                        className="w-full"
                        value={doc.estado}
                        onChange={(e) => actualizarDocumento(i, { estado: e.target.value as EstadoDoc })}
                      >
                        {ESTADOS_DOC.map((e) => (
                          <NativeSelectOption key={e.valor} value={e.valor}>
                            {e.etiqueta}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        aria-label={`Vencimiento de ${doc.nombre}`}
                        className="font-mono"
                        value={doc.vencimiento ?? ''}
                        onChange={(e) => actualizarDocumento(i, { vencimiento: e.target.value || null })}
                      />
                    </TableCell>
                    <TableCell>
                      {doc.tipo === 'OTRO' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Quitar ${doc.nombre}`}
                          onClick={() => actualizar('documentacion', perfil.documentacion.filter((_, j) => j !== i))}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <FieldError errors={erroresDe('documentacion')} />
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              actualizar('documentacion', [
                ...perfil.documentacion,
                { tipo: 'OTRO', nombre: 'Otro documento', estado: 'vigente', vencimiento: null },
              ])
            }
          >
            <Plus /> Agregar otro documento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licitaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="perfil-experiencia">Experiencia en licitaciones</FieldLabel>
              <Textarea
                id="perfil-experiencia"
                rows={2}
                value={perfil.experienciaLicitaciones ?? ''}
                onChange={(e) => actualizar('experienciaLicitaciones', e.target.value || undefined)}
                placeholder="Ej.: nos presentamos a 2 licitaciones en 2025 y ganamos una."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="perfil-organismos">Organismos que te interesan</FieldLabel>
              <Input
                id="perfil-organismos"
                value={organismos}
                onChange={(e) => setOrganismos(e.target.value)}
                placeholder="Intendencias, MTOP, ANEP…"
              />
              <FieldDescription>Separados por coma.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t bg-background px-4 py-4 sm:mx-0 sm:rounded-md sm:border">
        {aviso?.error && (
          <Alert variant="destructive">
            <AlertDescription>{aviso.error}</AlertDescription>
          </Alert>
        )}
        {aviso?.mensaje && <p className="text-sm text-muted-foreground" role="status">{aviso.mensaje}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {onVolver ? (
            <Button variant="ghost" onClick={onVolver} disabled={pendiente}>
              Volver a la entrevista
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={guardar} disabled={pendiente}>
            {pendiente && <Spinner />}
            {modo === 'onboarding'
              ? pendiente
                ? 'Guardando y buscando licitaciones…'
                : 'Confirmar y buscar licitaciones'
              : pendiente
                ? 'Guardando…'
                : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilaProducto({
  producto,
  alCambiar,
  alQuitar,
}: {
  producto: ProductoEmpresa;
  alCambiar: (cambios: Partial<ProductoEmpresa>) => void;
  alQuitar: () => void;
}) {
  const unidades: string[] = UNIDADES.includes(producto.unidad as (typeof UNIDADES)[number])
    ? [...UNIDADES]
    : [producto.unidad, ...UNIDADES];
  return (
    <TableRow>
      <TableCell>
        <Input
          aria-label="Producto"
          aria-invalid={!producto.nombre.trim() || undefined}
          value={producto.nombre}
          onChange={(e) => alCambiar({ nombre: e.target.value })}
          placeholder="Ej.: Cemento Portland bolsa 25 kg"
        />
      </TableCell>
      <TableCell>
        <Input aria-label="Categoría" value={producto.categoria} onChange={(e) => alCambiar({ categoria: e.target.value })} />
      </TableCell>
      <TableCell>
        <NativeSelect aria-label="Unidad" className="w-full" value={producto.unidad} onChange={(e) => alCambiar({ unidad: e.target.value })}>
          {unidades.map((u) => (
            <NativeSelectOption key={u} value={u}>
              {u}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </TableCell>
      <TableCell>
        <Input
          aria-label="Precio de referencia"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          className="font-mono tabular-nums"
          value={producto.precioReferencia ?? ''}
          onChange={(e) => alCambiar({ precioReferencia: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </TableCell>
      <TableCell>
        <NativeSelect
          aria-label="Moneda"
          className="w-full"
          value={producto.moneda}
          onChange={(e) => alCambiar({ moneda: e.target.value as Moneda })}
        >
          {MONEDAS.map((m) => (
            <NativeSelectOption key={m} value={m}>
              {m}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon-sm" aria-label={`Quitar ${producto.nombre || 'producto'}`} onClick={alQuitar}>
          <Trash2 />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CampoTexto({
  etiqueta,
  valor,
  alCambiar,
  errores,
  descripcion,
  mono,
}: {
  etiqueta: string;
  valor: string | undefined;
  alCambiar: (valor: string) => void;
  errores?: { message: string }[];
  descripcion?: string;
  mono?: boolean;
}) {
  const id = `perfil-${etiqueta.toLowerCase().replace(/\W+/g, '-')}`;
  const invalido = Boolean(errores?.length);
  return (
    <Field data-invalid={invalido || undefined}>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Input
        id={id}
        value={valor ?? ''}
        onChange={(e) => alCambiar(e.target.value)}
        aria-invalid={invalido || undefined}
        className={mono ? 'font-mono' : undefined}
      />
      {descripcion && <FieldDescription>{descripcion}</FieldDescription>}
      <FieldError errors={errores} />
    </Field>
  );
}
