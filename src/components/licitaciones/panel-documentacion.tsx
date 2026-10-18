import { CircleCheck, CircleHelp, CircleX, Clock, FileCheck, FilePen, Trophy, type LucideIcon } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { GapDocumental, RequisitoDocumental } from '@/lib/types';
import { cn } from '@/lib/utils';
import { esDocumentoDeLaLicitacion } from '@/config/plazos-documentales';

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

const esPliego = (documento: string) => esDocumentoDeLaLicitacion(documento) || /^\s*(el\s+)?pliegos?\b/i.test(documento);

function RequisitosSinComparar({ requisitos }: { requisitos: RequisitoDocumental[] }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Papeles que piden</h2>
        <p className="text-sm text-muted-foreground">
          Esto es lo que pide el pliego. Todavía no lo comparamos con los papeles de tu perfil: en &quot;Preparar mi oferta&quot; ves qué te falta.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {requisitos.map((r, i) => (
          <li key={`${r.documento}-${i}`} className="rounded-md border bg-card p-3">
            <p className="text-sm font-medium">
              {r.documento}
              {!r.obligatorio && <span className="font-normal text-muted-foreground"> · opcional</span>}
            </p>
            {r.detalle && <p className="mt-0.5 text-sm text-muted-foreground">{r.detalle}</p>}
            {r.seccion && <p className="mt-1 text-xs text-muted-foreground">Dónde lo piden: {r.seccion}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PanelDocumentacion({ gap: gapGuardado, requisitos }: {
  gap: GapDocumental[];
  requisitos: RequisitoDocumental[];
  diasCierre?: number | null;
}) {
  // Papeles = entregables. Los análisis viejos listaban el pliego como requisito: se lee, no se presenta.
  const gap = gapGuardado.filter((g) => !esPliego(g.documento));
  if (!gap.length) {
    // El pliego ya se leyó pero todavía no se comparó con tus papeles: igual mostramos lo que piden (como en la postulación).
    const pedidos = requisitos.filter((r) => !esPliego(r.documento));
    if (pedidos.length) return <RequisitosSinComparar requisitos={pedidos} />;
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
                    {/* En "Los prepara Luxis" la nota genérica sobra; la del envío de la oferta aclara quién la presenta. */}
                    {k === 'tenes' || (k === 'luxis' && /^Lo prepara Luxis/.test(g.nota)) ? '' : g.nota}
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
