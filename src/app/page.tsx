import { Suspense } from 'react';
import { CtaFinal, Pie } from '@/components/landing/cierre';
import { Cobertura } from '@/components/landing/cobertura';
import { FondoGrano } from '@/components/landing/fondos';
import { Encabezado } from '@/components/landing/encabezado';
import { Funciones } from '@/components/landing/funciones';
import { Hero } from '@/components/landing/hero';
import { MarqueeOrganismos } from '@/components/landing/marquee-organismos';
import { Pasos } from '@/components/landing/pasos';
import { Preguntas } from '@/components/landing/preguntas';

export default function Inicio() {
  return (
    <div className="flex flex-1 flex-col">
      <FondoGrano />
      <Encabezado />
      <main className="relative flex-1">
        <Hero />
        <MarqueeOrganismos />
        <Pasos />
        <Funciones />
        <Suspense fallback={null}>
          <Cobertura />
        </Suspense>
        <Preguntas />
        <CtaFinal />
      </main>
      <Pie />
    </div>
  );
}
