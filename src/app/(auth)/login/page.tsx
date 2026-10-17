import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RUTAS } from '@/server/auth/rutas';
import { FormularioLogin } from './formulario-login';

export const metadata: Metadata = { title: 'Ingresar · Luxis' };

export default function PaginaLogin() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresá a tu cuenta</CardTitle>
        <CardDescription>Mirá las licitaciones donde tu barraca puede vender.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-52 w-full" />}>
          <FormularioLogin />
        </Suspense>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        ¿No tenés cuenta?&nbsp;
        <Link href={RUTAS.registro} className="font-medium text-primary underline-offset-4 hover:underline">
          Creá una gratis
        </Link>
      </CardFooter>
    </Card>
  );
}
