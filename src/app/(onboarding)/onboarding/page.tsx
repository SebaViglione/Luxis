import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AsistenteOnboarding } from '@/components/onboarding/asistente-onboarding';
import { RUTAS } from '@/server/auth/rutas';
import { requerirSesion } from '@/server/auth/sesion';
import { leerPerfil } from '@/server/onboarding/guardar-perfil';

export const metadata: Metadata = { title: 'Armemos tu perfil · Luxis' };

export default function PaginaOnboarding() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Armemos el perfil de tu empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Con tus documentos o una charla corta, la IA entiende qué vendés y dónde entregás para encontrarte licitaciones.
        </p>
      </div>
      <Suspense fallback={<CargandoOnboarding />}>
        <ContenidoOnboarding />
      </Suspense>
    </div>
  );
}

async function ContenidoOnboarding() {
  const sesion = await requerirSesion({ permitirOnboardingIncompleto: true });
  if (sesion.estadoOnboarding === 'completo') redirect(RUTAS.dashboard);
  const perfil = await leerPerfil(sesion.empresaId);
  return <AsistenteOnboarding perfilInicial={perfil} />;
}

function CargandoOnboarding() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando tu perfil">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
