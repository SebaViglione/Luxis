'use client';

import { cn } from '@/lib/utils';
import type { Bloque, DocumentoPostulacion } from '@/server/postulacion/documentos';

/** Vista previa del documento en pantalla (el PDF y el Word salen de los mismos bloques). */
export function VistaDocumento({ documento, className }: { documento: DocumentoPostulacion; className?: string }) {
  return (
    <article className={cn('space-y-4 bg-card text-sm leading-relaxed text-foreground', className)}>
      {documento.bloques.map((b, i) => (
        <BloqueVista key={i} bloque={b} />
      ))}
    </article>
  );
}

function BloqueVista({ bloque: b }: { bloque: Bloque }) {
  switch (b.tipo) {
    case 'titulo':
      return <h2 className="text-lg font-semibold">{b.texto}</h2>;
    case 'subtitulo':
      return <h3 className="pt-2 font-semibold">{b.texto}</h3>;
    case 'parrafo':
      return <p className={cn('whitespace-pre-line', b.negrita && 'font-semibold', b.derecha && 'text-right')}>{b.texto}</p>;
    case 'nota':
      return <p className="text-xs text-muted-foreground italic">{b.texto}</p>;
    case 'lista':
      return (
        <ul className="ml-5 list-disc space-y-1">
          {b.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'campos':
      return (
        <dl className="divide-y overflow-hidden rounded-md border">
          {b.filas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="grid grid-cols-[minmax(0,13rem)_1fr]">
              <dt className="bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">{etiqueta}</dt>
              <dd className="px-3 py-2">{valor}</dd>
            </div>
          ))}
        </dl>
      );
    case 'tabla':
      return (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                {b.columnas.map((c, i) => (
                  <th key={c} className={cn('border-b px-3 py-2 font-mono text-[11px] font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase', b.alineacion?.[i] === 'der' ? 'text-right' : 'text-left')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {b.filas.map((fila, i) => (
                <tr key={i}>
                  {fila.map((v, j) => (
                    <td key={j} className={cn('px-3 py-2 align-top', b.alineacion?.[j] === 'der' ? 'text-right font-mono whitespace-nowrap tabular-nums' : 'min-w-32')}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'firma':
      return (
        <div className="space-y-1 pt-10">
          {b.lineas.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      );
  }
}
