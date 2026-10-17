import { Skeleton } from '@/components/ui/skeleton';
import { monto } from '@/components/licitaciones/formato';
import { cn } from '@/lib/utils';
import type { EstadisticasEmpresa } from '@/server/estadisticas/consultas';

const fmtEntero = new Intl.NumberFormat('es-UY');

function Tile({ etiqueta, valor, detalle, marca }: { etiqueta: string; valor: string; detalle?: string; marca?: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {marca && <span aria-hidden className={cn('size-2 rounded-full', marca)} />}
        {etiqueta}
      </dt>
      <dd className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-foreground">{valor}</dd>
      {detalle && <dd className="mt-0.5 text-xs text-muted-foreground">{detalle}</dd>}
    </div>
  );
}

export function KpisEstadisticas({ e }: { e: EstadisticasEmpresa }) {
  const total = e.ganadas + e.perdidas;
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile etiqueta="Ganadas" valor={fmtEntero.format(e.ganadas)} marca="bg-exito" detalle={`de ${fmtEntero.format(total)} con resultado`} />
      <Tile etiqueta="Perdidas" valor={fmtEntero.format(e.perdidas)} marca="bg-error" detalle={e.enCurso ? `${fmtEntero.format(e.enCurso)} presentadas esperan el resultado` : undefined} />
      <Tile etiqueta="Tasa de éxito" valor={e.tasaExito === null ? '—' : `${Math.round(e.tasaExito * 100)} %`} detalle="ganadas sobre ganadas + perdidas" />
      <Tile etiqueta="Facturado sin IVA" valor={monto(e.facturado)}
        detalle={e.facturadoOtrasMonedas ? `Además ${fmtEntero.format(Math.round(e.facturadoOtrasMonedas))} en otras monedas` : 'Cantidad por precio unitario de lo que ganaste'} />
    </dl>
  );
}

export function KpisCargando() {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2 rounded-md border bg-card p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
