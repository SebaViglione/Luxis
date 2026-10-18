'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Estado = { tipo: 'inactivo' } | { tipo: 'trabajando'; texto: string; desde: number } | { tipo: 'listo'; texto: string } | { tipo: 'error'; texto: string };

export function BotonActualizar() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' });
  const [segundos, setSegundos] = useState(0);
  const trabajando = estado.tipo === 'trabajando';
  const desde = trabajando ? estado.desde : null;

  useEffect(() => {
    if (desde === null) return;
    const id = window.setInterval(() => setSegundos(Math.round((Date.now() - desde) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [desde]);

  // Sin startTransition: React 19 posterga los setState de una transición y el progreso no se vería.
  const actualizar = async () => {
    const inicio = Date.now();
    setSegundos(0);
    setEstado({ tipo: 'trabajando', texto: 'Buscando novedades en ARCE…', desde: inicio });
    try {
      // Una sola llamada: novedades de ARCE + matching de lo nuevo + avisos. Adjudicaciones y pliegos siguen en segundo plano.
      const res = await fetch('/api/ingesta/refresh?dias=2', { method: 'POST' });
      // 504: la función llegó a su tiempo máximo comparando con tus productos. Lo ya comparado quedó guardado.
      if (res.status === 504) {
        router.refresh();
        setEstado({ tipo: 'error', texto: 'Tardó más de lo esperado: ya ves lo procesado. Probá de nuevo en un rato.' });
        return;
      }
      const datos = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; aviso?: string; notificaciones?: number; vigentes?: { omitido?: boolean } };
      if (!res.ok || datos.ok === false) throw new Error(datos.error ?? `Error ${res.status}`);
      setEstado({ tipo: 'trabajando', texto: 'Mostrando novedades…', desde: inicio });
      router.refresh();
      const creadas = datos.notificaciones ?? 0;
      setEstado({ tipo: 'listo', texto: datos.aviso ?? (creadas ? `${creadas} ${creadas === 1 ? 'aviso nuevo' : 'avisos nuevos'}` : datos.vigentes?.omitido ? 'Ya estaba al día' : 'Todo al día') });
      window.setTimeout(() => setEstado((e) => (e.tipo === 'listo' ? { tipo: 'inactivo' } : e)), 6000);
    } catch (e) {
      // Sin respuesta (TypeError de red) vs. error del servidor. Si ARCE no responde, la ruta igual contesta bien con un aviso.
      setEstado({
        tipo: 'error',
        texto: e instanceof TypeError
          ? 'Se cortó la conexión. Revisá tu internet y probá de nuevo.'
          : 'No se pudo actualizar. Probá de nuevo en unos minutos.',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span role="status" aria-live="polite" className={estado.tipo === 'error' ? 'max-w-56 text-xs text-error' : 'max-w-40 truncate text-xs text-muted-foreground sm:max-w-none'}>
        {estado.tipo === 'inactivo' ? '' : estado.texto}
        {trabajando && <span className="ml-1 font-mono">{segundos} s</span>}
      </span>
      <Button variant="outline" size="sm" onClick={actualizar} disabled={trabajando} title="Trae novedades de ARCE y las compara con lo que vendés (tarda entre 10 y 30 segundos)">
        <RefreshCw aria-hidden className={trabajando ? 'animate-spin motion-reduce:animate-none' : undefined} />
        <span className="hidden sm:inline">{trabajando ? 'Buscando…' : 'Buscar novedades'}</span>
        <span className="sr-only sm:hidden">Buscar novedades</span>
      </Button>
    </div>
  );
}
