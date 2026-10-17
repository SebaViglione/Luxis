'use client';

import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Check, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
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
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
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
      if (!message.trim()) return;
      transcript.current.push({ rol: role === 'user' ? 'empresa' : 'luxis', texto: message });
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
    montado.current = true;
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

  if (etapa === 'error') {
    return (
      <div className="flex flex-col gap-3">
        <Alert>
          <MicOff aria-hidden />
          <AlertTitle>{error}</AlertTitle>
          <AlertDescription>La entrevista por chat funciona igual y no perdés nada de lo que ya cargaste.</AlertDescription>
        </Alert>
        <Button onClick={onCerrar}>Volver al chat</Button>
      </div>
    );
  }

  if (etapa === 'procesando') {
    return (
      <p className="flex items-center gap-2 py-6 text-sm" aria-live="polite">
        <Spinner /> {progreso ?? 'Pasando la conversación a tu perfil…'}
      </p>
    );
  }

  const conectado = conversacion.status === 'connected';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <span className="flex items-center gap-2 text-sm">
          {conectado ? (
            <span
              aria-hidden
              className={cn('size-2.5 rounded-full', conversacion.isSpeaking ? 'animate-pulse bg-primary' : 'bg-foreground/60')}
            />
          ) : (
            <Spinner />
          )}
          {!conectado ? 'Conectando…' : conversacion.isSpeaking ? 'Luxis está hablando' : 'Te escucho'}
        </span>
        <span
          className={cn('font-mono text-sm tabular-nums', segundos >= AVISO_FIN_S && 'text-destructive')}
          aria-label="Duración de la llamada"
        >
          {formatear(segundos)} / {formatear(DURACION_MAXIMA_S)}
        </span>
      </div>

      <div className="flex max-h-56 flex-col gap-2 overflow-y-auto text-sm" aria-live="polite">
        {lineas.length === 0 && <p className="text-muted-foreground">Cuando conecte, Luxis te saluda y te hace la primera pregunta.</p>}
        {lineas.map((l, i) => (
          <p key={i} className={cn(l.rol === 'empresa' && 'text-muted-foreground')}>
            <span className="font-medium text-foreground">{l.rol === 'luxis' ? 'Luxis' : 'Vos'}:</span> {l.texto}
          </p>
        ))}
      </div>

      <Button
        variant="destructive"
        onClick={() => {
          endSession();
          void procesarTranscript();
        }}
      >
        {lineas.some((l) => l.rol === 'empresa') ? <Check /> : <PhoneOff />}
        Terminar y armar mi perfil
      </Button>
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
