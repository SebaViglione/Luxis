import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { BookmarkCheck, Hourglass, Send } from 'lucide-react';
import { CardLicitacion } from '@/components/licitaciones/card-licitacion';
import { fecha } from '@/components/licitaciones/formato';
import { ListaCargando } from '@/components/licitaciones/lista-cargando';
import { buttonVariants } from '@/components/ui/button';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { LicitacionCard } from '@/lib/types';
import { cn } from '@/lib/utils';
import { requerirSesion } from '@/server/auth/sesion';
import { listarEnCurso } from '@/server/estadisticas/consultas';
import { actualizarResultados } from '@/server/estadisticas/resultados';

export const metadata: Metadata = { title: 'En curso · Luxis' };

function Rotulo({ lic }: { lic: LicitacionCard }) {
  const presentada = lic.estadoUsuario === 'presentada';
  const cerro = lic.diasParaCierre !== null && lic.diasParaCierre < 0;
  const Icono = presentada ? Send : BookmarkCheck;
  return (
    <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium', presentada ? 'bg-alerta-suave text-alerta-fuerte' : 'bg-secondary text-foreground')}>
        <Icono aria-hidden className="size-3.5" />
        {presentada ? 'Presentada · esperando adjudicación' : 'Guardada'}
      </span>
      {cerro && lic.fechaTopeOfertas && (
        <span className="text-muted-foreground">Cerró el <span className="font-mono">{fecha(lic.fechaTopeOfertas).slice(0, 5)}</span></span>
      )}
    </p>
  );
}

async function Lista() {
  await connection();
  const { empresaId } = await requerirSesion();
  await actualizarResultados(empresaId).catch((e) => console.error('[en-curso] resultados', e));
  const cards = await listarEnCurso(empresaId);

  if (!cards.length) {
    return (
      <EstadoVacio icono={Hourglass} titulo="No tenés licitaciones en curso"
        descripcion="Cuando guardes una licitación o la marques como presentada, la seguimos acá hasta que ARCE publique a quién se la adjudicaron."
        accion={<Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Ver licitaciones para vos</Link>} />
    );
  }

  const presentadas = cards.filter((c) => c.estadoUsuario === 'presentada').length;
  return (
    <section aria-labelledby="titulo-en-curso" className="space-y-3">
      <h2 id="titulo-en-curso" className="text-sm font-normal text-muted-foreground">
        {presentadas} {presentadas === 1 ? 'presentada' : 'presentadas'} · {cards.length - presentadas} {cards.length - presentadas === 1 ? 'guardada' : 'guardadas'}
      </h2>
      <ul className="space-y-4">
        {cards.map((c) => (
          <li key={c.idCompra}>
            <Rotulo lic={c} />
            <CardLicitacion lic={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EnCursoPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Seguimiento</p>
        <h1 className="text-2xl">En curso</h1>
        <p className="text-sm text-muted-foreground">
          Las licitaciones que guardaste o a las que te presentaste. Siguen acá aunque haya cerrado la recepción de ofertas, hasta que se publique el ganador.
        </p>
      </header>
      <Suspense fallback={<ListaCargando />}>
        <Lista />
      </Suspense>
    </div>
  );
}
