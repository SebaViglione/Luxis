'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function Campanita({ noLeidas }: { noLeidas: number }) {
  const etiqueta = noLeidas ? `Notificaciones: ${noLeidas} sin leer` : 'Notificaciones';
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={etiqueta} className="relative" />}>
        <Bell aria-hidden />
        {noLeidas > 0 && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-primary px-1 font-mono text-[10px] leading-4 text-primary-foreground">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-sm font-medium">Notificaciones</p>
        <p className="text-sm text-muted-foreground">No tenés notificaciones nuevas.</p>
        <Link href="/notificaciones" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Ver todas</Link>
      </PopoverContent>
    </Popover>
  );
}
