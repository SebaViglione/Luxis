'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PerfilEmpresa } from '@/lib/types';
import { confirmarPerfil } from '@/app/(onboarding)/onboarding/actions';
import { BotonEntrevistaVoz } from '@/components/voz/entrevista-voz';
import { PasoEmpresa } from './paso-empresa';
import { PasoEntrevista } from './paso-entrevista';
import { PasoFuentes } from './paso-fuentes';
import { ResumenPerfil } from './resumen-perfil';

type Paso = 'empresa' | 'fuentes' | 'entrevista' | 'resumen';

const PASOS: { id: Paso; titulo: string }[] = [
  { id: 'empresa', titulo: 'Tu empresa' },
  { id: 'fuentes', titulo: 'Documentos o web' },
  { id: 'entrevista', titulo: 'Entrevista' },
  { id: 'resumen', titulo: 'Revisión' },
];

export function AsistenteOnboarding({ perfilInicial }: { perfilInicial: PerfilEmpresa }) {
  const [perfil, setPerfil] = useState(perfilInicial);
  // Si vuelve a mitad de camino con productos ya cargados, retoma en la revisión.
  const [paso, setPaso] = useState<Paso>(perfilInicial.productos.length > 0 ? 'resumen' : 'empresa');
  const indiceActual = PASOS.findIndex((p) => p.id === paso);

  const avanzar = (siguiente: Paso, nuevoPerfil?: PerfilEmpresa) => {
    if (nuevoPerfil) setPerfil(nuevoPerfil);
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-8">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Pasos del onboarding">
        {PASOS.map((p, i) => {
          const hecho = i < indiceActual;
          const actual = i === indiceActual;
          return (
            <li
              key={p.id}
              aria-current={actual ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 border-t-2 pt-2 text-sm',
                actual ? 'border-primary font-medium text-foreground' : 'border-border text-muted-foreground',
                hecho && 'border-foreground/40',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-sm border font-mono text-xs tabular-nums',
                  actual && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {hecho ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              {p.titulo}
            </li>
          );
        })}
      </ol>

      {paso === 'empresa' && <PasoEmpresa perfil={perfil} onListo={(p) => avanzar('fuentes', p)} />}
      {paso === 'fuentes' && (
        <PasoFuentes
          web={perfil.web}
          onVolver={() => avanzar('empresa')}
          onSinFuentes={() => avanzar('entrevista')}
          onListo={(p) => avanzar(p.camposFaltantes.length > 0 ? 'entrevista' : 'resumen', p)}
        />
      )}
      {paso === 'entrevista' && (
        <PasoEntrevista
          perfil={perfil}
          onListo={(p) => avanzar('resumen', p)}
          onSaltar={() => avanzar('resumen')}
          acciones={<BotonEntrevistaVoz perfil={perfil} onPerfil={(p) => avanzar('resumen', p)} />}
        />
      )}
      {paso === 'resumen' && (
        <ResumenPerfil
          perfilInicial={perfil}
          modo="onboarding"
          onGuardar={confirmarPerfil}
          onVolver={() => avanzar('entrevista')}
        />
      )}
    </div>
  );
}
