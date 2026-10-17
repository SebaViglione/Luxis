'use client';

import CountUp from '@/components/reactbits/count-up';
import { Aparecer } from './aparecer';

export function Cifras({ cifras }: { cifras: { valor: number; etiqueta: string }[] }) {
  return (
    <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
      {cifras.map((c, i) => (
        <Aparecer key={c.etiqueta} retraso={i * 0.1} className="border-t border-background/20 pt-5">
          <dt className="sr-only">{c.etiqueta}</dt>
          <dd>
            <CountUp to={c.valor} duration={1.6} separator="." trigger="view" className="font-mono text-4xl font-semibold tracking-tight md:text-5xl" />
            <p className="mt-2 text-sm text-background/70">{c.etiqueta}</p>
          </dd>
        </Aparecer>
      ))}
    </dl>
  );
}
