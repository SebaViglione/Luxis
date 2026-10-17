import Link from 'next/link';
import { CircleCheck, CircleX } from 'lucide-react';
import { fecha, monto, suavizarMayusculas } from '@/components/licitaciones/formato';
import { cn } from '@/lib/utils';
import type { ResultadoReciente } from '@/server/estadisticas/consultas';

export function ResultadosRecientes({ resultados }: { resultados: ResultadoReciente[] }) {
  return (
    <ul className="divide-y rounded-md border bg-card">
      {resultados.map((r) => {
        const gano = r.estado === 'ganada';
        const Icono = gano ? CircleCheck : CircleX;
        return (
          <li key={r.idCompra} className="flex flex-wrap items-start gap-x-4 gap-y-1.5 p-3">
            <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', gano ? 'bg-exito-suave text-exito' : 'bg-error-suave text-error')}>
              <Icono aria-hidden className="size-3.5" /> {gano ? 'Ganada' : 'Perdida'}
            </span>
            <span className="min-w-0 flex-1">
              <Link href={`/licitaciones/${encodeURIComponent(r.idCompra)}`} className="line-clamp-1 text-sm underline-offset-4 hover:underline">{suavizarMayusculas(r.objeto)}</Link>
              <span className="block text-xs text-muted-foreground">{r.organismo} · resultado registrado el <span className="font-mono">{fecha(r.fecha)}</span></span>
            </span>
            {gano && r.facturado !== null && <span className="shrink-0 font-mono text-sm tabular-nums">{monto(r.facturado)}</span>}
          </li>
        );
      })}
    </ul>
  );
}
