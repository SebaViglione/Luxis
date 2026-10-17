'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from 'ai';
import { Check, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { PerfilEmpresa } from '@/lib/types';
import { MAX_PREGUNTAS_ENTREVISTA } from '@/server/onboarding/constantes';
import type { ResultadoGuardarPerfil } from '@/server/onboarding/tipos';

// Primer mensaje que dispara la entrevista; no se muestra en la conversación.
const MENSAJE_INICIO = 'Hola, empecemos.';
const MENSAJE_TERMINAR = 'Listo, con eso alcanza por ahora.';

interface PasoEntrevistaProps {
  perfil: PerfilEmpresa;
  onListo: (perfil: PerfilEmpresa) => void;
  onSaltar: () => void;
  /** Acciones extra en el encabezado (ej. entrevista por voz). */
  acciones?: React.ReactNode;
}

export function PasoEntrevista({ perfil, onListo, onSaltar, acciones }: PasoEntrevistaProps) {
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/onboarding/entrevista' }),
  });
  const [texto, setTexto] = useState('');
  const iniciado = useRef(false);
  const finalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void sendMessage({ text: MENSAJE_INICIO });
  }, [sendMessage]);

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, status]);

  // Cuando la IA guardó el perfil y terminó de despedirse, pasamos a la revisión (una sola vez).
  const guardado = buscarPerfilGuardado(messages);
  const alListo = useRef(onListo);
  useEffect(() => {
    alListo.current = onListo;
  });
  useEffect(() => {
    if (!guardado || status !== 'ready') return;
    const espera = setTimeout(() => alListo.current(guardado), 1500);
    return () => clearTimeout(espera);
  }, [guardado, status]);

  const ocupado = status === 'submitted' || status === 'streaming';
  const preguntas = messages.filter((m) => m.role === 'assistant').length;
  const visibles = messages.filter((m, i) => !(i === 0 && m.role === 'user' && textoDe(m) === MENSAJE_INICIO));

  const enviar = (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || ocupado || guardado) return;
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
        <CardAction className="flex items-center gap-2">
          {acciones}
          <Badge variant="outline" className="font-mono tabular-nums">
            {Math.min(preguntas, MAX_PREGUNTAS_ENTREVISTA)}/{MAX_PREGUNTAS_ENTREVISTA}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="flex h-[min(28rem,60svh)] flex-col gap-3 overflow-y-auto rounded-md border bg-muted/30 p-3" aria-live="polite">
          {perfil.productos.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Ya tenemos {perfil.productos.length} productos de tus documentos. Solo preguntamos lo que falta.
            </p>
          )}
          {visibles.map((mensaje) => (
            <Mensaje key={mensaje.id} mensaje={mensaje} />
          ))}
          {status === 'submitted' && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Luxis está escribiendo…
            </p>
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
          <div ref={finalRef} />
        </div>

        <form
          className="mt-3 flex items-end gap-2"
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
            className="min-h-0 resize-none"
            disabled={Boolean(guardado)}
          />
          <Button type="submit" size="icon" aria-label="Enviar" disabled={ocupado || !texto.trim() || Boolean(guardado)}>
            <SendHorizontal />
          </Button>
        </form>
      </CardContent>

      <CardFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onSaltar} disabled={ocupado}>
          Saltar y revisar el perfil
        </Button>
        <Button variant="outline" onClick={() => enviar(MENSAJE_TERMINAR)} disabled={ocupado || preguntas === 0 || Boolean(guardado)}>
          Terminar entrevista
        </Button>
      </CardFooter>
    </Card>
  );
}

function Mensaje({ mensaje }: { mensaje: UIMessage }) {
  const esUsuario = mensaje.role === 'user';
  return (
    <div className={cn('flex flex-col gap-1', esUsuario ? 'items-end' : 'items-start')}>
      {mensaje.parts.map((parte, i) => {
        if (parte.type === 'text' && parte.text.trim()) {
          return (
            <p
              key={i}
              className={cn(
                'max-w-[85%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap',
                esUsuario ? 'bg-primary text-primary-foreground' : 'border bg-background',
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
  );
}

function textoDe(mensaje: UIMessage) {
  return mensaje.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
}

function buscarPerfilGuardado(mensajes: UIMessage[]): PerfilEmpresa | null {
  for (const mensaje of mensajes) {
    for (const parte of mensaje.parts) {
      if (isToolUIPart(parte) && getToolName(parte) === 'guardar_perfil' && parte.state === 'output-available') {
        return (parte.output as ResultadoGuardarPerfil).perfil;
      }
    }
  }
  return null;
}
