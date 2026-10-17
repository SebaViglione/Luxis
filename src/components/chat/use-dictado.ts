'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Tipos mínimos de la Web Speech API (no vienen en lib.dom de TypeScript).
interface ResultadoReconocimiento {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface EventoReconocimiento {
  readonly resultIndex: number;
  readonly results: ArrayLike<ResultadoReconocimiento>;
}
interface Reconocedor {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((evento: EventoReconocimiento) => void) | null;
  onend: (() => void) | null;
  onerror: ((evento: { error: string }) => void) | null;
}
type ConstructorReconocedor = new () => Reconocedor;

function constructorDisponible(): ConstructorReconocedor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: ConstructorReconocedor; webkitSpeechRecognition?: ConstructorReconocedor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Dictado por voz con la Web Speech API del navegador (Chrome/Edge). No usa ElevenLabs.
 * `alDictar` recibe el texto reconocido hasta el momento (incluye resultados parciales).
 */
export function useDictado(alDictar: (texto: string) => void) {
  const [soportado, setSoportado] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconocedor = useRef<Reconocedor | null>(null);
  const callback = useRef(alDictar);

  useEffect(() => {
    callback.current = alDictar;
  });

  useEffect(() => {
    // Se detecta en el cliente para no generar diferencias de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoportado(constructorDisponible() !== null);
    return () => reconocedor.current?.stop();
  }, []);

  const detener = useCallback(() => reconocedor.current?.stop(), []);

  const iniciar = useCallback(() => {
    const Ctor = constructorDisponible();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = 'es-UY';
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (evento) => {
      let texto = '';
      for (let i = 0; i < evento.results.length; i++) texto += evento.results[i][0].transcript;
      callback.current(texto.trim());
    };
    r.onerror = (evento) => {
      setError(evento.error === 'not-allowed' ? 'Permití el uso del micrófono para dictar.' : 'No pudimos escucharte. Probá de nuevo.');
    };
    r.onend = () => setEscuchando(false);
    reconocedor.current = r;
    setError(null);
    setEscuchando(true);
    r.start();
  }, []);

  return { soportado, escuchando, error, iniciar, detener };
}
