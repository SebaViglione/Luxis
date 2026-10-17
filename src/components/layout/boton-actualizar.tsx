'use client';

import { useEffect, useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generarMisNotificaciones } from '@/components/notificaciones/acciones';

type Estado = { tipo: 'inactivo' } | { tipo: 'trabajando'; texto: string; desde: number } | { tipo: 'listo'; texto: string } | { tipo: 'error'; texto: string };

export function BotonActualizar() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' });
  const [segundos, setSegundos] = useState(0);
  const [, iniciar] = useTransition();
  const trabajando = estado.tipo === 'trabajando';
  const desde = trabajando ? estado.desde : null;

  useEffect(() => {
    if (desde === null) return;
    const id = window.setInterval(() => setSegundos(Math.round((Date.now() - desde) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [desde]);

  const actualizar = () => iniciar(async () => {
    const inicio = Date.now();
    setSegundos(0);
    setEstado({ tipo: 'trabajando', texto: 'Buscando novedades en ARCE…', desde: inicio });
    try {
      const res = await fetch('/api/ingesta/refresh?dias=2', { method: 'POST' });
      const datos = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || datos.ok === false) throw new Error(datos.error ?? `Error ${res.status}`);
      setEstado({ tipo: 'trabajando', texto: 'Generando avisos…', desde: inicio });
      const creadas = await generarMisNotificaciones();
      setEstado({ tipo: 'listo', texto: creadas ? `${creadas} ${creadas === 1 ? 'aviso nuevo' : 'avisos nuevos'}` : 'Todo al día' });
    } catch {
      setEstado({ tipo: 'error', texto: 'No se pudo actualizar. ARCE puede estar lento: probá de nuevo en unos minutos.' });
    }
  });

  return (
    <div className="flex items-center gap-2">
      <span role="status" aria-live="polite" className={estado.tipo === 'error' ? 'max-w-56 text-xs text-error' : 'hidden text-xs text-muted-foreground md:inline'}>
        {estado.tipo === 'inactivo' ? '' : estado.texto}
        {trabajando && <span className="ml-1 font-mono">{segundos} s</span>}
      </span>
      <Button variant="outline" size="sm" onClick={actualizar} disabled={trabajando} title="Trae novedades de ARCE (tarda entre 30 y 90 segundos)">
        <RefreshCw aria-hidden className={trabajando ? 'animate-spin motion-reduce:animate-none' : undefined} />
        <span className="hidden sm:inline">{trabajando ? 'Actualizando…' : 'Actualizar'}</span>
        <span className="sr-only sm:hidden">Actualizar</span>
      </Button>
    </div>
  );
}
