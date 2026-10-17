'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ItemNotificacion } from '@/components/notificaciones/item-notificacion';
import type { Notificacion } from '@/lib/types';

export function Campanita({ noLeidas, ultimas }: { noLeidas: number; ultimas: Notificacion[] }) {
  const [abierto, setAbierto] = useState(false);
  const etiqueta = noLeidas ? `Notificaciones: ${noLeidas} sin leer` : 'Notificaciones';
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={etiqueta} className="relative" />}>
        <Bell aria-hidden />
        {noLeidas > 0 && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-primary px-1 font-mono text-[10px] leading-4 text-primary-foreground">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] gap-1 p-2">
        <p className="px-2.5 pt-1 text-sm font-medium">Notificaciones</p>
        {ultimas.length ? (
          <ul>{ultimas.map((n) => <li key={n.id}><ItemNotificacion n={n} compacto onNavegar={() => setAbierto(false)} /></li>)}</ul>
        ) : (
          <p className="px-2.5 py-3 text-sm text-muted-foreground">No tenés notificaciones nuevas.</p>
        )}
        <Link href="/notificaciones" onClick={() => setAbierto(false)} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mx-2.5 mb-1' })}>Ver todas</Link>
      </PopoverContent>
    </Popover>
  );
}
