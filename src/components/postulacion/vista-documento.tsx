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
        <dl className="grid grid-cols-[minmax(0,14rem)_1fr] border-t border-l">
          {b.filas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="contents">
              <dt className="border-r border-b bg-muted/50 px-2 py-1.5 font-medium">{etiqueta}</dt>
              <dd className="border-r border-b px-2 py-1.5">{valor}</dd>
            </div>
          ))}
        </dl>
      );
    case 'tabla':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {b.columnas.map((c, i) => (
                  <th key={c} className={cn('border bg-muted/50 px-2 py-1.5 font-medium', b.alineacion?.[i] === 'der' ? 'text-right' : 'text-left')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.filas.map((fila, i) => (
                <tr key={i}>
                  {fila.map((v, j) => (
                    <td key={j} className={cn('border px-2 py-1.5 align-top', b.alineacion?.[j] === 'der' && 'text-right font-mono tabular-nums')}>
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
