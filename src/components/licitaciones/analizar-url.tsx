'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Circle, CircleCheck, Info, LoaderCircle, ScanSearch, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ETAPAS = [
  { id: 'buscando', texto: 'Buscando en ARCE' },
  { id: 'archivos', texto: 'Leyendo el pliego' },
  { id: 'analizando', texto: 'Analizando con IA' },
  { id: 'matching', texto: 'Comparando con tus productos' },
  { id: 'precios', texto: 'Precios históricos' },
] as const;

type EstadoEtapa = 'pendiente' | 'en_curso' | 'ok';
// 'aviso' es informativo (p. ej. la URL era una adjudicación y se completó desde la compra original): no cambia la etapa.
type Evento = { etapa?: string; estado?: 'en_curso' | 'ok' | 'aviso'; mensaje?: string; listo?: boolean; idCompra?: string; error?: string };

export function AnalizarUrl() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [estados, setEstados] = useState<Record<string, EstadoEtapa> | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [notas, setNotas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enCurso, setEnCurso] = useState(false);

  const aplicar = (ev: Evento) => {
    if (ev.error) throw new Error(ev.error);
    if (ev.estado === 'aviso') {
      if (ev.mensaje) setNotas((prev) => [...prev, ev.mensaje!]);
      return;
    }
    if (ev.etapa && ev.estado) {
      setEstados((prev) => ({ ...prev, [ev.etapa!]: ev.estado! }));
      if (ev.mensaje) setMensaje(ev.mensaje);
    }
    if (ev.listo && ev.idCompra) {
      setMensaje('Listo. Abriendo la licitación…');
      router.push(`/licitaciones/${encodeURIComponent(ev.idCompra)}`);
    }
  };

  const analizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || enCurso) return;
    setError(null);
    setNotas([]);
    setEnCurso(true);
    setEstados(Object.fromEntries(ETAPAS.map((x) => [x.id, 'pendiente'])));
    setMensaje('Conectando…');
    try {
      const res = await fetch('/api/licitaciones/analizar-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 401 ? 'Tu sesión venció. Volvé a ingresar.' : 'No se pudo iniciar el análisis.');
      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      let resto = '';
      for (;;) {
        const { value, done } = await lector.read();
        resto += decoder.decode(value, { stream: !done });
        const lineas = resto.split('\n');
        resto = lineas.pop() ?? '';
        for (const l of lineas) if (l.trim()) aplicar(JSON.parse(l) as Evento);
        if (done) break;
      }
      if (resto.trim()) aplicar(JSON.parse(resto) as Evento);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal al analizar.');
    } finally {
      setEnCurso(false);
    }
  };

  return (
    <section aria-labelledby="titulo-analizar" className="space-y-3 rounded-md border bg-card p-4">
      <div>
        <h2 id="titulo-analizar" className="text-base">Analizar una licitación puntual</h2>
        <p className="text-sm text-muted-foreground">Pegá el link de un llamado de comprasestatales.gub.uy o su número. Tarda entre 20 segundos y un minuto y medio.</p>
      </div>
      <form onSubmit={analizar} className="flex flex-col gap-2 sm:flex-row">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} disabled={enCurso} aria-label="URL o ID de ARCE"
          placeholder="https://www.comprasestatales.gub.uy/consultas/detalle/mostrar-llamado/1/id/1375519" className="flex-1" />
        <Button type="submit" disabled={enCurso || !url.trim()}>
          <ScanSearch aria-hidden /> {enCurso ? 'Analizando…' : 'Analizar'}
        </Button>
      </form>
      {estados && (
        <div aria-live="polite" className="space-y-2">
          <ol className="flex flex-wrap gap-x-4 gap-y-1.5">
            {ETAPAS.map((x) => {
              const est = estados[x.id] ?? 'pendiente';
              const Icono = est === 'ok' ? CircleCheck : est === 'en_curso' ? LoaderCircle : Circle;
              return (
                <li key={x.id} className={cn('flex items-center gap-1.5 text-sm', est === 'pendiente' ? 'text-muted-foreground' : 'text-foreground')}>
                  <Icono aria-hidden className={cn('size-4', est === 'ok' && 'text-exito', est === 'en_curso' && 'animate-spin text-primary motion-reduce:animate-none')} />
                  {x.texto}
                  <span className="sr-only">{est === 'ok' ? '(listo)' : est === 'en_curso' ? '(en curso)' : '(pendiente)'}</span>
                </li>
              );
            })}
          </ol>
          {notas.map((n) => (
            <p key={n} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" /> {n}
            </p>
          ))}
          {!error && mensaje && <p className="text-sm text-muted-foreground">{mensaje}</p>}
        </div>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-error">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}
    </section>
  );
}
