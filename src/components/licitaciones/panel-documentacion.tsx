import { CircleCheck, CircleHelp, CircleX, Clock, FileCheck, FilePen, Trophy, type LucideIcon } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { GapDocumental, RequisitoDocumental } from '@/lib/types';
import { cn } from '@/lib/utils';

type Grupo = 'tenes' | 'llegas' | 'dificiles' | 'luxis' | 'despues' | 'sinDatos';

const GRUPOS: Record<Grupo, { titulo: string; ayuda: string; icono: LucideIcon; tono: string }> = {
  dificiles: { titulo: 'Difíciles de conseguir a tiempo', ayuda: 'No llegarías antes del cierre: consultá al organismo si se pueden presentar después.', icono: CircleX, tono: 'text-error' },
  llegas: { titulo: 'Te faltan, pero llegás', ayuda: 'Empezá el trámite ya: hay tiempo antes del cierre.', icono: Clock, tono: 'text-alerta' },
  sinDatos: { titulo: 'Sin datos para estimar', ayuda: 'No sabemos cuánto tarda conseguirlos.', icono: CircleHelp, tono: 'text-muted-foreground' },
  tenes: { titulo: 'Ya los tenés', ayuda: 'Están vigentes en tu perfil.', icono: CircleCheck, tono: 'text-exito' },
  luxis: { titulo: 'Los prepara Luxis', ayuda: 'Formularios, declaraciones y planilla de precios: los armás en "Preparar mi oferta".', icono: FilePen, tono: 'text-primary' },
  despues: { titulo: 'Se piden después de ganar', ayuda: 'No hacen falta para ofertar.', icono: Trophy, tono: 'text-muted-foreground' },
};
const ORDEN: Grupo[] = ['dificiles', 'llegas', 'sinDatos', 'tenes', 'luxis', 'despues'];

function grupoDe(g: GapDocumental): Grupo {
  if (/prepara Luxis/i.test(g.nota)) return 'luxis';
  if (!g.obligatorio && /después de (la )?adjudic|después de ganar|en la entrega/i.test(g.nota)) return 'despues';
  if (g.tiene) return 'tenes';
  if (g.alcanzableAntesCierre === false) return 'dificiles';
  if (g.alcanzableAntesCierre === null) return 'sinDatos';
  return 'llegas';
}

export function PanelDocumentacion({ gap, requisitos }: {
  gap: GapDocumental[];
  requisitos: RequisitoDocumental[];
  diasCierre?: number | null;
}) {
  if (!gap.length) {
    return <EstadoVacio icono={FileCheck} titulo="Todavía no sabemos qué papeles piden" descripcion="Cuando leamos el pliego vas a ver acá qué papeles piden y si llegás a tenerlos antes del cierre." />;
  }
  const seccion = new Map(requisitos.map((r) => [r.documento, r.seccion]));
  const porGrupo = new Map<Grupo, GapDocumental[]>();
  for (const g of gap) porGrupo.set(grupoDe(g), [...(porGrupo.get(grupoDe(g)) ?? []), g]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Papeles que piden</h2>
        <p className="text-sm text-muted-foreground">Comparamos lo que pide el pliego con lo que tenés cargado en tu perfil.</p>
      </div>
      {ORDEN.filter((k) => porGrupo.has(k)).map((k) => {
        const G = GRUPOS[k];
        const Icono = G.icono;
        const lista = porGrupo.get(k)!;
        return (
          <section key={k} className="space-y-2" aria-labelledby={`papeles-${k}`}>
            <header className="flex items-start gap-2">
              <Icono aria-hidden className={cn('mt-0.5 size-5 shrink-0', G.tono)} />
              <div>
                <h3 id={`papeles-${k}`} className="text-base font-semibold">{G.titulo} <span className="font-mono text-sm font-normal text-muted-foreground">{lista.length}</span></h3>
                <p className="text-sm text-muted-foreground">{G.ayuda}</p>
              </div>
            </header>
            <ul className="grid gap-2 sm:grid-cols-2">
              {lista.map((g) => (
                <li key={g.documento} className="rounded-md border bg-card p-3">
                  <p className="text-sm font-medium">{g.documento}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {k === 'llegas' && g.diasEstimados ? `Tarda unos ${g.diasEstimados} días hábiles. ` : ''}
                    {k === 'luxis' || k === 'tenes' ? '' : g.nota}
                  </p>
                  {seccion.get(g.documento) && <p className="mt-1 text-xs text-muted-foreground">Dónde lo piden: {seccion.get(g.documento)}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
