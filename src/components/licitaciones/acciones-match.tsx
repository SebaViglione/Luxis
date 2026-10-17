'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck, Send, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EstadoUsuarioMatch } from '@/lib/types';
import { cambiarEstadoMatch } from './acciones';

export function AccionesMatch({ idCompra, estado, conPresentada = false }: {
  idCompra: string;
  estado: EstadoUsuarioMatch;
  conPresentada?: boolean;
}) {
  const [pendiente, iniciar] = useTransition();
  const [actual, setActual] = useOptimistic(estado);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (nuevo: EstadoUsuarioMatch) => {
    setError(null);
    iniciar(async () => {
      setActual(nuevo);
      try {
        await cambiarEstadoMatch(idCompra, nuevo);
      } catch {
        setError('No se pudo guardar el cambio. Probá de nuevo.');
      }
    });
  };

  const guardada = actual === 'guardada' || actual === 'presentada';
  const descartada = actual === 'descartada';
  const presentada = actual === 'presentada';

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pendiente}>
      <Button variant={guardada ? 'secondary' : 'outline'} size="sm" disabled={pendiente} aria-pressed={guardada}
        onClick={() => cambiar(guardada ? 'nuevo' : 'guardada')}>
        {guardada ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
        {guardada ? 'Guardada' : 'Guardar'}
      </Button>
      <Button variant="ghost" size="sm" disabled={pendiente} onClick={() => cambiar(descartada ? 'nuevo' : 'descartada')}>
        {descartada ? <Undo2 aria-hidden /> : <X aria-hidden />}
        {descartada ? 'Recuperar' : 'Descartar'}
      </Button>
      {conPresentada && (
        <Button variant={presentada ? 'secondary' : 'outline'} size="sm" disabled={pendiente} aria-pressed={presentada}
          onClick={() => cambiar(presentada ? 'guardada' : 'presentada')}>
          <Send aria-hidden />
          {presentada ? 'Presentada' : 'Marcar presentada'}
        </Button>
      )}
      {error && <p role="alert" className="w-full text-xs text-error">{error}</p>}
    </div>
  );
}
