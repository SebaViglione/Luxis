import { Suspense } from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Bell } from 'lucide-react';
import { ItemNotificacion } from '@/components/notificaciones/item-notificacion';
import { TIPO_NOTIFICACION } from '@/components/notificaciones/tipos';
import { MarcarTodas } from '@/components/notificaciones/marcar-todas';
import { Cargando } from '@/components/ui/cargando';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { Notificacion } from '@/lib/types';
import { FiltroTipo } from '@/components/notificaciones/filtro-tipo';
import { requerirSesion } from '@/server/auth/sesion';
import { contarNoLeidas, listarNotificaciones, TIPOS_NOTIFICACION } from '@/server/notificaciones/consultas';

export const metadata: Metadata = { title: 'Notificaciones · Luxis' };

async function Lista({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tipo = TIPOS_NOTIFICACION.find((t) => t === sp.tipo);
  await connection();
  const sesion = await requerirSesion();
  const [notificaciones, noLeidas] = await Promise.all([
    listarNotificaciones(sesion.empresaId, { tipo, limite: 200 }),
    contarNoLeidas(sesion.empresaId),
  ]);
  const filtros: { valor?: Notificacion['tipo']; etiqueta: string }[] = [
    { etiqueta: 'Todas' },
    ...TIPOS_NOTIFICACION.filter((t) => t !== 'sistema').map((t) => ({ valor: t, etiqueta: TIPO_NOTIFICACION[t].filtro })),
  ];

  // Agrupadas por día: Hoy, Ayer y fecha.
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo' });
  const hoy = fmt.format(new Date());
  // eslint-disable-next-line react-hooks/purity -- Server Component dinámico: se renderiza una vez por request.
  const ayer = fmt.format(new Date(Date.now() - 864e5));
  const grupos = new Map<string, Notificacion[]>();
  for (const n of notificaciones) {
    const d = fmt.format(new Date(n.createdAt));
    const clave = d === hoy ? 'Hoy' : d === ayer ? 'Ayer' : new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Montevideo' }).format(new Date(n.createdAt));
    grupos.set(clave, [...(grupos.get(clave) ?? []), n]);
  }

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground">
        {noLeidas === 0 ? 'Estás al día: no tenés avisos sin leer.' : `Tenés ${noLeidas} ${noLeidas === 1 ? 'aviso sin leer' : 'avisos sin leer'}.`}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltroTipo activo={tipo} filtros={filtros.map((f) => ({ ...f, href: f.valor ? `/notificaciones?tipo=${f.valor}` : '/notificaciones' }))} />
        <MarcarTodas deshabilitado={noLeidas === 0} />
      </div>
      {notificaciones.length ? (
        <div className="space-y-5">
          {[...grupos].map(([dia, lista]) => (
            <section key={dia} className="space-y-2" aria-label={dia}>
              <h2 className="text-sm font-medium text-muted-foreground first-letter:uppercase">{dia}</h2>
              <ul className="divide-y rounded-md border bg-card">
                {lista.map((n) => <li key={n.id}><ItemNotificacion n={n} /></li>)}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EstadoVacio icono={Bell} titulo={tipo ? 'No hay avisos de este tipo' : 'No tenés avisos'}
          descripcion="Te avisamos acá cuando aparezca una licitación para vos, cuando una esté por cerrar, cuando haya una visita o cuando cambien el pliego. Tocá «Buscar novedades» arriba para traer lo último de ARCE." />
      )}
    </div>
  );
}

export default function NotificacionesPage({ searchParams }: PageProps<'/notificaciones'>) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Notificaciones</h1>
      <Suspense fallback={<Cargando texto="Cargando notificaciones…" />}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
