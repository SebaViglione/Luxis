// Exportaciones de la postulación, generadas en el navegador (incluyen lo que el usuario editó).
import type { Bloque, DocumentoPostulacion } from '@/server/postulacion/documentos';
import { importe, totalesCotizacion } from '@/server/postulacion/documentos';
import type { Cotizacion, DatosPagina } from '@/server/postulacion/tipos';

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Word editable (.docx) a partir de los bloques del documento. */
export async function descargarDocx(documento: DocumentoPostulacion) {
  const d = await import('docx');
  const texto = (contenido: string, negrita = false) =>
    contenido.split('\n').map((linea, i) => new d.TextRun({ text: linea, bold: negrita, break: i > 0 ? 1 : undefined }));
  const celda = (contenido: string, negrita = false, derecha = false) =>
    new d.TableCell({
      children: [new d.Paragraph({ children: texto(contenido, negrita), alignment: derecha ? d.AlignmentType.RIGHT : d.AlignmentType.LEFT })],
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
    });

  const hijos = documento.bloques.flatMap((b: Bloque) => {
    switch (b.tipo) {
      case 'titulo':
        return [new d.Paragraph({ children: texto(b.texto, true), heading: d.HeadingLevel.HEADING_1, spacing: { after: 240 } })];
      case 'subtitulo':
        return [new d.Paragraph({ children: texto(b.texto, true), heading: d.HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } })];
      case 'parrafo':
        return [
          new d.Paragraph({
            children: texto(b.texto, b.negrita),
            alignment: b.derecha ? d.AlignmentType.RIGHT : d.AlignmentType.LEFT,
            spacing: { after: 200 },
          }),
        ];
      case 'nota':
        return [new d.Paragraph({ children: [new d.TextRun({ text: b.texto, italics: true, size: 18 })], spacing: { before: 200 } })];
      case 'lista':
        return b.items.map((item) => new d.Paragraph({ children: texto(item), bullet: { level: 0 }, spacing: { after: 80 } }));
      case 'campos':
        return [
          new d.Table({
            width: { size: 100, type: d.WidthType.PERCENTAGE },
            rows: b.filas.map(([etiqueta, valor]) => new d.TableRow({ children: [celda(etiqueta, true), celda(valor)] })),
          }),
          new d.Paragraph({ text: '' }),
        ];
      case 'tabla':
        return [
          new d.Table({
            width: { size: 100, type: d.WidthType.PERCENTAGE },
            rows: [
              new d.TableRow({ tableHeader: true, children: b.columnas.map((c) => celda(c, true)) }),
              ...b.filas.map((fila) => new d.TableRow({ children: fila.map((v, i) => celda(v, false, b.alineacion?.[i] === 'der')) })),
            ],
          }),
          new d.Paragraph({ text: '' }),
        ];
      case 'firma':
        return [new d.Paragraph({ text: '', spacing: { before: 480 } }), ...b.lineas.map((l) => new d.Paragraph({ children: texto(l), spacing: { after: 80 } }))];
    }
  });

  const doc = new d.Document({
    creator: 'Luxis',
    title: documento.titulo,
    styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
    sections: [{ properties: {}, children: hijos }],
  });
  descargar(await d.Packer.toBlob(doc), `${documento.nombreArchivo}.docx`);
}

/** Planilla con los mismos campos y en el mismo orden que pide SICE al "Ofertar en este ítem". */
export async function descargarPlanillaSice(p: DatosPagina, c: Cotizacion) {
  const XLSX = await import('xlsx');
  const { incluidas, porMoneda } = totalesCotizacion(c.lineas);
  const encabezado = [
    [`Cotización · ${p.licitacion.tipoCompraNombre} ${p.licitacion.numero}`],
    [p.licitacion.objeto],
    [`${p.empresa.razonSocial || p.empresa.nombre}${p.empresa.rut ? ` · RUT ${p.empresa.rut}` : ''}`],
    [],
  ];
  const columnas = [
    'Ítem',
    'Descripción del ítem (ARCE)',
    'Variación',
    'Cantidad ofertada',
    'Unidad',
    'Precio unitario sin impuestos',
    'Moneda',
    'Impuesto (IVA %)',
    'Características (marca, modelo, medida)',
    'Observaciones',
    'Subtotal sin impuestos',
    'IVA',
    'Total con impuestos',
  ];
  const filas = incluidas.map((l) => {
    const neto = l.cantidad * (l.precioUnitario ?? 0);
    const iva = (neto * l.iva) / 100;
    return [l.nroItem, l.descripcion, '', l.cantidad, l.unidad, l.precioUnitario ?? 0, l.moneda, l.iva, [l.productoEmpresa, l.caracteristicas].filter(Boolean).join(' · '), '', round(neto), round(iva), round(neto + iva)];
  });
  const pie = [
    [],
    ...[...porMoneda].map(([moneda, t]) => ['', `Totales en ${moneda}`, '', '', '', '', '', '', '', '', round(t.neto), round(t.iva), round(t.neto + t.iva)]),
    [],
    ['', `Plazo de entrega: ${c.plazoEntrega || '—'}`],
    ['', `Mantenimiento de la oferta: ${c.mantenimientoOferta || '—'}`],
    ['', 'En SICE: "Ofertar en este ítem" → cargá cantidad, precio unitario SIN impuestos, moneda, impuesto y características. Guardá cada ítem.'],
  ];
  const hoja = XLSX.utils.aoa_to_sheet([...encabezado, columnas, ...filas, ...pie]);
  hoja['!cols'] = [6, 48, 10, 10, 10, 14, 8, 10, 36, 20, 16, 14, 16].map((wch) => ({ wch }));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Cotización SICE');
  const datos = XLSX.write(libro, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  descargar(
    new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Cotizacion SICE - ${p.licitacion.numero.replace(/\//g, '-')}.xlsx`,
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

export { importe };
