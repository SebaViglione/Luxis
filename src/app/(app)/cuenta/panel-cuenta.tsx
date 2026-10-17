'use client';

import { LogOut } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampoFormulario } from '@/components/onboarding/campo-formulario';
import { ResumenPerfil } from '@/components/onboarding/resumen-perfil';
import type { PerfilEmpresa } from '@/lib/types';
import type { ResultadoAccion } from '@/server/onboarding/tipos';
import { cerrarSesion } from '@/app/(auth)/actions';
import { actualizarUsuario, cambiarContrasena, eliminarCuenta, guardarPerfilEmpresa } from './actions';

interface PanelCuentaProps {
  nombre: string;
  email: string;
  perfil: PerfilEmpresa;
}

export function PanelCuenta({ nombre, email, perfil }: PanelCuentaProps) {
  return (
    <Tabs defaultValue="usuario">
      <TabsList>
        <TabsTrigger value="usuario">Usuario</TabsTrigger>
        <TabsTrigger value="empresa">Empresa</TabsTrigger>
      </TabsList>
      <TabsContent value="usuario" className="mt-4 flex flex-col gap-6">
        <DatosUsuario nombre={nombre} email={email} />
        <CambiarContrasena />
        <Sesion />
      </TabsContent>
      <TabsContent value="empresa" className="mt-4">
        <ResumenPerfil perfilInicial={perfil} modo="edicion" onGuardar={guardarPerfilEmpresa} />
      </TabsContent>
    </Tabs>
  );
}

/** Estado común de los formularios de esta pantalla (sin reset del form si hay error). */
function useFormulario<T>(accion: (datos: T) => Promise<ResultadoAccion>) {
  const [pendiente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<ResultadoAccion | null>(null);
  const enviar = (datos: T, alTerminarBien?: () => void) =>
    iniciar(async () => {
      const r = await accion(datos);
      setResultado(r);
      if (r.ok) alTerminarBien?.();
    });
  const errores = resultado && !resultado.ok ? (resultado.errores ?? {}) : {};
  return { pendiente, resultado, enviar, errores };
}

function Mensaje({ resultado }: { resultado: ResultadoAccion | null }) {
  if (!resultado) return null;
  if (!resultado.ok) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{resultado.error}</AlertDescription>
      </Alert>
    );
  }
  return (
    <p className="text-sm text-muted-foreground" role="status">
      {resultado.mensaje}
    </p>
  );
}

function DatosUsuario({ nombre, email }: { nombre: string; email: string }) {
  const { pendiente, resultado, enviar, errores } = useFormulario(actualizarUsuario);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus datos</CardTitle>
      </CardHeader>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          enviar({ nombre: String(f.get('nombre') ?? ''), email: String(f.get('email') ?? '') });
        }}
      >
        <CardContent>
          <FieldGroup>
            <Mensaje resultado={resultado} />
            <div className="grid gap-5 sm:grid-cols-2">
              <CampoFormulario nombre="nombre" etiqueta="Nombre" autoComplete="name" defaultValue={nombre} errores={errores.nombre} />
              <CampoFormulario nombre="email" etiqueta="Email" type="email" autoComplete="email" defaultValue={email} errores={errores.email} />
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 justify-end">
          <Button type="submit" disabled={pendiente}>
            {pendiente && <Spinner />}
            {pendiente ? 'Guardando…' : 'Guardar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function CambiarContrasena() {
  const { pendiente, resultado, enviar, errores } = useFormulario(cambiarContrasena);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contraseña</CardTitle>
      </CardHeader>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          enviar(
            { actual: String(f.get('actual') ?? ''), nueva: String(f.get('nueva') ?? ''), confirmacion: String(f.get('confirmacion') ?? '') },
            () => form.reset(),
          );
        }}
      >
        <CardContent>
          <FieldGroup>
            <Mensaje resultado={resultado} />
            <CampoFormulario nombre="actual" etiqueta="Contraseña actual" type="password" autoComplete="current-password" errores={errores.actual} />
            <div className="grid gap-5 sm:grid-cols-2">
              <CampoFormulario
                nombre="nueva"
                etiqueta="Contraseña nueva"
                type="password"
                autoComplete="new-password"
                descripcion="Mínimo 8 caracteres."
                errores={errores.nueva}
              />
              <CampoFormulario nombre="confirmacion" etiqueta="Repetila" type="password" autoComplete="new-password" errores={errores.confirmacion} />
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 justify-end">
          <Button type="submit" disabled={pendiente}>
            {pendiente && <Spinner />}
            {pendiente ? 'Cambiando…' : 'Cambiar contraseña'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function Sesion() {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesión</CardTitle>
        <CardDescription>
          Eliminar la cuenta te impide volver a ingresar con este email. Los datos de la empresa se conservan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <form action={cerrarSesion}>
            <Button type="submit" variant="outline">
              <LogOut /> Cerrar sesión
            </Button>
          </form>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" disabled={pendiente} />}>
              {pendiente && <Spinner />}
              Eliminar cuenta
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  No vas a poder volver a ingresar con este email. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    iniciar(async () => {
                      const r = await eliminarCuenta();
                      if (!r.ok) setError(r.error);
                    })
                  }
                >
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
