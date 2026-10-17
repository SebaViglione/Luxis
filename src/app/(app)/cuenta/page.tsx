import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { buscarCuenta } from '@/server/auth/cuenta';
import { requerirSesion } from '@/server/auth/sesion';
import { leerPerfil } from '@/server/onboarding/guardar-perfil';
import { PanelCuenta } from './panel-cuenta';

export const metadata: Metadata = { title: 'Cuenta · Luxis' };

export default function PaginaCuenta() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Cuenta</h1>
        <p className="mt-1 text-muted-foreground">Tus datos de acceso y lo que Luxis sabe de tu empresa: productos, zonas y papeles.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ContenidoCuenta />
      </Suspense>
    </div>
  );
}

async function ContenidoCuenta() {
  const sesion = await requerirSesion();
  const [cuenta, perfil] = await Promise.all([buscarCuenta(sesion.usuarioId), leerPerfil(sesion.empresaId)]);
  return <PanelCuenta nombre={cuenta?.nombre ?? ''} email={sesion.email} perfil={perfil} />;
}
