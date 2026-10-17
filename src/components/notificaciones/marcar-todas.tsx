'use client';

import { useTransition } from 'react';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { marcarTodasNotificacionesLeidas } from './acciones';

export function MarcarTodas({ deshabilitado }: { deshabilitado: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={deshabilitado || pendiente} onClick={() => iniciar(() => marcarTodasNotificacionesLeidas())}>
      <CheckCheck aria-hidden /> {pendiente ? 'Marcando…' : 'Marcar todas como leídas'}
    </Button>
  );
}
