'use client';

import { CircleCheck, Copy, ExternalLink, Mail } from 'lucide-react';
import { useState, useTransition } from 'react';
import { fechaHora } from '@/components/licitaciones/formato';
import { cambiarEstadoMatch } from '@/components/licitaciones/acciones';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { DatosPagina } from '@/server/postulacion/tipos';

export function PasoPresentar({ datos }: { datos: DatosPagina }) {
  const l = datos.licitacion;
  return (
    <div className="space-y-6">
      {l.aperturaElectronica ? <GuiaSice datos={datos} /> : <SinOfertaEnLinea datos={datos} />}
      <MarcarPresentada datos={datos} />
    </div>
  );
}

function GuiaSice({ datos }: { datos: DatosPagina }) {
  const l = datos.licitacion;
  const pasos = [
    {
      titulo: 'Entrá a SICE',
      texto:
        'Con el documento de la empresa escrito igual que en RUPE y la contraseña de SICE. Es distinta de la de RUPE: si no la tenés, pedila desde el mismo portal (llega al mail registrado en RUPE y el link vence a los 15 minutos).',
    },
    {
      titulo: 'Cotizá ítem por ítem',
      texto:
        'En cada ítem: "Ofertar en este ítem" y cargá cantidad, precio unitario SIN impuestos, moneda, impuesto y características. Copialos de la planilla que descargaste. Guardá cada ítem.',
    },
    {
      titulo: 'Adjuntá los documentos',
      texto:
        'Subí el formulario de identificación firmado, la especificación de la oferta y la carta, más lo que pida el pliego (fichas técnicas, constancia de visita). Cada archivo lleva una descripción. Marcá como confidencial solo lo que lo sea: precios y descripciones nunca lo son.',
    },
    {
      titulo: 'Revisá antes del cierre',
      texto: `No hay botón de "enviar": vale lo que esté guardado al ${fechaHora(l.fechaTopeOfertas)}. Hasta esa hora podés cambiar o borrar la oferta.`,
    },
    {
      titulo: 'Cargá con tiempo y en una sola pestaña',
      texto: 'El portal puede trabarse a último momento y ARCE pide no trabajar con varias pestañas abiertas.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cargá la oferta en ARCE</CardTitle>
        <CardDescription>
          La oferta se presenta en línea en SICE. Luxis no puede cargarla por vos (pide tu contraseña y un segundo factor), pero ya tenés todo
          listo para copiar y adjuntar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ol className="space-y-4">
          {pasos.map((p, i) => (
            <li key={p.titulo} className="flex gap-3">
              <span className={cn('font-mono text-xs tabular-nums', i === 0 ? 'text-primary' : 'text-muted-foreground')}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <a href={l.urlOfertar} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
            Abrir ARCE para ofertar <ExternalLink aria-hidden />
          </a>
          <a href={l.urlDetalle} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost' })}>
            Ver el llamado en ARCE <ExternalLink aria-hidden />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function SinOfertaEnLinea({ datos }: { datos: DatosPagina }) {
  const l = datos.licitacion;
  const [copiado, setCopiado] = useState(false);
  const email = l.contacto.email;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Esta compra no tiene oferta en línea</CardTitle>
        <CardDescription>
          El organismo recibe las ofertas por mail, en sobre o en mano: el pliego dice cómo. Mandá o entregá la cotización y los documentos
          firmados antes del {fechaHora(l.fechaTopeOfertas)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Contacto</dt>
            <dd>
              {l.contacto.nombre && <span className="block">{l.contacto.nombre}</span>}
              <span className="font-mono">{email ?? 'No informado'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Lugar de apertura</dt>
            <dd>{l.lugarApertura ?? 'No informado'}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {email && (
            <>
              <a href={`mailto:${email}?subject=${encodeURIComponent(`Oferta ${l.tipoCompraNombre} ${l.numero}`)}`} className={buttonVariants()}>
                <Mail aria-hidden /> Escribir al organismo
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(email).then(() => setCopiado(true));
                }}
              >
                <Copy aria-hidden /> {copiado ? 'Copiado' : 'Copiar mail'}
              </Button>
            </>
          )}
          <a href={l.urlDetalle} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost' })}>
            Ver el llamado en ARCE <ExternalLink aria-hidden />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function MarcarPresentada({ datos }: { datos: DatosPagina }) {
  const [estado, setEstado] = useState(datos.estadoUsuario);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!estado) return null; // sin match para esta empresa no hay estado que guardar

  if (estado === 'presentada') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-exito/30 bg-exito-suave p-4 text-sm">
        <CircleCheck aria-hidden className="size-4 text-exito" />
        Marcaste esta licitación como presentada. La seguís desde Guardadas en el dashboard.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-4">
      <div>
        <p className="text-sm font-medium">¿Ya la cargaste en ARCE?</p>
        <p className="text-sm text-muted-foreground">Marcala como presentada para seguirla desde el dashboard.</p>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
      <Button
        variant="outline"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            try {
              await cambiarEstadoMatch(datos.licitacion.idCompra, 'presentada');
              setEstado('presentada');
            } catch {
              setError('No pudimos guardar el estado. Probá de nuevo.');
            }
          })
        }
      >
        {pendiente ? <Spinner /> : <CircleCheck aria-hidden />} Marcar como presentada
      </Button>
    </div>
  );
}
