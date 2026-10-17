'use client';

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import type { LicitacionCard } from '@/lib/types';
import { CardLicitacion } from './card-licitacion';

/** Lista de tarjetas: al filtrar, las que salen se van y las nuevas entran sin saltos (layout + popLayout). */
export function ListaTarjetas({ cards }: { cards: LicitacionCard[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <ul className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {cards.map((c) => (
            <motion.li key={c.idCompra} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
              <CardLicitacion lic={c} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </MotionConfig>
  );
}
