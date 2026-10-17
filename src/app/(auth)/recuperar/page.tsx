import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RUTAS } from '@/server/auth/rutas';
import { FormularioRecuperar } from './formulario-recuperar';

export const metadata: Metadata = { title: 'Recuperar contraseña · Luxis' };

export default function PaginaRecuperar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperá tu contraseña</CardTitle>
        <CardDescription>Te mandamos un link por email para crear una nueva.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <FormularioRecuperar />
        </Suspense>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <Link href={RUTAS.login} className="font-medium text-primary underline-offset-4 hover:underline">
          Volver a ingresar
        </Link>
      </CardFooter>
    </Card>
  );
}
