'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from 'ai';
import { Check, SendHorizontal } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { LogoMarca } from '@/components/marca/logo';
import { cn } from '@/lib/utils';
import type { PerfilEmpresa } from '@/lib/types';
import { MAX_PREGUNTAS_ENTREVISTA } from '@/server/onboarding/constantes';
import type { ResultadoGuardarPerfil } from '@/server/onboarding/tipos';
import { extraerDesdeFuentes } from './leer-eventos';

// Primer mensaje que dispara la entrevista; no se muestra en la conversación.
const MENSAJE_INICIO = 'Hola, empecemos.';
const MENSAJE_TERMINAR = 'Listo, con eso alcanza por ahora.';

interface PasoEntrevistaProps {
  perfil: PerfilEmpresa;
  onListo: (perfil: PerfilEmpresa, extraido?: Partial<PerfilEmpresa>) => void;
  onSaltar: () => void;
  /** Acciones extra en el encabezado (ej. entrevista por voz). */
  acciones?: React.ReactNode;
}

export function PasoEntrevista({ perfil, onListo, onSaltar, acciones }: PasoEntrevistaProps) {
  const alListo = useRef(onListo);
  useEffect(() => {
    alListo.current = onListo;
  });

  // Respaldo: si se pasó del máximo de preguntas o pidió terminar y el modelo no llamó a
  // guardar_perfil, armamos el perfil desde la transcripción (mismo camino que la entrevista por voz).
  const pidioTerminar = useRef(false);
  const [cierre, setCierre] = useState<{ estado: 'no' | 'procesando' | 'error'; mensaje?: string }>({ estado: 'no' });

  const cerrarConTranscript = useCallback(async (mensajes: UIMessage[]) => {
    setCierre({ estado: 'procesando', mensaje: 'Armando tu perfil con lo que charlamos…' });
    const formData = new FormData();
    formData.append('texto', transcriptoDe(mensajes.filter((m, i) => !(i === 0 && textoDe(m) === MENSAJE_INICIO))));
    const resultado: { perfil?: PerfilEmpresa; extraido?: Partial<PerfilEmpresa> } = {};
    await extraerDesdeFuentes(formData, (evento) => {
      if (evento.tipo === 'progreso') setCierre({ estado: 'procesando', mensaje: evento.mensaje });
      if (evento.tipo === 'listo') {
        resultado.perfil = evento.perfil;
        resultado.extraido = evento.extraido;
      }
      if (evento.tipo === 'error') setCierre({ estado: 'error', mensaje: evento.mensaje });
    });
    if (resultado.perfil) alListo.current(resultado.perfil, resultado.extraido);
  }, []);

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/onboarding/entrevista' }),
    onFinish: ({ message, messages: todos, isAbort, isError, isDisconnect }) => {
      if (isAbort || isError || isDisconnect || buscarPerfilGuardado(todos)) return;
      const turnos = todos.filter((m) => m.role === 'assistant').length;
      // Si el modelo confirmó datos sin preguntar nada más ni guardar, la entrevista terminó de hecho.
      const sinPregunta = turnos > 1 && !/[?]|contame|decime|indicame|pasame/i.test(textoDe(message));
      if (turnos > MAX_PREGUNTAS_ENTREVISTA || pidioTerminar.current || sinPregunta) void cerrarConTranscript(todos);
    },
  });
  const [texto, setTexto] = useState('');
  const finalRef = useRef<HTMLDivElement>(null);

  // useChat corta la petición en curso al desmontarse; en desarrollo (StrictMode) el montaje se
  // simula dos veces, así que diferimos el primer mensaje y lo cancelamos en la limpieza.
  useEffect(() => {
    const inicio = setTimeout(() => void sendMessage({ text: MENSAJE_INICIO }), 0);
    return () => clearTimeout(inicio);
  }, [sendMessage]);

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, status]);

  // Cuando la IA guardó el perfil y terminó de despedirse, pasamos a la revisión (una sola vez).
  const guardado = buscarPerfilGuardado(messages);
  useEffect(() => {
    if (!guardado || status !== 'ready') return;
    const espera = setTimeout(() => alListo.current(guardado.perfil, guardado.extraido), 1500);
    return () => clearTimeout(espera);
  }, [guardado, status]);

  const ocupado = status === 'submitted' || status === 'streaming';
  const preguntas = messages.filter((m) => m.role === 'assistant').length;
  const visibles = messages.filter((m, i) => !(i === 0 && m.role === 'user' && textoDe(m) === MENSAJE_INICIO));

  const enviar = (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || ocupado || guardado || cierre.estado !== 'no') return;
    void sendMessage({ text: limpio });
    setTexto('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contanos de tu barraca</CardTitle>
        <CardDescription>
          Te hacemos unas preguntas cortas para completar lo que falta. Respondé como en WhatsApp; si no sabés algo, decí
          “no sé” y seguimos.
        </CardDescription>
        <CardAction className="flex items-center gap-2">{acciones}</CardAction>
        {/* Progreso de la entrevista */}
        <div className="col-span-full mt-3 flex items-center gap-3">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${(Math.min(preguntas, MAX_PREGUNTAS_ENTREVISTA) / MAX_PREGUNTAS_ENTREVISTA) * 100}%` }}
            />
          </span>
          <Badge variant="outline" className="font-mono tabular-nums">
            {Math.min(preguntas, MAX_PREGUNTAS_ENTREVISTA)}/{MAX_PREGUNTAS_ENTREVISTA}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex h-[min(30rem,60svh)] flex-col gap-4 overflow-y-auto rounded-xl border bg-muted/30 p-4" aria-live="polite">
          {perfil.productos.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Ya tenemos {perfil.productos.length} productos de tus documentos. Solo preguntamos lo que falta.
            </p>
          )}
          {visibles.map((mensaje) => (
            <Mensaje key={mensaje.id} mensaje={mensaje} />
          ))}
          {status === 'submitted' && (
            <div className="flex items-end gap-2" role="status" aria-label="Luxis está escribiendo">
              <AvatarLuxis />
              <span className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-background px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message || 'Se cortó la conexión con la IA.'}</AlertDescription>
              <AlertAction>
                <Button size="sm" variant="outline" onClick={() => void regenerate()}>
                  Reintentar
                </Button>
              </AlertAction>
            </Alert>
          )}
          {cierre.estado === 'procesando' && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> {cierre.mensaje}
            </p>
          )}
          {cierre.estado === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{cierre.mensaje}</AlertDescription>
              <AlertAction>
                <Button size="sm" variant="outline" onClick={() => void cerrarConTranscript(messages)}>
                  Reintentar
                </Button>
              </AlertAction>
            </Alert>
          )}
          <div ref={finalRef} />
        </div>

        <form
          className="mt-3 flex items-end gap-2 rounded-2xl border bg-background p-2 transition-colors focus-within:border-primary/50"
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
            placeholder={guardado ? 'Entrevista terminada' : 'Escribí tu respuesta…'}
            aria-label="Tu respuesta"
            rows={2}
            className="min-h-0 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            disabled={Boolean(guardado) || cierre.estado !== 'no'}
          />
          <Button type="submit" size="icon" className="size-9 shrink-0 rounded-full" aria-label="Enviar" disabled={ocupado || !texto.trim() || Boolean(guardado)}>
            <SendHorizontal />
          </Button>
        </form>
      </CardContent>

      <CardFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onSaltar} disabled={ocupado}>
          Saltar y revisar el perfil
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            pidioTerminar.current = true;
            enviar(MENSAJE_TERMINAR);
          }}
          disabled={ocupado || preguntas === 0 || Boolean(guardado) || cierre.estado !== 'no'}
        >
          Terminar entrevista
        </Button>
      </CardFooter>
    </Card>
  );
}

function Mensaje({ mensaje }: { mensaje: UIMessage }) {
  const esUsuario = mensaje.role === 'user';
  return (
    <div className={cn('flex animate-in items-end gap-2 duration-300 fade-in-0 slide-in-from-bottom-1', esUsuario ? 'flex-row-reverse' : 'flex-row')}>
      {!esUsuario && <AvatarLuxis />}
      <div className={cn('flex min-w-0 flex-col gap-1', esUsuario ? 'items-end' : 'items-start')}>
      {mensaje.parts.map((parte, i) => {
        if (parte.type === 'text' && parte.text.trim()) {
          return (
            <p
              key={i}
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                esUsuario ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-background',
              )}
            >
              {parte.text}
            </p>
          );
        }
        if (isToolUIPart(parte) && getToolName(parte) === 'guardar_perfil') {
          if (parte.state === 'output-available') {
            return (
              <p key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4" aria-hidden /> Perfil guardado
              </p>
            );
          }
          if (parte.state === 'output-error') {
            return (
              <p key={i} className="text-sm text-destructive">
                No pudimos guardar el perfil: {parte.errorText}
              </p>
            );
          }
          return (
            <p key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Guardando tu perfil…
            </p>
          );
        }
        return null;
      })}
      </div>
    </div>
  );
}

function AvatarLuxis() {
  return (
    <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
      <LogoMarca className="size-3.5" />
    </span>
  );
}

function transcriptoDe(mensajes: UIMessage[]) {
  return [
    'Transcripción de la entrevista por chat con el dueño o encargado de la empresa:',
    ...mensajes.map((m) => `${m.role === 'assistant' ? 'Luxis' : 'Empresa'}: ${textoDe(m)}`).filter((l) => !l.endsWith(': ')),
  ].join('\n');
}

function textoDe(mensaje: UIMessage) {
  return mensaje.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
}

function buscarPerfilGuardado(mensajes: UIMessage[]): ResultadoGuardarPerfil | null {
  for (const mensaje of mensajes) {
    for (const parte of mensaje.parts) {
      if (isToolUIPart(parte) && getToolName(parte) === 'guardar_perfil' && parte.state === 'output-available') {
        return parte.output as ResultadoGuardarPerfil;
      }
    }
  }
  return null;
}
