import { cache, Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { sql } from 'drizzle-orm';
import { SearchX } from 'lucide-react';
import { AnalizarUrl } from '@/components/licitaciones/analizar-url';
import { Filtros } from '@/components/licitaciones/filtros';
import { filtrosDesdeUrl } from '@/components/licitaciones/filtros-url';
import { buttonVariants } from '@/components/ui/button';
import { ListaCargando } from '@/components/licitaciones/lista-cargando';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { BuscandoLicitaciones } from '@/components/licitaciones/buscando-licitaciones';
import { db, schema } from '@/db';
import { requerirSesion } from '@/server/auth/sesion';
import { listarMatches, listarOrganismos, tieneMatches } from '@/server/consultas/licitaciones';
import { ListaConEstado, ProveedorFiltros } from '@/components/licitaciones/estado-filtros';
import { TituloDashboard } from '@/components/licitaciones/titulo-dashboard';
import { ListaTarjetas } from '@/components/licitaciones/lista-tarjetas';
import type { FiltrosDashboard } from '@/lib/types';

export const metadata: Metadata = { title: 'Licitaciones · Luxis' };

type ParametrosUrl = Promise<Record<string, string | string[] | undefined>>;

// El encabezado y la lista piden lo mismo: una sola consulta por request.
const matchesFiltrados = cache((empresaId: string, filtros: string) => listarMatches(empresaId, JSON.parse(filtros) as FiltrosDashboard));

// Después del onboarding el matching corre en segundo plano 1–2 min (docs/04, pendiente 1).
async function perfilRecienActualizado(empresaId: string): Promise<boolean> {
  const [e] = await db.select({ en: schema.empresas.perfilActualizadoEn }).from(schema.empresas)
    .where(sql`${schema.empresas.id} = ${empresaId} and ${schema.empresas.perfilActualizadoEn} > now() - interval '5 minutes'`);
  return Boolean(e?.en);
}

/** El número grande cuenta las licitaciones que cumplen los filtros actuales (pedido de seba). */
async function Encabezado({ searchParams }: { searchParams: ParametrosUrl }) {
  const filtros = filtrosDesdeUrl(await searchParams);
  await connection();
  const { empresaId } = await requerirSesion();
  const [cards, [empresa]] = await Promise.all([
    matchesFiltrados(empresaId, JSON.stringify(filtros)),
    db.select({ nombre: schema.empresas.nombre }).from(schema.empresas).where(sql`${schema.empresas.id} = ${empresaId}`),
  ]);
  const cierranSemana = cards.filter((c) => c.diasParaCierre !== null && c.diasParaCierre <= 7).length;
  // eslint-disable-next-line react-hooks/purity -- componente de servidor dinámico (connection()): se evalúa por request
  const hace24h = Date.now() - 864e5;
  const nuevas24h = cards.filter((c) => new Date(c.fechaPublicacion).getTime() > hace24h).length;
  const semana = cierranSemana === 0 ? 'Ninguna cierra esta semana' : `${cierranSemana} ${cierranSemana === 1 ? 'cierra' : 'cierran'} esta semana`;
  const nuevas = nuevas24h > 0 ? `${nuevas24h} ${nuevas24h === 1 ? 'se publicó' : 'se publicaron'} en las últimas 24 horas` : null;
  return (
    <header className="space-y-2">
      {empresa?.nombre && <p className="text-sm text-muted-foreground">Hola, {empresa.nombre}</p>}
      <TituloDashboard total={cards.length} />
      <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
        <span>{semana}.</span>
        {nuevas && <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-1.5 rounded-full bg-primary" />{nuevas}.</span>}
      </p>
    </header>
  );
}

function EncabezadoCargando() {
  return (
    <header className="space-y-2" aria-hidden>
      <div className="h-4 w-40 rounded-md bg-muted" />
      <div className="h-14 w-96 max-w-full rounded-md bg-muted" />
      <div className="h-5 w-64 rounded-md bg-muted" />
    </header>
  );
}

async function FiltrosConOpciones() {
  await connection();
  const { empresaId } = await requerirSesion();
  const organismos = await listarOrganismos(empresaId);
  return <Filtros organismos={organismos} />;
}

async function Lista({ searchParams }: { searchParams: ParametrosUrl }) {
  const filtros = filtrosDesdeUrl(await searchParams);
  await connection();
  const { empresaId } = await requerirSesion();
  const cards = await matchesFiltrados(empresaId, JSON.stringify(filtros));

  if (!cards.length) {
    const hayAlguna = await tieneMatches(empresaId);
    if (!hayAlguna && (await perfilRecienActualizado(empresaId))) return <BuscandoLicitaciones />;
    return hayAlguna ? (
      <EstadoVacio icono={SearchX} titulo="Ninguna licitación coincide con estos filtros"
        descripcion="Probá con “Todas” en coincidencia, “Cuando sea” en fecha de cierre o mirá las guardadas."
        accion={<Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Limpiar filtros</Link>} />
    ) : (
      <EstadoVacio icono={SearchX} titulo="Todavía no encontramos licitaciones para tu empresa"
        descripcion="Cuando crucemos tu perfil con los llamados vigentes de ARCE, las vas a ver acá. Si cambiaste tus productos, revisá tu cuenta."
        accion={<Link href="/cuenta" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Revisar mi perfil</Link>} />
    );
  }

  return (
    <section aria-labelledby="titulo-lista" className="space-y-3">
      <h2 id="titulo-lista" className="sr-only">Licitaciones con los filtros actuales</h2>
      <ListaTarjetas cards={cards} />
    </section>
  );
}

function FiltrosYListaCargando() {
  return (
    <>
      <Skeleton className="h-[13rem] w-full rounded-md" />
      <div className="min-h-[24rem] pt-2"><ListaCargando /></div>
    </>
  );
}

export default function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  return (
    <div className="space-y-6">
      {/* data-guia: anclas de la guía inicial (src/components/guia/guia-inicial.tsx). */}
      <section className="relative grid gap-6 overflow-hidden rounded-xl border bg-card p-5 sm:p-7 lg:grid-cols-[1fr_22rem] lg:items-center">
        {/* Textura de puntos estática (la misma de los estados vacíos): da profundidad sin animar. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_right,black,transparent_70%)]" />
        <div data-guia="resumen" className="relative">
          <Suspense fallback={<EncabezadoCargando />}>
            <Encabezado searchParams={searchParams} />
          </Suspense>
        </div>
        <div data-guia="analizar-url" className="relative">
          <AnalizarUrl compacto />
        </div>
      </section>
      <Suspense fallback={<FiltrosYListaCargando />}>
      <ProveedorFiltros>
        <div data-guia="filtros">
          <Suspense fallback={<Skeleton className="h-[13rem] w-full rounded-md" />}>
            <FiltrosConOpciones />
          </Suspense>
        </div>
        <div data-guia="lista" className="pt-2">
          <ListaConEstado>
            <Suspense fallback={<ListaCargando />}>
              <Lista searchParams={searchParams} />
            </Suspense>
          </ListaConEstado>
        </div>
      </ProveedorFiltros>
      </Suspense>
    </div>
  );
}
