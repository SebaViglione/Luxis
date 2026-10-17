'use client';

import { useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import type { PerfilEmpresa } from '@/lib/types';
import { guardarDatosEmpresa } from '@/app/(onboarding)/onboarding/actions';
import { CampoFormulario } from './campo-formulario';
import { DEPARTAMENTOS_UY } from '@/server/onboarding/constantes';

interface PasoEmpresaProps {
  perfil: PerfilEmpresa;
  onListo: (perfil: PerfilEmpresa) => void;
}

export function PasoEmpresa({ perfil, onListo }: PasoEmpresaProps) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string[] | undefined>>({});

  // onSubmit (y no action) para que React no resetee el formulario si hay errores de validación.
  const enviar = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);
    const valor = (campo: string) => String(formData.get(campo) ?? '').trim();
    iniciar(async () => {
      const resultado = await guardarDatosEmpresa({
        nombre: valor('nombre'),
        rut: valor('rut'),
        departamento: valor('departamento') || undefined,
        localidad: valor('localidad') || undefined,
        web: valor('web') || undefined,
        telefono: valor('telefono') || undefined,
      });
      if (resultado.ok) {
        onListo(resultado.datos);
      } else {
        setError(resultado.error);
        setErrores(resultado.errores ?? {});
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de tu empresa</CardTitle>
        <CardDescription>Lo básico para identificarte en las licitaciones. Después lo podés cambiar.</CardDescription>
      </CardHeader>
      <form onSubmit={enviar} noValidate>
        <CardContent>
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <CampoFormulario
              nombre="nombre"
              etiqueta="Nombre de la empresa"
              defaultValue={perfil.nombre}
              errores={errores.nombre}
              required
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <CampoFormulario
                nombre="rut"
                etiqueta="RUT (opcional)"
                inputMode="numeric"
                placeholder="12 dígitos"
                defaultValue={perfil.rut}
                errores={errores.rut}
                className="font-mono"
              />
              <CampoFormulario
                nombre="telefono"
                etiqueta="Teléfono (opcional)"
                type="tel"
                autoComplete="tel"
                defaultValue={perfil.telefono}
                errores={errores.telefono}
              />
              <Field>
                <FieldLabel htmlFor="departamento">Departamento</FieldLabel>
                <NativeSelect id="departamento" name="departamento" defaultValue={perfil.departamento ?? ''} className="w-full">
                  <NativeSelectOption value="">Elegí un departamento</NativeSelectOption>
                  {DEPARTAMENTOS_UY.map((d) => (
                    <NativeSelectOption key={d} value={d}>
                      {d}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={errores.departamento?.map((message) => ({ message }))} />
              </Field>
              <CampoFormulario
                nombre="localidad"
                etiqueta="Localidad (opcional)"
                defaultValue={perfil.localidad}
                errores={errores.localidad}
              />
            </div>
            <CampoFormulario
              nombre="web"
              etiqueta="Página web (opcional)"
              inputMode="url"
              placeholder="www.tubarraca.com.uy"
              defaultValue={perfil.web}
              errores={errores.web}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 justify-end">
          <Button type="submit" disabled={pendiente}>
            {pendiente && <Spinner />}
            {pendiente ? 'Guardando…' : 'Siguiente'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
