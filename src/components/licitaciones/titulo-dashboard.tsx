'use client';

import { useEffect, useState } from 'react';
import BlurText from '@/components/reactbits/blur-text';
import { ContadorTotal } from './contador-total';

const CLAVE = 'luxis:titulo-visto';

/**
 * Título del dashboard: el único momento reactbits de la app (docs/07-marca.md §8).
 * La frase aparece con desenfoque una sola vez por sesión; después se muestra quieta.
 */
export function TituloDashboard({ total }: { total: number }) {
  const [animar, setAnimar] = useState(true);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de sessionStorage al montar
      if (sessionStorage.getItem(CLAVE)) setAnimar(false);
      else sessionStorage.setItem(CLAVE, '1');
    } catch { /* sin storage: anima siempre */ }
  }, []);
  const frase = total === 1 ? 'licitación donde podés vender' : 'licitaciones donde podés vender';
  return (
    <h1 aria-label={`${total} ${frase}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <ContadorTotal total={total} className="font-mono text-5xl font-semibold tracking-tighter tabular-nums sm:text-6xl" />
      {animar ? (
        <BlurText as="span" text={frase} trigger="load" delay={60} distance={14} blur={8} animateBy="words"
          className="text-2xl font-semibold tracking-tight sm:text-3xl" />
      ) : (
        <span className="text-2xl font-semibold tracking-tight sm:text-3xl">{frase}</span>
      )}
    </h1>
  );
}
