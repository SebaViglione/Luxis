'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { Bell, Check, FileSpreadsheet, FileText, Globe, Loader2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Escribe `texto` de a poco cuando `activo` pasa a true. Con reduced-motion lo muestra entero. */
function useEscribir(texto: string, activo: boolean, ms = 22) {
  const reducido = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!activo || reducido) return;
    const t = setInterval(() => setN((x) => (x >= texto.length ? x : x + 1)), ms);
    return () => clearInterval(t);
  }, [activo, reducido, texto, ms]);
  return reducido ? texto : texto.slice(0, n);
}

function useVisto<T extends Element>() {
  const ref = useRef<T>(null);
  const visto = useInView(ref, { once: true, amount: 0.5 });
  return [ref, visto] as const;
}

// ——— Análisis del pliego ———

const RESUMEN = 'Refacción de cubierta y baños en el Liceo n.º 3. Piden 18 ítems de obra gruesa y sanitaria, entrega en obra en 30 días, pago a 60 días.';
const RIESGOS = ['Multa 1 % diaria por atraso', 'Muestras antes de la apertura', 'Visita obligatoria el 24/10'];

export function DemoAnalisis() {
  const [ref, visto] = useVisto<HTMLDivElement>();
  const texto = useEscribir(RESUMEN, visto, 14);
  const listo = texto.length === RESUMEN.length;
  return (
    <div ref={ref} aria-hidden className="space-y-4">
      <div className="rounded-md border bg-background p-3.5">
        <p className="mb-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Resumen</p>
        <p className="min-h-[3.75rem] text-sm leading-relaxed">
          {texto}
          {!listo && <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground" />}
        </p>
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Riesgos</p>
        <div className="flex flex-wrap gap-1.5">
          {RIESGOS.map((r, i) => (
            <motion.span
              key={r}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={listo ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 380, damping: 20 }}
              className="rounded-full bg-alerta-suave px-2.5 py-0.5 text-xs text-alerta-fuerte"
            >
              {r}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ——— Chat del pliego ———

const PREGUNTA = '¿Aceptan portland de otra marca?';
const RESPUESTA = 'Sí, siempre que cumpla la norma UNIT 20 y presentes el certificado del fabricante junto con la oferta.';

export function DemoChat() {
  const [ref, visto] = useVisto<HTMLDivElement>();
  const [responder, setResponder] = useState(false);
  useEffect(() => {
    if (!visto) return;
    const t = setTimeout(() => setResponder(true), 700);
    return () => clearTimeout(t);
  }, [visto]);
  const texto = useEscribir(RESPUESTA, responder, 20);
  const listo = texto.length === RESPUESTA.length;
  return (
    <div ref={ref} aria-hidden className="flex flex-col gap-2.5">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={visto ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, ease: EASE }}
        className="max-w-[85%] self-end rounded-lg rounded-br-sm bg-foreground px-3 py-2 text-sm text-background"
      >
        {PREGUNTA}
      </motion.p>
      <div className={cn('max-w-[92%] self-start rounded-lg rounded-bl-sm border bg-background px-3 py-2 text-sm transition-opacity', responder ? 'opacity-100' : 'opacity-0')}>
        {texto}
        {listo && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="ml-1 inline-flex items-center rounded bg-primary/10 px-1.5 font-mono text-[11px] text-primary"
          >
            [pliego.pdf, p. 12]
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ——— Analizar por URL ———

const ETAPAS = ['Bajando el llamado de ARCE', 'Descargando 4 archivos del pliego', 'Extrayendo texto y planillas', 'Analizando con IA'];

export function DemoUrl() {
  const [ref, visto] = useVisto<HTMLDivElement>();
  const reducido = useReducedMotion();
  const [etapa, setEtapa] = useState(0);
  useEffect(() => {
    if (!visto || reducido) return;
    const t = setInterval(() => setEtapa((e) => (e >= ETAPAS.length + 2 ? 0 : e + 1)), 900);
    return () => clearInterval(t);
  }, [visto, reducido]);
  const actual = reducido ? ETAPAS.length : etapa;
  return (
    <div ref={ref} aria-hidden className="space-y-3">
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground">
        <Globe className="size-3.5 shrink-0" />
        <span className="truncate">comprasestatales.gub.uy/consultas/detalle/id/1186452</span>
      </div>
      <ul className="space-y-2">
        {ETAPAS.map((e, i) => {
          const hecho = i < actual;
          const enCurso = i === actual;
          return (
            <li key={e} className={cn('flex items-center gap-2.5 text-sm transition-colors duration-300', hecho || enCurso ? 'text-foreground' : 'text-muted-foreground/60')}>
              <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-full transition-colors', hecho ? 'bg-exito text-white' : 'border')}>
                {hecho ? <Check className="size-2.5" /> : enCurso ? <Loader2 className="size-3 animate-spin text-primary" /> : null}
              </span>
              {e}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ——— Onboarding desde fuentes + voz ———

const FUENTES = [
  { Icono: FileSpreadsheet, texto: 'lista-precios.xlsx' },
  { Icono: FileText, texto: 'catalogo-2026.pdf' },
  { Icono: Globe, texto: 'tubarraca.com.uy' },
];
const PERFIL = ['Portland y cal', 'Arena y pedregullo', 'Hierro', 'Sanitaria', 'Pinturas', 'Entrega: Canelones y Montevideo'];

export function DemoOnboarding() {
  const [ref, visto] = useVisto<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden className="grid gap-4 sm:grid-cols-[1fr_auto_1.3fr] sm:items-center">
      <ul className="space-y-2">
        {FUENTES.map(({ Icono, texto }, i) => (
          <motion.li
            key={texto}
            initial={{ opacity: 0, x: -12 }}
            animate={visto ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.15, duration: 0.45, ease: EASE }}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
          >
            <Icono className="size-4 text-muted-foreground" />
            <span className="truncate font-mono text-xs">{texto}</span>
          </motion.li>
        ))}
        <motion.li
          initial={{ opacity: 0, x: -12 }}
          animate={visto ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.45, duration: 0.45, ease: EASE }}
          className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground"
        >
          <Mic className="size-4 text-primary" />
          <span className="text-xs">o contalo por voz</span>
          <span className="ml-auto flex h-3 items-end gap-0.5">
            {[0, 1, 2, 3].map((b) => (
              <motion.span
                key={b}
                className="w-0.5 rounded-full bg-primary"
                animate={visto ? { height: ['30%', '100%', '45%', '80%', '30%'] } : { height: '30%' }}
                transition={{ duration: 1.1, repeat: Infinity, delay: b * 0.12, ease: 'easeInOut' }}
              />
            ))}
          </span>
        </motion.li>
      </ul>
      <motion.div
        initial={{ opacity: 0 }}
        animate={visto ? { opacity: 1 } : {}}
        transition={{ delay: 0.7 }}
        className="hidden h-px w-10 bg-primary sm:block"
      />
      <div className="rounded-md border bg-background p-3.5">
        <p className="mb-2 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">Perfil de tu barraca</p>
        <div className="flex flex-wrap gap-1.5">
          {PERFIL.map((p, i) => (
            <motion.span
              key={p}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={visto ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.9 + i * 0.1, type: 'spring', stiffness: 380, damping: 22 }}
              className="rounded-md bg-secondary px-2 py-0.5 text-xs"
            >
              {p}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ——— Calendario ———

const DIAS_MARCADOS: Record<number, { clase: string; etiqueta: string }> = {
  9: { clase: 'bg-secondary text-foreground', etiqueta: 'Consultas' },
  14: { clase: 'bg-alerta-suave text-alerta-fuerte', etiqueta: 'Visita' },
  21: { clase: 'bg-primary text-primary-foreground', etiqueta: 'Apertura' },
};

export function DemoCalendario() {
  const [ref, visto] = useVisto<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden>
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-muted-foreground">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
          const m = DIAS_MARCADOS[d];
          return (
            <motion.span
              key={d}
              initial={m ? { scale: 0.4, opacity: 0 } : false}
              animate={m && visto ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: m ? 0.2 + Object.keys(DIAS_MARCADOS).indexOf(String(d)) * 0.2 : 0, type: 'spring', stiffness: 400, damping: 18 }}
              className={cn('flex aspect-square items-center justify-center rounded text-[11px]', m ? cn(m.clase, 'font-medium') : 'text-foreground/70')}
            >
              {d}
            </motion.span>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {Object.values(DIAS_MARCADOS).map((m) => (
          <span key={m.etiqueta} className="inline-flex items-center gap-1.5">
            <span className={cn('size-2 rounded-sm', m.clase)} />{m.etiqueta}
          </span>
        ))}
      </div>
    </div>
  );
}

// ——— Avisos ———

const AVISOS = [
  'Nueva: Intendencia de Rocha pide bloques y arena · 88',
  'Cierra mañana: OSE · caños PVC sanitarios',
  'Nueva aclaración: ANEP respondió una consulta',
  'Nueva: MTOP pide hierro Ø10 · 81',
];

export function DemoAvisos() {
  const [ref, visto] = useVisto<HTMLDivElement>();
  const reducido = useReducedMotion();
  const [n, setN] = useState(1);
  useEffect(() => {
    if (!visto || reducido) return;
    const t = setInterval(() => setN((x) => (x % AVISOS.length) + 1), 1800);
    return () => clearInterval(t);
  }, [visto, reducido]);
  const lista = AVISOS.slice(0, reducido ? 3 : n).slice(-3).reverse();
  return (
    <div ref={ref} aria-hidden className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <motion.span
          key={n}
          animate={reducido ? {} : { rotate: [0, -14, 12, -8, 0] }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary" />
        </motion.span>
        <span className="font-mono text-[11px] text-muted-foreground">{n} sin leer</span>
      </div>
      <ul className="relative h-[7.5rem] space-y-1.5 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {lista.map((a) => (
            <motion.li
              key={a}
              layout
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="truncate rounded-md border bg-background px-2.5 py-1.5 text-xs"
            >
              {a}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
