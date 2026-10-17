'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import type { Notificacion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { fechaCorta } from '@/components/licitaciones/formato';
import { marcarNotificacionLeida } from './acciones';
import { TIPO_NOTIFICACION } from './tipos';

export function ItemNotificacion({ n, compacto = false, onNavegar }: { n: Notificacion; compacto?: boolean; onNavegar?: () => void }) {
  const [marcando, iniciar] = useTransition();
  const { icono: Icono, etiqueta } = TIPO_NOTIFICACION[n.tipo];
  const marcar = () => { if (!n.leida) iniciar(() => marcarNotificacionLeida(n.id)); onNavegar?.(); };
  const contenido = (
    <>
      <Icono aria-hidden className={cn('mt-0.5 size-4 shrink-0', n.leida ? 'text-muted-foreground' : 'text-primary')} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', !n.leida && 'font-medium')}>{n.titulo}</p>
        {!compacto && n.cuerpo && <p className="mt-0.5 text-sm text-muted-foreground">{n.cuerpo}</p>}
        <p className="mt-0.5 text-xs text-muted-foreground">{etiqueta} · <span className="font-mono">{fechaCorta(n.createdAt)}</span></p>
      </div>
      {!n.leida && <span aria-label="Sin leer" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
    </>
  );
  const clases = cn('flex items-start gap-3 rounded-md p-2.5 text-left transition-[background-color,opacity] hover:bg-muted', !compacto && 'p-3', marcando && 'opacity-60');
  return n.idCompra ? (
    <Link href={`/licitaciones/${encodeURIComponent(n.idCompra)}`} onClick={marcar} className={clases}>{contenido}</Link>
  ) : (
    <button type="button" onClick={marcar} className={cn(clases, 'w-full')}>{contenido}</button>
  );
}
