'use client';

import { useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

export type EstadoBola = 'conectando' | 'escuchando' | 'hablando' | 'procesando';

type BolaVozProps = {
  estado: EstadoBola;
  /** Volumen actual entre 0 y 1; se lee en cada cuadro. */
  leerVolumen?: () => number;
  className?: string;
};

// La bola de voz de Luxis: una esfera ladrillo y arena con nubes que giran adentro.
// El volumen la agranda, acelera las nubes y enciende el halo. Es el único degradé de la marca
// (docs/07-marca.md §8).
export function BolaVoz({ estado, leerVolumen, className }: BolaVozProps) {
  const reducido = useReducedMotion();
  const volumen = useMotionValue(0);
  const suave = useSpring(volumen, { stiffness: 260, damping: 22, mass: 0.6 });
  const angulo = useMotionValue(0);
  const t = useRef(0);

  useAnimationFrame((_, delta) => {
    t.current += delta / 1000;
    let v = 0;
    if (estado === 'escuchando' || estado === 'hablando') {
      // El volumen crudo es chico y nervioso: se comprime para que la bola respire y no tiemble.
      v = Math.min(1, Math.pow(Math.max(0, leerVolumen?.() ?? 0) * 2.2, 0.7));
    } else if (estado === 'conectando') {
      v = 0.12 + Math.sin(t.current * 2.4) * 0.08;
    }
    volumen.set(reducido ? 0 : v);
    const velocidad = estado === 'procesando' ? 90 : 14 + v * 120;
    angulo.set((angulo.get() + (reducido ? 0 : velocidad * (delta / 1000))) % 360);
  });

  const escala = useTransform(suave, [0, 1], [1, 1.14]);
  const halo = useTransform(suave, [0, 1], [0.94, 1.32]);
  const haloOpacidad = useTransform(suave, [0, 1], [0, 0.55]);
  const giroInverso = useTransform(angulo, (a) => -a * 1.4);
  const giroLento = useTransform(angulo, (a) => a * 0.6);

  return (
    <div className={cn('relative grid size-56 place-items-center', className)} aria-hidden>
      {/* Halo que crece con la voz */}
      <motion.div style={{ scale: halo, opacity: haloOpacidad }} className="absolute inset-0 rounded-full bg-primary/40 blur-2xl" />
      <motion.div
        style={{ scale: escala }}
        animate={{ opacity: estado === 'procesando' ? 0.85 : 1, filter: estado === 'conectando' ? 'saturate(0.6)' : 'saturate(1)' }}
        transition={{ duration: 0.6 }}
        className="relative size-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_30%,#F6D3C2_0%,#E07A55_38%,#C4502B_62%,#8E3519_100%)] shadow-[0_30px_80px_-30px_rgba(196,80,43,0.65),inset_0_-12px_40px_rgba(110,40,18,0.35)]"
      >
        {/* Nubes claras */}
        <motion.div
          style={{ rotate: angulo }}
          className="absolute -inset-1/4 bg-[radial-gradient(ellipse_at_30%_35%,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0)_38%),radial-gradient(ellipse_at_72%_65%,rgba(247,246,242,0.7)_0%,rgba(247,246,242,0)_34%)] blur-md"
        />
        {/* Corriente ladrillo profunda, en sentido contrario */}
        <motion.div
          style={{ rotate: giroInverso }}
          className="absolute -inset-1/4 bg-[radial-gradient(ellipse_at_65%_25%,rgba(142,53,25,0.55)_0%,rgba(142,53,25,0)_40%),radial-gradient(ellipse_at_25%_75%,rgba(224,122,85,0.8)_0%,rgba(224,122,85,0)_42%)] blur-lg"
        />
        {/* Velo arena lento */}
        <motion.div
          style={{ rotate: giroLento }}
          className="absolute -inset-1/4 bg-[conic-gradient(from_90deg,rgba(246,211,194,0)_0deg,rgba(246,211,194,0.55)_80deg,rgba(246,211,194,0)_160deg,rgba(255,255,255,0.35)_250deg,rgba(246,211,194,0)_330deg)] mix-blend-soft-light blur-xl"
        />
        {/* Brillo de esfera */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_32%)]" />
      </motion.div>
    </div>
  );
}
