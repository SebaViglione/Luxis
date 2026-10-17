import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormularioNuevaContrasena } from './formulario-nueva-contrasena';

export const metadata: Metadata = { title: 'Nueva contraseña · Luxis' };

export default function PaginaNuevaContrasena() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Elegí una contraseña nueva</CardTitle>
        <CardDescription>Después de guardarla seguís directo a tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioNuevaContrasena />
      </CardContent>
    </Card>
  );
}
