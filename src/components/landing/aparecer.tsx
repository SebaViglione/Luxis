'use client';

import { motion, MotionConfig, type HTMLMotionProps } from 'motion/react';

type AparecerProps = HTMLMotionProps<'div'> & {
  /** Segundos de espera antes de entrar. */
  retraso?: number;
  /** Desplazamiento vertical inicial en px. */
  distancia?: number;
};

/** Reveal al entrar en viewport. Con reduced-motion solo cambia la opacidad. */
export function Aparecer({ retraso = 0, distancia = 24, children, ...props }: AparecerProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: distancia, filter: 'blur(6px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, delay: retraso, ease: [0.22, 1, 0.36, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
