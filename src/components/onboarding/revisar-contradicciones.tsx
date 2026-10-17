'use client';

import { useState } from 'react';
import { FileText, MessageSquareText, PencilLine, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { Contradiccion, Eleccion } from './contradicciones';

const ORIGEN = {
  manual: { texto: 'Lo que escribiste', icono: PencilLine },
  entrevista: { texto: 'Lo que nos dijiste en la entrevista', icono: MessageSquareText },
} as const;

function Opcion({ id, valor, titulo, detalle, icono: Icono, elegida }: {
  id: string; valor: Eleccion; titulo: string; detalle: string; icono: typeof FileText; elegida: boolean;
}) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-muted/50', elegida && 'border-foreground/25 bg-secondary')}>
      <RadioGroupItem id={id} value={valor} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icono aria-hidden className="size-3.5" /> {titulo}</span>
        <span className="mt-0.5 block text-sm break-words">{detalle}</span>
      </span>
    </label>
  );
}

export function RevisarContradicciones({ contradicciones, onListo, onVolver }: {
  contradicciones: Contradiccion[];
  onListo: (elecciones: Record<string, Eleccion>) => void;
  onVolver: () => void;
}) {
  const [elecciones, setElecciones] = useState<Record<string, Eleccion>>({});
  const resueltas = contradicciones.filter((c) => elecciones[c.clave]).length;
  const faltan = contradicciones.length - resueltas;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert aria-hidden className="size-5 text-alerta" />
          {contradicciones.length === 1 ? 'Encontramos un dato que no coincide' : `Encontramos ${contradicciones.length} datos que no coinciden`}
        </CardTitle>
        <CardDescription>
          Lo que leímos en tus documentos no coincide con lo que nos contaste. Antes de crear tu perfil, elegí cuál es el dato correcto. En el paso siguiente podés corregir cualquier cosa a mano.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {contradicciones.map((c) => {
          const origen = ORIGEN[c.origen];
          const elegida = elecciones[c.clave];
          return (
            <fieldset key={c.clave} className="space-y-2">
              <legend className="mb-2 text-sm font-medium">{c.etiqueta}</legend>
              <RadioGroup value={elegida ?? null} onValueChange={(v) => setElecciones((prev) => ({ ...prev, [c.clave]: v as Eleccion }))}
                className={cn('grid gap-2', c.permiteAmbos ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                <Opcion id={`${c.clave}-documentos`} valor="documentos" titulo="Según tus documentos" detalle={c.documentos} icono={FileText} elegida={elegida === 'documentos'} />
                <Opcion id={`${c.clave}-usuario`} valor="usuario" titulo={origen.texto} detalle={c.usuario} icono={origen.icono} elegida={elegida === 'usuario'} />
                {c.permiteAmbos && (
                  <Opcion id={`${c.clave}-ambos`} valor="ambos" titulo="Las dos" detalle="Juntar los dos datos" icono={PencilLine} elegida={elegida === 'ambos'} />
                )}
              </RadioGroup>
            </fieldset>
          );
        })}
      </CardContent>
      <CardFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onVolver}>Volver a la entrevista</Button>
        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {faltan ? `${faltan === 1 ? 'Falta elegir 1 dato' : `Faltan elegir ${faltan} datos`}` : 'Listo, ya elegiste todos'}
          </span>
          <Button onClick={() => onListo(elecciones)} disabled={faltan > 0}>Continuar con estos datos</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
