import { Suspense } from 'react';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { Logo } from '@/components/marca/logo';
import { obtenerSesion } from '@/server/auth/sesion';
import { contarNoLeidas, listarNotificaciones } from '@/server/notificaciones/consultas';
import { BotonActualizar } from './boton-actualizar';
import { Campanita } from './campanita';
import { MenuMovil } from './menu-movil';

async function DatosSesion() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  const [[empresa], noLeidas, ultimas] = await Promise.all([
    db.select({ nombre: schema.empresas.nombre }).from(schema.empresas).where(eq(schema.empresas.id, sesion.empresaId)),
    contarNoLeidas(sesion.empresaId),
    listarNotificaciones(sesion.empresaId, { limite: 5 }),
  ]);
  return (
    <>
      <div className="flex min-w-0 flex-1 justify-end md:justify-start">
        <span className="truncate text-sm font-medium">{empresa?.nombre ?? ''}</span>
      </div>
      <Campanita noLeidas={noLeidas} ultimas={ultimas} />
      <BotonActualizar />
    </>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4 md:px-8">
      <MenuMovil />
      <Logo href="/dashboard" className="md:hidden" />
      <Suspense fallback={<div className="flex flex-1 justify-end md:justify-start"><span aria-hidden className="h-4 w-36 rounded-sm bg-muted" /></div>}>
        <DatosSesion />
      </Suspense>
    </header>
  );
}
