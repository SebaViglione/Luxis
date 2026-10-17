import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { SearchX } from 'lucide-react';
import { AnalizarUrl } from '@/components/licitaciones/analizar-url';
import { CardLicitacion } from '@/components/licitaciones/card-licitacion';
import { Filtros } from '@/components/licitaciones/filtros';
import { filtrosDesdeUrl } from '@/components/licitaciones/filtros-url';
import { buttonVariants } from '@/components/ui/button';
import { ListaCargando } from '@/components/licitaciones/lista-cargando';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { BuscandoLicitaciones, SiguenLlegando } from '@/components/licitaciones/buscando-licitaciones';
import { requerirSesion } from '@/server/auth/sesion';
import { listarMatches, listarOrganismos, progresoMatching, resumenDashboard, tieneMatches } from '@/server/consultas/licitaciones';
import { ListaConEstado, ProveedorFiltros } from '@/components/licitaciones/estado-filtros';
import { ContadorTotal } from '@/components/licitaciones/contador-total';

export const metadata: Metadata = { title: 'Licitaciones · Luxis' };

async function Encabezado() {
  await connection();
  const { empresaId } = await requerirSesion();
  const r = await resumenDashboard(empresaId);
  return (
    <header className="space-y-1">
      <h1 aria-label={`${r.total} ${r.total === 1 ? 'licitación' : 'licitaciones'} para vos`} className="flex flex-wrap items-baseline gap-x-3">
        <ContadorTotal total={r.total} className="text-5xl font-semibold tracking-tight" />
        <span className="text-2xl font-semibold tracking-tight">{r.total === 1 ? 'licitación' : 'licitaciones'} para vos</span>
      </h1>
      <p className="text-muted-foreground">
        {r.cierranSemana === 0 ? 'Ninguna cierra esta semana.' : `${r.cierranSemana} ${r.cierranSemana === 1 ? 'cierra' : 'cierran'} esta semana.`}
      </p>
    </header>
  );
}

function EncabezadoCargando() {
  return (
    <header className="space-y-1" aria-hidden>
      <div className="h-12 w-72 rounded-md bg-muted" />
      <div className="h-5 w-40 rounded-md bg-muted" />
    </header>
  );
}

async function FiltrosConOpciones() {
  await connection();
  const { empresaId } = await requerirSesion();
  const organismos = await listarOrganismos(empresaId);
  return <Filtros organismos={organismos} />;
}

async function Lista({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filtros = filtrosDesdeUrl(await searchParams);
  await connection();
  const { empresaId } = await requerirSesion();
  const cards = await listarMatches(empresaId, filtros);
  // Después del onboarding (o de cambiar el perfil) el matching corre en segundo plano 1–3 min.
  const progreso = await progresoMatching(empresaId);

  if (!cards.length) {
    if (progreso.enCurso) return <BuscandoLicitaciones evaluadas={progreso.evaluadas} total={progreso.total} />;
    const hayAlguna = await tieneMatches(empresaId);
    return hayAlguna ? (
      <EstadoVacio icono={SearchX} titulo="No hay licitaciones con estos filtros"
        descripcion="Probá bajar la confianza mínima, ampliar el plazo de cierre o mirar las guardadas."
        accion={<Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Limpiar filtros</Link>} />
    ) : (
      <EstadoVacio icono={SearchX} titulo="Todavía no encontramos licitaciones para tu empresa"
        descripcion="Cuando crucemos tu perfil con los llamados vigentes de ARCE, las vas a ver acá. Si cambiaste tus productos, revisá tu cuenta."
        accion={<Link href="/cuenta" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Revisar mi perfil</Link>} />
    );
  }

  return (
    <section aria-labelledby="titulo-lista" className="space-y-3">
      {progreso.enCurso && <SiguenLlegando evaluadas={progreso.evaluadas} total={progreso.total} />}
      <h2 id="titulo-lista" className="text-sm font-normal text-muted-foreground">
        {cards.length} {cards.length === 1 ? 'licitación' : 'licitaciones'} con los filtros actuales
      </h2>
      <ul className="space-y-3">
        {cards.map((c) => <li key={c.idCompra}><CardLicitacion lic={c} /></li>)}
      </ul>
    </section>
  );
}

function FiltrosYListaCargando() {
  return (
    <>
      <Skeleton className="h-[9.5rem] w-full rounded-md" />
      <div className="min-h-[24rem] pt-2"><ListaCargando /></div>
    </>
  );
}

export default function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  return (
    <div className="space-y-6">
      {/* data-guia: anclas de la guía inicial (src/components/guia/guia-inicial.tsx). */}
      <div data-guia="resumen">
        <Suspense fallback={<EncabezadoCargando />}>
          <Encabezado />
        </Suspense>
      </div>
      <div data-guia="analizar-url">
        <AnalizarUrl />
      </div>
      <Suspense fallback={<FiltrosYListaCargando />}>
      <ProveedorFiltros>
        <div data-guia="filtros">
          <Suspense fallback={<Skeleton className="h-[9.5rem] w-full rounded-md" />}>
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
