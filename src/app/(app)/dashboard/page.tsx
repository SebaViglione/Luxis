import { cache, Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { sql } from 'drizzle-orm';
import { SearchX } from 'lucide-react';
import { AnalizarUrl } from '@/components/licitaciones/analizar-url';
import { CardLicitacion } from '@/components/licitaciones/card-licitacion';
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
import { ContadorTotal } from '@/components/licitaciones/contador-total';
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

async function Encabezado({ searchParams }: { searchParams: ParametrosUrl }) {
  const filtros = filtrosDesdeUrl(await searchParams);
  await connection();
  const { empresaId } = await requerirSesion();
  const cards = await matchesFiltrados(empresaId, JSON.stringify(filtros));
  const total = cards.length;
  const cierranSemana = cards.filter((c) => c.diasParaCierre !== null && c.diasParaCierre <= 7).length;
  return (
    <header className="space-y-1">
      <h1 aria-label={`${total} ${total === 1 ? 'licitación' : 'licitaciones'} para vos`} className="flex flex-wrap items-baseline gap-x-3">
        <ContadorTotal total={total} className="text-5xl font-semibold tracking-tight" />
        <span className="text-2xl font-semibold tracking-tight">{total === 1 ? 'licitación' : 'licitaciones'} para vos</span>
      </h1>
      <p className="text-muted-foreground">
        {cierranSemana === 0 ? 'Ninguna cierra esta semana.' : `${cierranSemana} ${cierranSemana === 1 ? 'cierra' : 'cierran'} esta semana.`}
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

async function Lista({ searchParams }: { searchParams: ParametrosUrl }) {
  const filtros = filtrosDesdeUrl(await searchParams);
  await connection();
  const { empresaId } = await requerirSesion();
  const cards = await matchesFiltrados(empresaId, JSON.stringify(filtros));

  if (!cards.length) {
    const hayAlguna = await tieneMatches(empresaId);
    if (!hayAlguna && (await perfilRecienActualizado(empresaId))) return <BuscandoLicitaciones />;
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
      <h2 id="titulo-lista" className="sr-only">Licitaciones con los filtros actuales</h2>
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
          <Encabezado searchParams={searchParams} />
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
