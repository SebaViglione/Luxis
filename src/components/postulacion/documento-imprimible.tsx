'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { Bloque, DocumentoPostulacion } from '@/server/postulacion/documentos';

/** Hoja A4 con los bloques del documento: vista previa en pantalla y contenido al imprimir. */
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

const ESTILO_IMPRESION = `
#documento-para-imprimir { display: none; }
@media print {
  body > *:not(#documento-para-imprimir) { display: none !important; }
  #documento-para-imprimir { display: block !important; }
  @page { size: A4; margin: 18mm; }
}`;

/**
 * "Descargar PDF": monta el documento solo para impresión y abre el diálogo del navegador
 * (Guardar como PDF). Así no hace falta generar el PDF en el servidor.
 */
export function useImprimirDocumento() {
  const [documento, setDocumento] = useState<DocumentoPostulacion | null>(null);

  useEffect(() => {
    if (!documento) return;
    const tituloOriginal = document.title;
    document.title = documento.nombreArchivo; // nombre sugerido del PDF
    const alTerminar = () => {
      document.title = tituloOriginal;
      setDocumento(null);
    };
    window.addEventListener('afterprint', alTerminar, { once: true });
    const espera = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(espera);
      window.removeEventListener('afterprint', alTerminar);
      document.title = tituloOriginal;
    };
  }, [documento]);

  const elemento =
    documento && typeof document !== 'undefined'
      ? createPortal(
          <div id="documento-para-imprimir">
            <VistaDocumento documento={documento} />
          </div>,
          document.body,
        )
      : null;

  return { imprimir: setDocumento, elemento: [<style key="estilo">{ESTILO_IMPRESION}</style>, elemento] };
}
