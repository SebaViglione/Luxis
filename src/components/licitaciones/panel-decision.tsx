'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, CalendarClock, ExternalLink, FileText } from 'lucide-react';
import CountUp from '@/components/reactbits/count-up';
import { buttonVariants } from '@/components/ui/button';
import type { DetalleLicitacion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AccionesMatch } from './acciones-match';
import { nivelConfianza } from './badge-confianza';
import { fechaCorta, suavizarMayusculas, textoCierre } from './formato';

/** Una de las tres preguntas del panel: título chico, respuesta grande, detalle. */
function Pregunta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-md border bg-background/80 p-4">
      <h2 className="text-sm text-muted-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

function resumenPapeles(match: NonNullable<DetalleLicitacion['match']>) {
  const faltan = match.gapDocumental.filter((g) => g.obligatorio && !g.tiene);
  const dificiles = faltan.filter((g) => g.alcanzableAntesCierre === false).length;
  if (!match.gapDocumental.length) return { titulo: 'Sin revisar todavía', detalle: 'Cuando leamos el pliego te decimos qué papeles piden.', tono: 'text-muted-foreground' };
  if (!faltan.length) return { titulo: 'Tenés todo lo que piden', detalle: 'Los formularios y la planilla de precios los armás con Luxis.', tono: 'text-exito' };
  if (dificiles) return { titulo: `Te ${dificiles === 1 ? 'falta 1 papel difícil' : `faltan ${dificiles} papeles difíciles`}`, detalle: 'No llegarías a conseguirlo antes del cierre.', tono: 'text-error' };
  return { titulo: `Te ${faltan.length === 1 ? 'falta 1 papel' : `faltan ${faltan.length} papeles`}`, detalle: 'Llegás a conseguirlo antes del cierre.', tono: 'text-alerta-fuerte' };
}

/**
 * Panel de decisión: responde de un vistazo si conviene, a qué precio y si llegás con los papeles.
 * Es el momento visual de la pantalla (textura de puntos + monto que cuenta una vez).
 */
/** Monto total posible (precio sugerido × cantidad de lo que podés ofertar). Lo arma el servidor con los mismos precios de la pestaña Precios. */
export function MontoPosible({ total, moneda }: { total: number; moneda: string }) {
  if (total <= 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm">Sin precios de referencia</p>
        <p className="text-sm text-muted-foreground">No encontramos ventas parecidas al Estado. Usá tu lista de precios.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Podrías vender por</p>
      <p className="font-mono text-3xl font-semibold tabular-nums">
        ≈ <CountUp to={Math.round(total)} duration={1} separator="." trigger="load" prefix={moneda === 'USD' ? 'US$ ' : '$ '} />
      </p>
    </div>
  );
}

export function PanelDecision({ d, diasCierre, irA, montoPrecio }: { d: DetalleLicitacion; diasCierre: number | null; irA: (pestana: string) => void; montoPrecio: React.ReactNode }) {
  const l = d.licitacion;
  const urgente = diasCierre !== null && diasCierre >= 0 && diasCierre <= 3;
  const cerrada = diasCierre !== null && diasCierre < 0;
  const hayOfertables = (d.match?.itemsOfertables ?? []).some((i) => i.puedeOfertar);
  const nivel = d.match ? nivelConfianza(d.match.confianza) : null;
  const papeles = d.match ? resumenPapeles(d.match) : null;

  return (
    <section className="relative overflow-hidden rounded-xl border bg-card p-5 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
      <div className="relative space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              cerrada ? 'bg-muted text-muted-foreground' : urgente ? 'bg-alerta-suave text-alerta-fuerte' : 'bg-secondary text-foreground')}>
              <CalendarClock aria-hidden className="size-3.5" />
              {cerrada ? 'Ya cerró' : textoCierre(diasCierre).replace(/^c/, 'C')}
              {l.fechaTopeOfertas && <span className="font-mono font-normal">{fechaCorta(l.fechaTopeOfertas)}</span>}
            </span>
            <span>{l.tipoCompraNombre} N° <span className="font-mono">{l.numero}</span> de {l.organismo}{l.unidadEjecutora && l.unidadEjecutora !== l.organismo ? ` (${l.unidadEjecutora})` : ''}</span>
          </div>
          <h1 className="max-w-4xl text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{suavizarMayusculas(l.objeto)}</h1>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <Pregunta titulo="¿Te conviene?">
            {d.match && nivel ? (
              <div className="space-y-2" aria-label={`Confianza ${nivel.etiqueta.toLowerCase()}: ${d.match.confianza} sobre 100`}>
                <p className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-semibold tabular-nums">{d.match.confianza}</span>
                  <span className="text-sm font-medium">{nivel.llano}</span>
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <motion.div className={cn('h-full rounded-full', nivel.barra)} initial={{ width: 0 }} animate={{ width: `${d.match.confianza}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">{d.match.razon}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">Todavía no la comparamos con lo que vendés.</p>}
          </Pregunta>

          <Pregunta titulo="¿A qué precio?">
            {montoPrecio}
            {hayOfertables && (
              <button type="button" onClick={() => irA('precios')} className="mt-2 text-sm text-foreground underline underline-offset-4 hover:text-primary">
                Ver precio por producto
              </button>
            )}
          </Pregunta>

          <Pregunta titulo="¿Llegás con los papeles?">
            {papeles ? (
              <div className="space-y-2">
                <p className={cn('text-lg leading-snug font-semibold', papeles.tono)}>{papeles.titulo}</p>
                <p className="text-sm text-muted-foreground">{papeles.detalle}</p>
                {d.match?.gapDocumental.length ? (
                  <button type="button" onClick={() => irA('papeles')} className="text-sm text-foreground underline underline-offset-4 hover:text-primary">
                    Ver los papeles
                  </button>
                ) : null}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin datos todavía.</p>}
          </Pregunta>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Link href={`/licitaciones/${encodeURIComponent(l.idCompra)}/postular`} className={buttonVariants()}>
            <FileText aria-hidden /> Preparar mi oferta <ArrowRight aria-hidden />
          </Link>
          {d.match && <AccionesMatch idCompra={l.idCompra} estado={d.match.estadoUsuario} conPresentada />}
          <span className="flex-1" />
          <a href={l.urlDetalle} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Ver la publicación en ARCE <ExternalLink aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
