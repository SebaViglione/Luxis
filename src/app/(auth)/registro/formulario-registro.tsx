'use client';

import { useActionState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { BotonEnviar } from '@/components/onboarding/boton-enviar';
import { CampoFormulario } from '@/components/onboarding/campo-formulario';
import { ESTADO_INICIAL } from '@/server/auth/formularios';
import { registrarse } from '../actions';

export function FormularioRegistro() {
  const [estado, accion] = useActionState(registrarse, ESTADO_INICIAL);

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
        {estado.error && (
          <Alert variant="destructive">
            <AlertDescription>{estado.error}</AlertDescription>
          </Alert>
        )}
        <CampoFormulario
          nombre="nombre"
          etiqueta="Tu nombre"
          autoComplete="name"
          defaultValue={estado.valores?.nombre}
          errores={estado.errores?.nombre}
          required
        />
        <CampoFormulario
          nombre="empresa"
          etiqueta="Nombre de la empresa"
          autoComplete="organization"
          placeholder="Barraca …"
          defaultValue={estado.valores?.empresa}
          errores={estado.errores?.empresa}
          required
        />
        <CampoFormulario
          nombre="email"
          etiqueta="Email"
          type="email"
          autoComplete="email"
          defaultValue={estado.valores?.email}
          errores={estado.errores?.email}
          required
        />
        <CampoFormulario
          nombre="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          descripcion="Mínimo 8 caracteres."
          errores={estado.errores?.contrasena}
          required
        />
        <BotonEnviar textoPendiente="Creando tu cuenta…">Crear cuenta</BotonEnviar>
      </FieldGroup>
    </form>
  );
}
