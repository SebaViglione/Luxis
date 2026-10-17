'use client';

import { useEffect, useState } from 'react';
import CountUp from '@/components/reactbits/count-up';

const CLAVE = 'luxis:total-dashboard';

/**
 * Total de licitaciones: anima solo la primera vez en la sesión o cuando el número cambia
 * (antes se re-animaba desde 0 en cada navegación y en cada refresh).
 */
export function ContadorTotal({ total, className }: { total: number; className?: string }) {
  const [desde, setDesde] = useState<number | null>(null);
  useEffect(() => {
    let previo: number | null = null;
    try { const v = sessionStorage.getItem(CLAVE); previo = v === null ? null : Number(v); } catch { /* sin storage */ }
    setDesde(previo ?? 0);
    try { sessionStorage.setItem(CLAVE, String(total)); } catch { /* sin storage */ }
  }, [total]);
  if (desde === null || desde === total) return <span className={className}>{total}</span>;
  return <CountUp key={`${desde}-${total}`} from={desde} to={total} duration={0.6} trigger="load" className={className} />;
}
