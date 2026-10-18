'use client';

import { motion, MotionConfig } from 'motion/react';
import { Braces, Check, ChevronDown } from 'lucide-react';

export type DatosConversacion = {
  pregunta: string;
  herramienta: string;
  /** Argumentos en una línea, como los manda el cliente. */
  argumentos: string;
  /** Qué encontró la herramienta, en una frase corta. */
  estado: string;
  /** La respuesta en lenguaje llano, un renglón por dato. Vacía si la base no respondió. */
  lineas: string[];
  /** El JSON recortado que recibe un sistema. Null si no hubo respuesta. */
  json: string | null;
  pie: string;
};

const CURVA = [0.22, 1, 0.36, 1] as const;
const burbuja = {
  oculto: { opacity: 0, y: 14, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: CURVA } },
};

/** Ventana de producto con una conversación real: la pregunta, la llamada a la herramienta y lo que devuelve la base. */
export function ConversacionMcp({ d }: { d: DatosConversacion }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-hidden rounded-2xl border bg-background shadow-[0_40px_80px_-40px_rgba(27,27,27,0.3)]">
        <div className="flex items-center gap-1.5 border-b bg-card px-4 py-3">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="mx-auto truncate rounded-md bg-background px-4 py-1 font-mono text-[11px] text-muted-foreground">tu asistente · conector luxis</span>
        </div>

        <motion.div
          initial="oculto"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.4 }}
          className="flex flex-col gap-3 p-4 md:p-5"
        >
          <motion.p variants={burbuja} className="max-w-[85%] self-end rounded-lg rounded-br-sm bg-foreground px-3.5 py-2 text-sm text-background">
            {d.pregunta}
          </motion.p>

          <motion.div variants={burbuja} className="max-w-[92%] self-start rounded-lg border bg-card px-3 py-2 font-mono text-[12px] leading-relaxed">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Braces aria-hidden className="size-3.5" /> llamada a la herramienta
            </p>
            <p className="mt-1 break-words">
              <span className="text-primary">{d.herramienta}</span>({d.argumentos})
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-exito">
              <Check aria-hidden className="size-3.5" /> {d.estado}
            </p>
          </motion.div>

          <motion.div variants={burbuja} className="max-w-[92%] self-start rounded-lg rounded-bl-sm border bg-background px-3.5 py-3 text-sm">
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Lo que devuelve la base</p>
            {d.lineas.length ? (
              <ul className="mt-2 space-y-1.5">
                {d.lineas.map((l) => (
                  <li key={l} className="flex items-start gap-3">
                    <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-primary" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted-foreground">La base no respondió en este momento. Probá la misma pregunta desde tu cliente.</p>
            )}
            {d.json && (
              <details className="group mt-3 border-t pt-2">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
                  <ChevronDown aria-hidden className="size-3.5 transition-transform duration-300 group-open:rotate-180" /> ver el JSON que recibe tu sistema
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-card p-3 font-mono text-[11px] leading-relaxed">{d.json}</pre>
              </details>
            )}
          </motion.div>
        </motion.div>

        <p className="border-t bg-card px-4 py-2 font-mono text-[11px] text-muted-foreground">{d.pie}</p>
      </div>
    </MotionConfig>
  );
}
