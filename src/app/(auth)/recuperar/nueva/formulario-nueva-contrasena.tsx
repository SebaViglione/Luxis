'use client';

import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { BotonEnviar } from '@/components/onboarding/boton-enviar';
import { CampoFormulario } from '@/components/onboarding/campo-formulario';
import { ESTADO_INICIAL } from '@/server/auth/formularios';
import { establecerNuevaContrasena } from '../../actions';

export function FormularioNuevaContrasena() {
  const [estado, accion] = useActionState(establecerNuevaContrasena, ESTADO_INICIAL);

  return (
    <form action={accion} noValidate>
      <FieldGroup>
        {estado.error && (
          <Alert variant="destructive">
            <AlertDescription>{estado.error}</AlertDescription>
          </Alert>
        )}
        <CampoFormulario
          nombre="contrasena"
          etiqueta="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          descripcion="Mínimo 8 caracteres."
          errores={estado.errores?.contrasena}
          required
        />
        <CampoFormulario
          nombre="confirmacion"
          etiqueta="Repetila"
          type="password"
          autoComplete="new-password"
          errores={estado.errores?.confirmacion}
          required
        />
        <BotonEnviar textoPendiente="Guardando…">Guardar contraseña</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
