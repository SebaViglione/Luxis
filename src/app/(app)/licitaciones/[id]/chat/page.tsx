// Página TEMPORAL (R2) para probar el chat mientras no exista el detalle con tabs de maxi (M1).
// Cuando M1 monte <ChatPliego idCompra={id} /> en el tab "Chat", esta página se puede borrar.
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChatPliego } from '@/components/chat/chat-pliego';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/db';
import { licitaciones } from '@/db/schema';
import { requerirSesion } from '@/server/auth/sesion';

export const metadata: Metadata = { title: 'Chat con el pliego · Luxis' };

export default function PaginaChatPliego({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <Contenido params={params} />
      </Suspense>
    </div>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  await requerirSesion();
  const { id } = await params;
  const idCompra = decodeURIComponent(id);
  const [licitacion] = await db
    .select({ objeto: licitaciones.objeto, organismo: licitaciones.organismo })
    .from(licitaciones)
    .where(eq(licitaciones.idCompra, idCompra))
    .limit(1);
  if (!licitacion) notFound();

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{licitacion.objeto ?? `Licitación ${idCompra}`}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {licitacion.organismo ?? 'Organismo no informado'} · <span className="font-mono">{idCompra}</span>
        </p>
      </div>
      <ChatPliego idCompra={idCompra} />
    </>
  );
}
