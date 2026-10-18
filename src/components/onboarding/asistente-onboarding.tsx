'use client';

import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PerfilEmpresa } from '@/lib/types';
import { confirmarPerfil } from '@/app/(onboarding)/onboarding/actions';
import { BotonEntrevistaVoz } from '@/components/voz/entrevista-voz';
import { aplicarElecciones, detectarContradicciones, type Eleccion, type FuentesPerfil } from './contradicciones';
import { PasoEmpresa } from './paso-empresa';
import { PasoEntrevista } from './paso-entrevista';
import { PasoFuentes } from './paso-fuentes';
import { ResumenPerfil } from './resumen-perfil';
import { RevisarContradicciones } from './revisar-contradicciones';

const datosManuales = (p: PerfilEmpresa): Partial<PerfilEmpresa> =>
  ({ nombre: p.nombre, rut: p.rut, departamento: p.departamento, localidad: p.localidad, web: p.web, telefono: p.telefono });

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
  // Lo que dijo cada fuente antes de fusionar: si los documentos contradicen al usuario, se lo mostramos antes de la revisión.
  const [fuentes, setFuentes] = useState<FuentesPerfil>({});
  const [resueltas, setResueltas] = useState(false);
  const contradicciones = useMemo(() => detectarContradicciones(fuentes), [fuentes]);

  const avanzar = (siguiente: Paso, nuevoPerfil?: PerfilEmpresa) => {
    if (nuevoPerfil) setPerfil(nuevoPerfil);
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const registrar = (fuente: 'documentos' | 'entrevista', extraido?: Partial<PerfilEmpresa>) => {
    if (!extraido) return;
    setFuentes((f) => ({ ...f, [fuente]: fuente === 'entrevista' ? { ...f.entrevista, ...extraido } : extraido }));
    setResueltas(false);
  };

  const resolver = (elecciones: Record<string, Eleccion>) => {
    setPerfil((p) => aplicarElecciones(p, contradicciones, elecciones));
    setResueltas(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-8">
      <ol className="grid grid-cols-4 gap-3" aria-label="Pasos del onboarding">
        {PASOS.map((p, i) => {
          const hecho = i < indiceActual;
          const actual = i === indiceActual;
          return (
            <li key={p.id} aria-current={actual ? 'step' : undefined} className="flex flex-col gap-2.5">
              <span aria-hidden className="h-1 overflow-hidden rounded-full bg-border">
                <span className={cn('block h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]', hecho || actual ? 'w-full' : 'w-0', hecho && 'bg-foreground/40')} />
              </span>
              <span className={cn('flex items-center gap-2 text-sm', actual ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                <span className={cn('font-mono text-xs tabular-nums', actual && 'text-primary')}>
                  {hecho ? <Check className="size-3.5 text-exito" aria-hidden /> : String(i + 1).padStart(2, '0')}
                </span>
                <span className={cn(!actual && 'hidden sm:inline')}>{p.titulo}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {paso === 'empresa' && (
        <PasoEmpresa
          perfil={perfil}
          onListo={(p) => {
            setFuentes((f) => ({ ...f, manual: datosManuales(p) }));
            setResueltas(false);
            avanzar('fuentes', p);
          }}
        />
      )}
      {paso === 'fuentes' && (
        <PasoFuentes
          web={perfil.web}
          onVolver={() => avanzar('empresa')}
          onSinFuentes={() => avanzar('entrevista')}
          onListo={(p, extraido) => {
            registrar('documentos', extraido);
            avanzar(p.camposFaltantes.length > 0 ? 'entrevista' : 'resumen', p);
          }}
        />
      )}
      {paso === 'entrevista' && (
        <PasoEntrevista
          perfil={perfil}
          onListo={(p, extraido) => {
            registrar('entrevista', extraido);
            avanzar('resumen', p);
          }}
          onSaltar={() => avanzar('resumen')}
          acciones={
            <BotonEntrevistaVoz
              onPerfil={(p, extraido) => {
                registrar('entrevista', extraido);
                avanzar('resumen', p);
              }}
            />
          }
        />
      )}
      {paso === 'resumen' && contradicciones.length > 0 && !resueltas && (
        <RevisarContradicciones contradicciones={contradicciones} onListo={resolver} onVolver={() => avanzar('entrevista')} />
      )}
      {paso === 'resumen' && (contradicciones.length === 0 || resueltas) && (
        <ResumenPerfil
          key={resueltas ? 'con-contradicciones-resueltas' : 'sin-contradicciones'}
          perfilInicial={perfil}
          modo="onboarding"
          onGuardar={confirmarPerfil}
          onVolver={() => avanzar('entrevista')}
        />
      )}
    </div>
  );
}
