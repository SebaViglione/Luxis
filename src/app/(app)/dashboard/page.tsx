import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { sql } from 'drizzle-orm';
import { SearchX } from 'lucide-react';
import { AnalizarUrl } from '@/components/licitaciones/analizar-url';
import { CardLicitacion } from '@/components/licitaciones/card-licitacion';
import { Filtros } from '@/components/licitaciones/filtros';
import { filtrosDesdeUrl } from '@/components/licitaciones/filtros-url';
import CountUp from '@/components/reactbits/count-up';
import { buttonVariants } from '@/components/ui/button';
import { Cargando } from '@/components/ui/cargando';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { BuscandoLicitaciones } from '@/components/licitaciones/buscando-licitaciones';
import { db, schema } from '@/db';
import { requerirSesion } from '@/server/auth/sesion';
import { listarMatches, resumenDashboard } from '@/server/consultas/licitaciones';

export const metadata: Metadata = { title: 'Licitaciones · Luxis' };

// Después del onboarding el matching corre en segundo plano 1–2 min (docs/04, pendiente 1).
async function perfilRecienActualizado(empresaId: string): Promise<boolean> {
  const [e] = await db.select({ en: schema.empresas.perfilActualizadoEn }).from(schema.empresas)
    .where(sql`${schema.empresas.id} = ${empresaId} and ${schema.empresas.perfilActualizadoEn} > now() - interval '5 minutes'`);
  return Boolean(e?.en);
}

async function Encabezado() {
  await connection();
  const { empresaId } = await requerirSesion();
  const r = await resumenDashboard(empresaId);
  return (
    <header className="space-y-1">
      <h1 aria-label={`${r.total} ${r.total === 1 ? 'licitación' : 'licitaciones'} para vos`} className="flex flex-wrap items-baseline gap-x-3">
        <CountUp to={r.total} duration={0.8} trigger="load" className="text-5xl font-semibold tracking-tight" />
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
  const todas = await listarMatches(empresaId, { estado: 'todas', confianzaMin: 0 });
  const organismos = [...new Set(todas.map((c) => c.organismo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  return <Filtros organismos={organismos} />;
}

async function Lista({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filtros = filtrosDesdeUrl(await searchParams);
  await connection();
  const { empresaId } = await requerirSesion();
  const cards = await listarMatches(empresaId, filtros);

  if (!cards.length) {
    const hayAlguna = (await listarMatches(empresaId, { estado: 'todas', confianzaMin: 0 })).length > 0;
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
      <h2 id="titulo-lista" className="text-sm font-normal text-muted-foreground">
        {cards.length} {cards.length === 1 ? 'licitación' : 'licitaciones'} con los filtros actuales
      </h2>
      <ul className="space-y-3">
        {cards.map((c) => <li key={c.idCompra}><CardLicitacion lic={c} /></li>)}
      </ul>
    </section>
  );
}

export default function DashboardPage({ searchParams }: PageProps<'/dashboard'>) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<EncabezadoCargando />}>
        <Encabezado />
      </Suspense>
      <AnalizarUrl />
      <Suspense fallback={<div className="h-24 rounded-md border bg-card" aria-hidden />}>
        <FiltrosConOpciones />
      </Suspense>
      <Suspense fallback={<Cargando texto="Buscando licitaciones para tu empresa…" />}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
