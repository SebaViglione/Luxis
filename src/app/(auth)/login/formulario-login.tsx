'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { BotonEnviar } from '@/components/onboarding/boton-enviar';
import { CampoFormulario } from '@/components/onboarding/campo-formulario';
import { ESTADO_INICIAL } from '@/server/auth/formularios';
import { RUTAS } from '@/server/auth/rutas';
import { ingresar } from '../actions';

export function FormularioLogin() {
  const [estado, accion] = useActionState(ingresar, ESTADO_INICIAL);
  const siguiente = useSearchParams().get('siguiente') ?? '';

  return (
    <form action={accion} noValidate>
      <FieldGroup>
        {estado.error && (
          <Alert variant="destructive">
            <AlertDescription>{estado.error}</AlertDescription>
          </Alert>
        )}
        <input type="hidden" name="siguiente" value={siguiente} />
        <CampoFormulario
          nombre="email"
          etiqueta="Email"
          type="email"
          autoComplete="email"
          placeholder="nombre@tubarraca.com.uy"
          defaultValue={estado.valores?.email}
          errores={estado.errores?.email}
          required
        />
        <CampoFormulario
          nombre="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          errores={estado.errores?.contrasena}
          required
        />
        <div className="flex flex-col gap-3">
          <BotonEnviar textoPendiente="Ingresando…">Ingresar</BotonEnviar>
          <Link
            href={RUTAS.recuperar}
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
