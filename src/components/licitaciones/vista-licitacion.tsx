'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ChatFlotante } from '@/components/chat/chat-flotante';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DetalleLicitacion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PanelDecision } from './panel-decision';

const PESTANAS = [
  { id: 'resumen', texto: 'Resumen' },
  { id: 'precios', texto: 'Precios' },
  { id: 'papeles', texto: 'Papeles' },
  { id: 'fechas', texto: 'Fechas' },
  { id: 'archivos', texto: 'Archivos' },
] as const;

/**
 * Vista de una licitación: panel de decisión + pestañas en lenguaje llano (los enlaces del panel abren la pestaña).
 * El chat con el pliego acompaña en una ventana abajo a la derecha: en pantallas anchas el contenido se corre
 * para que no lo tape, y sigue montado al minimizar para no perder la conversación.
 */
export function VistaLicitacion({ d, diasCierre, contenido, chat }: {
  d: DetalleLicitacion;
  diasCierre: number | null;
  contenido: Record<(typeof PESTANAS)[number]['id'], ReactNode>;
  /** El chat con el pliego (`ChatPliego` con `enPanel`). */
  chat: ReactNode;
}) {
  const [pestana, setPestana] = useState<string>('resumen');
  const [chatAbierto, setChatAbierto] = useState(false);
  const ancla = useRef<HTMLDivElement>(null);
  const irA = (id: string) => {
    setPestana(id);
    requestAnimationFrame(() => ancla.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const l = d.licitacion;
  return (
    <>
      <div className={cn('space-y-6 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]', chatAbierto && 'xl:pr-[25rem]')}>
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
              <TabsContent key={p.id} value={p.id} className="pt-6 [&[hidden]]:hidden">
                {contenido[p.id]}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      {/* Fuera del contenedor con space-y: ese margen correría los elementos fijos del chat. */}
      <ChatFlotante abierto={chatAbierto} onCambio={setChatAbierto} subtitulo={`${l.tipoCompraNombre} N° ${l.numero}`}>
        {chat}
      </ChatFlotante>
    </>
  );
}
