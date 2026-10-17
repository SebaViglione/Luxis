import { CircleCheck, CircleHelp, CircleX, Clock, FileCheck } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GapDocumental, RequisitoDocumental } from '@/lib/types';
import { esPliegoDelLlamado } from '@/server/ia/gap-documental';

function Llegada({ g, diasCierre }: { g: GapDocumental; diasCierre: number | null }) {
  if (g.tiene) return <span className="inline-flex items-center gap-1.5 text-exito"><CircleCheck aria-hidden className="size-4" /> Ya lo tenés</span>;
  if (g.alcanzableAntesCierre === null) return <span className="inline-flex items-center gap-1.5 text-muted-foreground"><CircleHelp aria-hidden className="size-4" /> Sin datos</span>;
  if (!g.alcanzableAntesCierre) return <span className="inline-flex items-center gap-1.5 text-error"><CircleX aria-hidden className="size-4" /> No llegás</span>;
  const dias = g.diasEstimados !== null ? ` (~${g.diasEstimados} días hábiles)` : '';
  const justo = g.diasEstimados !== null && diasCierre !== null && g.diasEstimados >= diasCierre - 1;
  return justo
    ? <span className="inline-flex items-center gap-1.5 text-alerta-fuerte"><Clock aria-hidden className="size-4 text-alerta" /> Justo{dias}</span>
    : <span className="inline-flex items-center gap-1.5 text-exito"><CircleCheck aria-hidden className="size-4" /> Sí{dias}</span>;
}

export function PanelDocumentacion({ gap: gapGuardado, requisitos, diasCierre }: {
  gap: GapDocumental[];
  requisitos: RequisitoDocumental[];
  diasCierre: number | null;
}) {
  // Los análisis viejos listaban el pliego como requisito: el oferente no lo presenta.
  const gap = gapGuardado.filter((g) => !esPliegoDelLlamado(g.documento));
  if (!gap.length) {
    return <EstadoVacio icono={FileCheck} titulo="Sin requisitos documentales detectados" descripcion="Cuando leamos el pliego vas a ver acá qué papeles piden y si llegás a tenerlos antes del cierre." />;
  }
  const seccion = new Map(requisitos.map((r) => [r.documento, r.seccion]));
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento requerido</TableHead>
            <TableHead>Obligatorio</TableHead>
            <TableHead>Sección del pliego</TableHead>
            <TableHead>Tu estado</TableHead>
            <TableHead>¿Llegás antes del cierre?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gap.map((g) => (
            <TableRow key={g.documento}>
              <TableCell className="max-w-72 whitespace-normal">
                <span className="font-medium">{g.documento}</span>
                {g.nota && <span className="block text-xs text-muted-foreground">{g.nota}</span>}
              </TableCell>
              <TableCell>{g.obligatorio ? 'Sí' : 'No'}</TableCell>
              <TableCell className="whitespace-normal text-muted-foreground">{seccion.get(g.documento) ?? '—'}</TableCell>
              <TableCell>{g.tiene ? 'Lo tenés' : 'No lo tenés'}</TableCell>
              <TableCell><Llegada g={g} diasCierre={diasCierre} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
