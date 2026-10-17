import { Suspense } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { ItemNotificacion } from '@/components/notificaciones/item-notificacion';
import { TIPO_NOTIFICACION } from '@/components/notificaciones/tipos';
import { MarcarTodas } from '@/components/notificaciones/marcar-todas';
import { Cargando } from '@/components/ui/cargando';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { Notificacion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { requerirSesion } from '@/server/auth/sesion';
import { contarNoLeidas, listarNotificaciones, TIPOS_NOTIFICACION } from '@/server/notificaciones/consultas';

async function Lista({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tipo = TIPOS_NOTIFICACION.find((t) => t === sp.tipo);
  const sesion = await requerirSesion();
  const [notificaciones, noLeidas] = await Promise.all([
    listarNotificaciones(sesion.empresaId, { tipo, limite: 200 }),
    contarNoLeidas(sesion.empresaId),
  ]);
  const filtros: { valor?: Notificacion['tipo']; etiqueta: string }[] = [
    { etiqueta: 'Todas' },
    ...TIPOS_NOTIFICACION.filter((t) => t !== 'sistema').map((t) => ({ valor: t, etiqueta: TIPO_NOTIFICACION[t].etiqueta })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtrar por tipo" className="flex flex-wrap gap-1.5">
          {filtros.map((f) => {
            const activo = f.valor === tipo;
            return (
              <Link key={f.etiqueta} href={f.valor ? `/notificaciones?tipo=${f.valor}` : '/notificaciones'} aria-current={activo ? 'page' : undefined}
                className={cn('rounded-md border px-2.5 py-1 text-sm', activo ? 'border-primary/40 bg-card font-medium' : 'text-muted-foreground hover:bg-muted')}>
                {f.etiqueta}
              </Link>
            );
          })}
        </nav>
        <MarcarTodas deshabilitado={noLeidas === 0} />
      </div>
      {notificaciones.length ? (
        <ul className="divide-y rounded-md border bg-card">
          {notificaciones.map((n) => <li key={n.id}><ItemNotificacion n={n} /></li>)}
        </ul>
      ) : (
        <EstadoVacio icono={Bell} titulo={tipo ? 'No hay notificaciones de este tipo' : 'No tenés notificaciones'}
          descripcion="Te avisamos acá cuando aparezca una licitación nueva para vos, cuando una esté por cerrar, cuando haya una visita o cuando publiquen una aclaración. Tocá Actualizar arriba para buscar novedades." />
      )}
    </div>
  );
}

export default function NotificacionesPage({ searchParams }: PageProps<'/notificaciones'>) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Notificaciones</h1>
      <Suspense fallback={<Cargando texto="Cargando notificaciones…" />}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
