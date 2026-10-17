import Link from 'next/link';
import { CalendarClock, MapPinned } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { LicitacionCard } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AccionesMatch } from './acciones-match';
import { BadgeConfianza } from './badge-confianza';
import { BadgeDocumentacion } from './badge-documentacion';
import { fechaCorta, monto, suavizarMayusculas, textoCierre } from './formato';

export function CardLicitacion({ lic }: { lic: LicitacionCard }) {
  const href = `/licitaciones/${encodeURIComponent(lic.idCompra)}`;
  const ofertables = lic.itemsOfertables.filter((i) => i.puedeOfertar);
  const chips = ofertables.slice(0, 4);
  const resto = ofertables.length - chips.length;
  const urgente = lic.diasParaCierre !== null && lic.diasParaCierre <= 3;

  return (
    <article className="rounded-md border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-base leading-snug">
            <Link href={href} className="line-clamp-2 underline-offset-4 hover:underline">{suavizarMayusculas(lic.objeto)}</Link>
          </h3>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground sm:gap-x-1.5">
            <span>{lic.organismo}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{lic.tipoCompraNombre} <span className="font-mono">{lic.numero}</span></span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span className={cn('inline-flex items-center gap-1', urgente && 'font-medium text-alerta-fuerte')}>
              <CalendarClock aria-hidden className="size-3.5" />
              {textoCierre(lic.diasParaCierre)} ({fechaCorta(lic.fechaTopeOfertas)})
            </span>
          </p>
          <p className="line-clamp-2 text-sm">{lic.razon}</p>
          {chips.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Ítems que podés ofertar">
              {chips.map((i) => (
                <li key={i.nroItem} className="max-w-56 truncate rounded-md border bg-background px-2 py-0.5 text-xs">
                  {suavizarMayusculas(i.descripcion)}
                </li>
              ))}
              {resto > 0 && <li className="rounded-md px-1 py-0.5 text-xs text-muted-foreground">+{resto} más</li>}
            </ul>
          )}
        </div>
        <BadgeConfianza valor={lic.confianza} className="order-first shrink-0 self-start sm:order-none" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <BadgeDocumentacion estado={lic.estadoDocumental} />
          <span className="text-muted-foreground">
            {lic.montoEstimado !== null ? (
              <>Monto estimado <span className="font-mono font-medium text-foreground">{monto(lic.montoEstimado, lic.moneda)}</span></>
            ) : 'Sin precio histórico'}
          </span>
          {lic.tieneVisita && (
            <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPinned aria-hidden className="size-3.5" /> Tiene visita</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AccionesMatch idCompra={lic.idCompra} estado={lic.estadoUsuario} />
          <Link href={href} className={buttonVariants({ size: 'sm' })}>Ver detalle</Link>
        </div>
      </div>
    </article>
  );
}
