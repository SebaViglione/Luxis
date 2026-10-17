'use client';

import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Check, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { BolaVoz, type EstadoBola } from '@/components/marca/bola-voz';
import { extraerDesdeFuentes } from '@/components/onboarding/leer-eventos';
import { cn } from '@/lib/utils';
import type { PerfilEmpresa } from '@/lib/types';
import type { EventoExtraccion } from '@/server/onboarding/tipos';

const DURACION_MAXIMA_S = 4 * 60;
const AVISO_FIN_S = DURACION_MAXIMA_S - 30;
const FALLBACK = 'Voz no disponible, seguimos por chat.';

interface Linea {
  rol: 'empresa' | 'luxis';
  texto: string;
}

/** Botón "Hablar con Luxis": entrevista por voz con ElevenLabs que termina en el mismo perfil que el chat. */
export function BotonEntrevistaVoz({ perfil, onPerfil }: { perfil: PerfilEmpresa; onPerfil: (perfil: PerfilEmpresa) => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setAbierto(true)}>
        <Mic /> Hablar con Luxis
      </Button>
      <Dialog open={abierto} onOpenChange={(abrir) => !abrir && setAbierto(false)}>
        <DialogContent
          showCloseButton={false}
          className="h-[100svh] max-h-[100svh] max-w-none grid-rows-[auto_1fr] gap-0 rounded-none bg-background p-0 sm:h-[44rem] sm:max-h-[calc(100svh-2rem)] sm:max-w-md sm:rounded-2xl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Entrevista por voz</DialogTitle>
            <DialogDescription>Hablá como en una llamada. Máximo 4 minutos; después revisás todo por escrito.</DialogDescription>
          </DialogHeader>
          {abierto && (
            <ConversationProvider>
              <SesionVoz
                perfil={perfil}
                onCerrar={() => setAbierto(false)}
                onPerfil={(p) => {
                  setAbierto(false);
                  onPerfil(p);
                }}
              />
            </ConversationProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

type Etapa = 'preparando' | 'conversando' | 'procesando' | 'error';

function SesionVoz({
  perfil,
  onCerrar,
  onPerfil,
}: {
  perfil: PerfilEmpresa;
  onCerrar: () => void;
  onPerfil: (perfil: PerfilEmpresa) => void;
}) {
  const [etapa, setEtapa] = useState<Etapa>('preparando');
  const [error, setError] = useState<string | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [segundos, setSegundos] = useState(0);
  const [progreso, setProgreso] = useState<string | null>(null);
  const transcript = useRef<Linea[]>([]);
  const terminado = useRef(false);
  const montado = useRef(true);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);

  const fallar = useCallback((mensaje: string) => {
    terminado.current = true;
    if (reloj.current) clearInterval(reloj.current);
    if (!montado.current) return;
    setError(mensaje);
    setEtapa('error');
  }, []);

  const procesarTranscript = useCallback(async () => {
    if (terminado.current) return;
    terminado.current = true;
    if (reloj.current) clearInterval(reloj.current);

    if (!transcript.current.some((l) => l.rol === 'empresa')) {
      fallar('No llegamos a conversar. Seguimos por chat.');
      return;
    }
    if (!montado.current) return;
    setEtapa('procesando');

    const texto = [
      'Transcripción de la entrevista por voz con el dueño o encargado de la empresa:',
      ...transcript.current.map((l) => `${l.rol === 'luxis' ? 'Luxis' : 'Empresa'}: ${l.texto}`),
    ].join('\n');
    const formData = new FormData();
    formData.append('texto', texto);

    const resultado: { perfil?: PerfilEmpresa } = {};
    await extraerDesdeFuentes(formData, (evento: EventoExtraccion) => {
      if (evento.tipo === 'progreso' && montado.current) setProgreso(evento.mensaje);
      if (evento.tipo === 'listo') resultado.perfil = evento.perfil;
      if (evento.tipo === 'error') fallar(`${evento.mensaje} Seguimos por chat.`);
    });
    if (resultado.perfil && montado.current) onPerfil(resultado.perfil);
  }, [fallar, onPerfil]);

  const conversacion = useConversation({
    onMessage: ({ message, role }) => {
      // Las voces expresivas de ElevenLabs agregan etiquetas de emoción ("[happy]") al texto del agente.
      const texto = message.replace(/\[[a-z][a-z _-]*\]\s*/gi, '').trim();
      if (!texto) return;
      transcript.current.push({ rol: role === 'user' ? 'empresa' : 'luxis', texto });
      if (montado.current) setLineas([...transcript.current]);
    },
    onError: (mensaje) => {
      console.error('[voz]', mensaje);
      fallar(FALLBACK);
    },
    onDisconnect: () => void procesarTranscript(),
  });
  const { startSession, endSession } = conversacion;

  useEffect(() => {
    // En desarrollo (StrictMode) el efecto corre dos veces: la limpieza del primero marca todo como
    // terminado, así que el segundo arranca de cero.
    montado.current = true;
    terminado.current = false;
    let cancelado = false;

    (async () => {
      try {
        const microfono = await navigator.mediaDevices.getUserMedia({ audio: true });
        microfono.getTracks().forEach((t) => t.stop());
      } catch {
        fallar('No pudimos usar el micrófono. Seguimos por chat.');
        return;
      }

      let token: string;
      try {
        const respuesta = await fetch('/api/voz/token', { cache: 'no-store' });
        const cuerpo = (await respuesta.json()) as { token?: string };
        if (!respuesta.ok || !cuerpo.token) throw new Error('sin token');
        token = cuerpo.token;
      } catch {
        fallar(FALLBACK);
        return;
      }
      if (cancelado) return;

      startSession({
        conversationToken: token,
        connectionType: 'webrtc',
        dynamicVariables: {
          perfil_conocido: resumirPerfil(perfil),
          campos_faltantes: perfil.camposFaltantes.join('; ') || 'nada importante',
        },
      });
      setEtapa('conversando');
      reloj.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    })();

    return () => {
      cancelado = true;
      montado.current = false;
      terminado.current = true;
      if (reloj.current) clearInterval(reloj.current);
      endSession();
    };
    // Se inicia una sola vez al abrir el diálogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Corte automático a los 4 minutos para cuidar los minutos del plan.
  useEffect(() => {
    if (segundos >= DURACION_MAXIMA_S && etapa === 'conversando') endSession();
  }, [segundos, etapa, endSession]);

  const conectado = conversacion.status === 'connected';
  const estadoBola: EstadoBola =
    etapa === 'procesando' ? 'procesando' : !conectado ? 'conectando' : conversacion.isSpeaking ? 'hablando' : 'escuchando';
  // La bola sigue a quien habla: la voz de Luxis o el micrófono.
  const leerVolumen = () => (conversacion.isSpeaking ? conversacion.getOutputVolume() : conversacion.getInputVolume());
  const ultima = lineas.at(-1);
  const hablo = lineas.some((l) => l.rol === 'empresa');

  return (
    <div className="contents">
      {/* Barra superior */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Button variant="ghost" size="sm" className="rounded-full" onClick={etapa === 'error' ? onCerrar : () => { endSession(); onCerrar(); }}>
          {etapa === 'error' ? 'Volver' : 'Cancelar'}
        </Button>
        <p className="text-sm font-medium">Entrevista por voz</p>
        <span
          className={cn('min-w-16 text-right font-mono text-xs text-muted-foreground tabular-nums', segundos >= AVISO_FIN_S && 'text-destructive')}
          aria-label="Duración de la llamada"
        >
          {formatear(segundos)} / {formatear(DURACION_MAXIMA_S)}
        </span>
      </div>

      <div className="flex min-h-0 flex-col items-center px-6 pt-10 pb-6">
        {etapa === 'error' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary">
              <MicOff aria-hidden className="size-6 text-muted-foreground" />
            </span>
            <div className="space-y-2">
              <p className="text-lg font-semibold tracking-tight">{error}</p>
              <p className="text-sm text-muted-foreground">La entrevista por chat funciona igual y no perdés nada de lo que ya cargaste.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col items-center justify-center">
              <BolaVoz estado={estadoBola} leerVolumen={leerVolumen} className="size-52 sm:size-56" />
              <p className="mt-10 text-xl font-semibold tracking-tight">Luxis</p>
              <p className="mt-1 flex h-5 items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                {etapa === 'procesando' ? (
                  <><Spinner /> {progreso ?? 'Pasando la conversación a tu perfil…'}</>
                ) : !conectado ? (
                  <><Spinner /> Conectando…</>
                ) : conversacion.isSpeaking ? (
                  'Está hablando'
                ) : (
                  'Te escucho'
                )}
              </p>
            </div>
            {/* Subtítulo: la última frase, con alto fijo para que nada salte */}
            <div className="flex h-20 w-full items-start justify-center text-center" aria-live="polite">
              {etapa !== 'procesando' && (
                <p key={lineas.length} className="line-clamp-3 max-w-sm animate-in text-sm leading-relaxed duration-500 fade-in-0">
                  {ultima ? (
                    <><span className="font-medium">{ultima.rol === 'luxis' ? 'Luxis' : 'Vos'}:</span> <span className="text-muted-foreground">{ultima.texto}</span></>
                  ) : (
                    <span className="text-muted-foreground">Cuando conecte, Luxis te saluda y te hace la primera pregunta.</span>
                  )}
                </p>
              )}
            </div>
          </>
        )}

        {etapa === 'error' ? (
          <Button size="lg" className="h-12 w-full max-w-sm rounded-full text-base" onClick={onCerrar}>
            Volver al chat
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={etapa === 'procesando'}
            className="h-12 w-full max-w-sm rounded-full text-base"
            variant={hablo ? 'default' : 'outline'}
            onClick={() => {
              endSession();
              void procesarTranscript();
            }}
          >
            {hablo ? <Check /> : <PhoneOff />}
            Terminar y armar mi perfil
          </Button>
        )}
      </div>
    </div>
  );
}

function formatear(segundos: number) {
  const s = Math.min(segundos, DURACION_MAXIMA_S);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function resumirPerfil(perfil: PerfilEmpresa): string {
  const partes = [`Empresa ${perfil.nombre}${perfil.departamento ? ` de ${perfil.departamento}` : ''}.`];
  if (perfil.productos.length) {
    const productos = perfil.productos.slice(0, 25).map((p) => `${p.nombre} (${p.unidad})`);
    partes.push(`Vende: ${productos.join(', ')}${perfil.productos.length > 25 ? ' y otros' : ''}.`);
  }
  if (perfil.zonasEntrega.length) partes.push(`Entrega en: ${perfil.zonasEntrega.join(', ')}.`);
  if (perfil.capacidadNotas) partes.push(`Capacidad: ${perfil.capacidadNotas}.`);
  const conocidos = perfil.documentacion.filter((d) => d.estado !== 'desconocido');
  if (conocidos.length) partes.push(`Documentación: ${conocidos.map((d) => `${d.tipo} ${d.estado.replace('_', ' ')}`).join(', ')}.`);
  return partes.join(' ');
}
