'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { AlertTriangle, Mic, MicOff, SendHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { RespuestaConCitas } from './respuesta-con-citas';
import { useDictado } from './use-dictado';

const SUGERENCIAS = [
  '¿Qué documentación tengo que presentar?',
  '¿Hay visita obligatoria?',
  '¿Cuál es el plazo de entrega?',
  '¿Piden muestras o garantía?',
  '¿Cómo se cotiza, con o sin IVA?',
  '¿Qué ítems puedo ofertar y a qué precio?',
];

interface InfoPliego {
  basadoEn: 'pliego' | 'metadata';
  archivos: { nombre: string; categoria: string; parrafos: number; recortado: boolean }[];
  omitidos: string[];
  emailContacto: string | null;
}

/** Chat con el pliego de una licitación. Se monta en el tab "Chat" del detalle. */
export function ChatPliego({ idCompra }: { idCompra: string }) {
  const transporte = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat/pliego', body: { idCompra } }),
    [idCompra],
  );
  const { messages, setMessages, sendMessage, status, error, regenerate, clearError } = useChat({
    id: `pliego-${idCompra}`,
    transport: transporte,
  });

  const [info, setInfo] = useState<InfoPliego | null>(null);
  const [carga, setCarga] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [intento, setIntento] = useState(0);
  const [texto, setTexto] = useState('');
  const textoAntesDeDictar = useRef('');
  const finalRef = useRef<HTMLDivElement>(null);

  const dictado = useDictado((dictadoHastaAhora) =>
    setTexto(`${textoAntesDeDictar.current}${textoAntesDeDictar.current ? ' ' : ''}${dictadoHastaAhora}`),
  );

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/chat/pliego?idCompra=${encodeURIComponent(idCompra)}`)
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error(String(respuesta.status));
        return (await respuesta.json()) as InfoPliego & { mensajes: UIMessage[] };
      })
      .then(({ mensajes, ...datos }) => {
        if (cancelado) return;
        setInfo(datos);
        setMessages(mensajes);
        setCarga('listo');
      })
      .catch(() => !cancelado && setCarga('error'));
    return () => {
      cancelado = true;
    };
  }, [idCompra, setMessages, intento]);

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, status]);

  const ocupado = status === 'submitted' || status === 'streaming';

  const enviar = (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || ocupado) return;
    dictado.detener();
    clearError();
    void sendMessage({ text: limpio });
    setTexto('');
  };

  if (carga === 'cargando') {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando el chat">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (carga === 'error') {
    return (
      <Alert variant="destructive">
        <AlertTitle>No pudimos abrir el chat</AlertTitle>
        <AlertDescription>Revisá tu conexión y probá de nuevo.</AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCarga('cargando');
              setIntento((n) => n + 1);
            }}
          >
            Reintentar
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Chat con el pliego">
      {info?.basadoEn === 'metadata' ? (
        <Alert>
          <AlertTriangle aria-hidden />
          <AlertTitle>No tenemos el texto del pliego</AlertTitle>
          <AlertDescription>
            No pudimos descargar o leer los archivos de esta licitación. Respondo solo con los datos publicados en ARCE.
          </AlertDescription>
        </Alert>
      ) : (
        info && (
          <p className="text-xs text-muted-foreground">
            Leímos {info.archivos.length} {info.archivos.length === 1 ? 'archivo' : 'archivos'} del pliego:{' '}
            {info.archivos.map((a) => a.nombre).join(', ')}
            {info.omitidos.length > 0 && `. No entraron por largo: ${info.omitidos.join(', ')}`}.
          </p>
        )
      )}

      <div className="flex h-[min(32rem,65svh)] flex-col gap-4 overflow-y-auto rounded-md border p-3" aria-live="polite">
        {messages.length === 0 && (
          <div className="m-auto flex max-w-md flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              Preguntá lo que quieras sobre esta licitación. Cada respuesta cita el archivo y el párrafo de donde sale.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGERENCIAS.map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => enviar(s)} disabled={ocupado}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((mensaje) => {
          const contenido = mensaje.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
          if (!contenido.trim()) return null;
          return mensaje.role === 'user' ? (
            <p
              key={mensaje.id}
              className="max-w-[85%] self-end rounded-md bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground"
            >
              {contenido}
            </p>
          ) : (
            <div key={mensaje.id} className="max-w-[92%] self-start rounded-md border bg-background px-3 py-2">
              <RespuestaConCitas texto={contenido} idCompra={idCompra} />
            </div>
          );
        })}

        {status === 'submitted' && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Leyendo el pliego…
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message || 'No pudimos responder ahora.'}</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline" onClick={() => void regenerate()}>
                Reintentar
              </Button>
            </AlertAction>
          </Alert>
        )}
        <div ref={finalRef} />
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
      >
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              enviar(texto);
            }
          }}
          placeholder={dictado.escuchando ? 'Escuchando…' : 'Preguntale al pliego…'}
          aria-label="Tu pregunta"
          rows={2}
          className="min-h-0 resize-none"
        />
        {dictado.soportado && (
          <Button
            type="button"
            size="icon"
            variant={dictado.escuchando ? 'default' : 'outline'}
            aria-pressed={dictado.escuchando}
            aria-label={dictado.escuchando ? 'Dejar de dictar' : 'Dictar la pregunta'}
            onClick={() => {
              if (dictado.escuchando) return dictado.detener();
              textoAntesDeDictar.current = texto.trim();
              dictado.iniciar();
            }}
          >
            {dictado.escuchando ? <MicOff /> : <Mic />}
          </Button>
        )}
        <Button type="submit" size="icon" aria-label="Enviar" disabled={ocupado || !texto.trim()}>
          <SendHorizontal />
        </Button>
      </form>
      {dictado.error && <p className="text-xs text-destructive">{dictado.error}</p>}
    </section>
  );
}
