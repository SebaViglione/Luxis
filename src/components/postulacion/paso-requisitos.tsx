'use client';

import { CircleAlert, CircleCheck, Clock, FileText, Info } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { DatosPagina, DatosPostulacion, EstadoItemChecklist, ItemChecklist } from '@/server/postulacion/tipos';
import { guardarDatosPostulacionAccion } from '@/app/(app)/licitaciones/[id]/postular/actions';

const ESTADO: Record<EstadoItemChecklist, { icono: typeof Info; clase: string; etiqueta: string }> = {
  riesgo: { icono: CircleAlert, clase: 'text-error', etiqueta: 'Puede dejarte afuera' },
  pendiente: { icono: Clock, clase: 'text-alerta-fuerte', etiqueta: 'Pendiente' },
  luxis: { icono: FileText, clase: 'text-primary', etiqueta: 'Lo armamos acá' },
  listo: { icono: CircleCheck, clase: 'text-exito', etiqueta: 'Listo' },
  info: { icono: Info, clase: 'text-muted-foreground', etiqueta: 'Para tener en cuenta' },
};
const ORDEN: EstadoItemChecklist[] = ['riesgo', 'pendiente', 'luxis', 'listo', 'info'];

const NIVEL = {
  lista: { clase: 'border-exito/30 bg-exito-suave', icono: CircleCheck, color: 'text-exito' },
  'falta-poco': { clase: 'border-alerta/30 bg-alerta-suave', icono: Clock, color: 'text-alerta-fuerte' },
  dificil: { clase: 'border-error/30 bg-error-suave', icono: CircleAlert, color: 'text-error' },
} as const;

interface Props {
  datos: DatosPagina;
  datosEmpresa: DatosPostulacion;
  onDatosEmpresa: (d: DatosPostulacion) => void;
}

export function PasoRequisitos({ datos, datosEmpresa, onDatosEmpresa }: Props) {
  const { resumen, checklist } = datos;
  const nivel = NIVEL[resumen.nivel];
  const ordenados = [...checklist].sort((a, b) => ORDEN.indexOf(a.estado) - ORDEN.indexOf(b.estado));

  return (
    <div className="space-y-6">
      <div className={cn('flex items-start gap-3 rounded-md border p-4', nivel.clase)}>
        <nivel.icono aria-hidden className={cn('mt-0.5 size-5 shrink-0', nivel.color)} />
        <div>
          <p className="font-semibold">{resumen.titulo}</p>
          <p className="text-sm text-muted-foreground">{resumen.descripcion}</p>
        </div>
      </div>

      <section aria-labelledby="titulo-checklist" className="space-y-3">
        <h2 id="titulo-checklist" className="font-semibold">
          Qué hace falta para presentarte
        </h2>
        <ul className="divide-y rounded-md border bg-card">
          {ordenados.map((item) => (
            <FilaChecklist key={item.id} item={item} />
          ))}
        </ul>
      </section>

      <FormularioDatos datos={datos} datosEmpresa={datosEmpresa} onDatosEmpresa={onDatosEmpresa} />
    </div>
  );
}

function FilaChecklist({ item }: { item: ItemChecklist }) {
  const e = ESTADO[item.estado];
  return (
    <li className="flex gap-3 px-4 py-3">
      <e.icono aria-label={e.etiqueta} className={cn('mt-0.5 size-4 shrink-0', e.clase)} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
          {item.titulo}
          {item.obligatorio === false && <span className="text-xs font-normal text-muted-foreground">opcional</span>}
        </p>
        <p className="text-sm text-muted-foreground">{item.detalle}</p>
        {(item.plazo || item.seccion) && (
          <p className="flex flex-wrap gap-x-3 font-mono text-xs text-muted-foreground">
            {item.plazo && <span>{item.plazo}</span>}
            {item.seccion && <span>Pliego: {item.seccion}</span>}
          </p>
        )}
      </div>
      <span className={cn('hidden shrink-0 text-xs sm:block', e.clase)}>{e.etiqueta}</span>
    </li>
  );
}

const CAMPOS: { clave: keyof DatosPostulacion; etiqueta: string; placeholder?: string; mono?: boolean }[] = [
  { clave: 'domicilio', etiqueta: 'Domicilio (calle y número)', placeholder: 'Av. Artigas 1234' },
  { clave: 'ciudad', etiqueta: 'Localidad / ciudad', placeholder: 'Las Piedras' },
  { clave: 'codigoPostal', etiqueta: 'Código postal', mono: true },
  { clave: 'emailNotificaciones', etiqueta: 'Email para notificaciones' },
  { clave: 'representante', etiqueta: 'Representante (quien firma)', placeholder: 'Nombre y apellido' },
  { clave: 'ciRepresentante', etiqueta: 'C.I. del representante', placeholder: '1.234.567-8', mono: true },
  { clave: 'cargoRepresentante', etiqueta: 'Cargo', placeholder: 'Titular, socio, apoderado…' },
];

function FormularioDatos({ datos, datosEmpresa, onDatosEmpresa }: Props) {
  const [pendiente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<{ error?: string; errores?: Record<string, string[] | undefined>; mensaje?: string } | null>(null);
  const faltan = !datosEmpresa.domicilio || !datosEmpresa.representante || !datosEmpresa.ciRepresentante;

  const guardar = () =>
    iniciar(async () => {
      const r = await guardarDatosPostulacionAccion(datosEmpresa);
      if (r.ok) {
        onDatosEmpresa({ ...datosEmpresa, ...r.datos });
        setResultado({ mensaje: r.mensaje });
      } else {
        setResultado({ error: r.error, errores: r.errores });
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos para los formularios</CardTitle>
        <CardDescription>
          Los piden el formulario de identificación y la carta. Razón social, RUT y teléfono salen de tu perfil (
          <Link href="/cuenta" className="text-primary underline-offset-4 hover:underline">
            editarlos en Cuenta
          </Link>
          ): {datos.empresa.razonSocial || datos.empresa.nombre} · RUT <span className="font-mono">{datos.empresa.rut || 'sin cargar'}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {faltan && (
            <Alert>
              <AlertTitle>Completá domicilio, representante y cédula</AlertTitle>
              <AlertDescription>Sin estos datos los documentos salen con líneas en blanco para completar a mano.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            {CAMPOS.map((c) => {
              const errores = resultado?.errores?.[c.clave];
              return (
                <Field key={c.clave} data-invalid={errores?.length ? true : undefined}>
                  <FieldLabel htmlFor={`dato-${c.clave}`}>{c.etiqueta}</FieldLabel>
                  <Input
                    id={`dato-${c.clave}`}
                    value={datosEmpresa[c.clave] ?? ''}
                    placeholder={c.placeholder}
                    className={c.mono ? 'font-mono' : undefined}
                    aria-invalid={errores?.length ? true : undefined}
                    onChange={(e) => onDatosEmpresa({ ...datosEmpresa, [c.clave]: e.target.value })}
                  />
                  <FieldError errors={errores?.map((message) => ({ message }))} />
                </Field>
              );
            })}
          </div>
        </FieldGroup>
      </CardContent>
      <CardFooter className="mt-6 flex-wrap justify-end gap-3">
        {resultado?.error && <p className="text-sm text-error">{resultado.error}</p>}
        {resultado?.mensaje && (
          <p className="text-sm text-muted-foreground" role="status">
            {resultado.mensaje}
          </p>
        )}
        <Button onClick={guardar} disabled={pendiente}>
          {pendiente && <Spinner />}
          {pendiente ? 'Guardando…' : 'Guardar datos'}
        </Button>
      </CardFooter>
    </Card>
  );
}
