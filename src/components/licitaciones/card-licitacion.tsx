'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { CalendarClock, MapPinned } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { LicitacionCard } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AccionesMatch } from './acciones-match';
import { nivelConfianza } from './badge-confianza';
import { BadgeDocumentacion } from './badge-documentacion';
import { fechaCorta, monto, suavizarMayusculas, textoCierre } from './formato';

/** Puntaje de calce: número + barra que se llena + frase llana. Conserva aria-label "Confianza…" (ancla de la guía). */
function Puntaje({ lic }: { lic: LicitacionCard }) {
  const nivel = nivelConfianza(lic.confianza);
  const ajuste = lic.ajusteDocumental ?? 0;
  const explicacion = ajuste > 0
    ? `Puntaje ${lic.confianzaBase} por lo que vendés, −${ajuste} por ${ajuste >= 25 ? 'un papel difícil de conseguir' : 'un papel que tenés que conseguir'}.`
    : undefined;
  return (
    <div
      className={cn('flex w-full flex-col gap-1.5 rounded-md px-3 py-2.5 sm:w-36', nivel.fondo)}
      aria-label={`Confianza ${nivel.etiqueta.toLowerCase()}: ${lic.confianza} sobre 100. ${nivel.llano}.${explicacion ? ` ${explicacion}` : ''}`}
      title={explicacion}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xl leading-none font-semibold text-foreground tabular-nums">{lic.confianza}</span>
        <span className="text-xs text-muted-foreground">de 100</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-background/70" aria-hidden>
        <motion.div className={cn('h-full rounded-full', nivel.barra)} initial={{ width: 0 }} animate={{ width: `${lic.confianza}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <span className="text-xs font-medium text-foreground">{nivel.llano}</span>
      {ajuste > 0 && <span className="text-xs text-muted-foreground">−{ajuste} por papeles</span>}
    </div>
  );
}

export function CardLicitacion({ lic }: { lic: LicitacionCard }) {
  const href = `/licitaciones/${encodeURIComponent(lic.idCompra)}`;
  const ofertables = lic.itemsOfertables.filter((i) => i.puedeOfertar);
  const chips = ofertables.slice(0, 4);
  const resto = ofertables.length - chips.length;
  const urgente = lic.diasParaCierre !== null && lic.diasParaCierre <= 3;

  return (
    <article className="rounded-md border bg-card p-4 transition-colors hover:border-foreground/20 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                urgente ? 'bg-alerta-suave text-alerta-fuerte' : 'bg-secondary text-foreground')}>
                <CalendarClock aria-hidden className="size-3.5" />
                {textoCierre(lic.diasParaCierre).replace(/^c/, 'C')}
                <span className="font-mono font-normal">{fechaCorta(lic.fechaTopeOfertas)}</span>
              </span>
              <span>{lic.tipoCompraNombre} de {lic.organismo}</span>
            </p>
            <h3 className="text-base leading-snug font-semibold">
              <Link href={href} className="line-clamp-2 underline-offset-4 hover:underline">{suavizarMayusculas(lic.objeto)}</Link>
            </h3>
          </div>

          {lic.razon && (
            <p className="line-clamp-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Por qué: </span>{lic.razon}</p>
          )}

          {chips.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Lo que podés vender</p>
              <ul className="flex flex-wrap gap-1.5" aria-label="Ítems que podés ofertar">
                {chips.map((i) => (
                  <li key={i.nroItem} className="max-w-60 truncate rounded-full border bg-background px-2.5 py-0.5 text-xs">
                    {suavizarMayusculas(i.descripcion)}
                  </li>
                ))}
                {resto > 0 && <li className="px-1 py-0.5 text-xs text-muted-foreground">y {resto} más</li>}
              </ul>
            </div>
          )}
        </div>
        <div className="order-first sm:order-none"><Puntaje lic={lic} /></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <BadgeDocumentacion estado={lic.estadoDocumental} />
          <span className="text-muted-foreground">
            {lic.montoEstimado !== null ? (
              <>Podrías vender por <span className="font-mono font-medium text-foreground">≈ {monto(lic.montoEstimado, lic.moneda)}</span></>
            ) : 'Sin precios de referencia'}
          </span>
          {lic.tieneVisita && (
            <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPinned aria-hidden className="size-3.5" /> Pide visita al lugar</span>
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
