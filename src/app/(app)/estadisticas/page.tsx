import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { ChartColumn } from 'lucide-react';
import { KpisCargando, KpisEstadisticas } from '@/components/estadisticas/kpis';
import { RankingProductos } from '@/components/estadisticas/ranking-productos';
import { ResultadosRecientes } from '@/components/estadisticas/resultados-recientes';
import { buttonVariants } from '@/components/ui/button';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { requerirSesion } from '@/server/auth/sesion';
import { estadisticasEmpresa } from '@/server/estadisticas/consultas';
import { actualizarResultados } from '@/server/estadisticas/resultados';

export const metadata: Metadata = { title: 'Mis estadísticas · Luxis' };

function Seccion({ id, titulo, bajada, children }: { id: string; titulo: string; bajada?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="space-y-0.5">
        <h2 id={id} className="text-lg">{titulo}</h2>
        {bajada && <p className="text-sm text-muted-foreground">{bajada}</p>}
      </div>
      {children}
    </section>
  );
}

async function Contenido() {
  await connection();
  const { empresaId } = await requerirSesion();
  await actualizarResultados(empresaId).catch((e) => console.error('[estadisticas] resultados', e));
  const e = await estadisticasEmpresa(empresaId);

  if (e.ganadas + e.perdidas === 0) {
    return (
      <EstadoVacio icono={ChartColumn} titulo="Todavía no tenés resultados"
        descripcion={`Cuando marques una licitación como presentada y el Estado publique quién ganó, la anotamos acá como ganada o perdida.${e.enCurso ? ` Tenés ${e.enCurso} ${e.enCurso === 1 ? 'presentada esperando' : 'presentadas esperando'} resultado.` : ''}`}
        accion={<Link href="/en-curso" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Ver licitaciones en curso</Link>} />
    );
  }

  return (
    <div className="space-y-10">
      <KpisEstadisticas e={e} />
      <Seccion id="ranking" titulo="Ventas por producto" bajada="Lo que ganaste, ordenado por monto sin IVA. Solo ventas en pesos.">
        <RankingProductos productos={e.ranking} />
      </Seccion>
      <Seccion id="recientes" titulo="Resultados recientes">
        <ResultadosRecientes resultados={e.recientes} />
      </Seccion>
    </div>
  );
}

export default function EstadisticasPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Mis estadísticas</h1>
        <p className="text-sm text-muted-foreground">Las licitaciones que ganaste y perdiste según los resultados que publica el Estado, y cuánto vendiste de cada producto.</p>
      </header>
      <Suspense fallback={<KpisCargando />}>
        <Contenido />
      </Suspense>
    </div>
  );
}
