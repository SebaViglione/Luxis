'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DetalleLicitacion } from '@/lib/types';
import { PanelDecision } from './panel-decision';

const PESTANAS = [
  { id: 'resumen', texto: 'Resumen' },
  { id: 'precios', texto: 'Precios' },
  { id: 'papeles', texto: 'Papeles' },
  { id: 'fechas', texto: 'Fechas' },
  { id: 'chat', texto: 'Preguntale al pliego' },
  { id: 'archivos', texto: 'Archivos' },
] as const;

/** Vista de una licitación: panel de decisión + pestañas en lenguaje llano (los enlaces del panel abren la pestaña). */
export function VistaLicitacion({ d, diasCierre, contenido }: {
  d: DetalleLicitacion;
  diasCierre: number | null;
  contenido: Record<(typeof PESTANAS)[number]['id'], ReactNode>;
}) {
  const [pestana, setPestana] = useState<string>('resumen');
  const ancla = useRef<HTMLDivElement>(null);
  const irA = (id: string) => {
    setPestana(id);
    requestAnimationFrame(() => ancla.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  return (
    <div className="space-y-6">
      <PanelDecision d={d} diasCierre={diasCierre} irA={irA} />
      <div ref={ancla} className="scroll-mt-20">
        <Tabs value={pestana} onValueChange={(v) => setPestana(String(v))}>
          <div className="overflow-x-auto overflow-y-hidden border-b pb-[5px]">
            <TabsList variant="line" className="h-10">
              {PESTANAS.map((p) => (
                <TabsTrigger key={p.id} value={p.id}>
                  {p.texto}{p.id === 'archivos' ? ` (${d.archivos.length})` : ''}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {PESTANAS.map((p) => (
            <TabsContent key={p.id} value={p.id} keepMounted={p.id === 'chat'} className="pt-6 [&[hidden]]:hidden">
              {contenido[p.id]}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
