'use client';

import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { BotonEnviar } from '@/components/onboarding/boton-enviar';
import { CampoFormulario } from '@/components/onboarding/campo-formulario';
import { ESTADO_INICIAL } from '@/server/auth/formularios';
import { recuperarContrasena } from '../actions';

export function FormularioRecuperar() {
  const [estado, accion] = useActionState(recuperarContrasena, ESTADO_INICIAL);
  const linkInvalido = useSearchParams().get('error') === 'link_invalido';

  if (estado.exito) {
    return (
      <Alert>
        <AlertDescription>{estado.exito}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={accion} noValidate>
      <FieldGroup>
        {(estado.error || linkInvalido) && (
          <Alert variant="destructive">
            <AlertDescription>
              {estado.error ?? 'El link venció o ya se usó. Pedí uno nuevo con tu email.'}
            </AlertDescription>
          </Alert>
        )}
        <CampoFormulario
          nombre="email"
          etiqueta="Email"
          type="email"
          autoComplete="email"
          defaultValue={estado.valores?.email}
          errores={estado.errores?.email}
          required
        />
        <BotonEnviar textoPendiente="Enviando link…">Enviar link</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
