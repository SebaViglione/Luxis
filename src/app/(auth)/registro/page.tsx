import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RUTAS } from '@/server/auth/rutas';
import { FormularioRegistro } from './formulario-registro';

export const metadata: Metadata = { title: 'Crear cuenta · Luxis' };

export default function PaginaRegistro() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Creá tu cuenta</CardTitle>
        <CardDescription>En 5 minutos armamos el perfil de tu empresa y te mostramos dónde podés vender.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioRegistro />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        ¿Ya tenés cuenta?&nbsp;
        <Link href={RUTAS.login} className="font-medium text-primary underline-offset-4 hover:underline">
          Ingresá
        </Link>
      </CardFooter>
    </Card>
  );
}
