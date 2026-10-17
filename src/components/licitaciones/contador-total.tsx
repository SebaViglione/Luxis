'use client';

import { useEffect, useState } from 'react';
import Counter from '@/components/reactbits/counter';

const CLAVE = 'luxis:total-dashboard';

/**
 * Total de licitaciones con los filtros actuales: los dígitos ruedan del valor anterior al nuevo cuando
 * cambian los filtros, y la entrada se anima una sola vez por sesión (no en cada navegación).
 */
export function ContadorTotal({ total, className }: { total: number; className?: string }) {
  const [intro] = useState(() => {
    try { return typeof window !== 'undefined' && sessionStorage.getItem(CLAVE) === null; } catch { return false; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(CLAVE, '1'); } catch { /* sin storage */ }
  }, []);
  return (
    <span className={className}>
      <Counter value={total} locale="es-UY" intro={intro} fontSize="inherit" duration={0.6} bounce={0.15} />
    </span>
  );
}
