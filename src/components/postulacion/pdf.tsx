// PDF descargable (A4, texto seleccionable) a partir de los mismos bloques que la vista previa y el Word.
// Se importa de forma dinámica solo al descargar: @react-pdf/renderer es pesado.
import { Document, Font, Page, pdf, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Bloque, DocumentoPostulacion } from '@/server/postulacion/documentos';

// El corte automático de palabras de react-pdf es en inglés ("con-strucción"): sin cortes.
Font.registerHyphenationCallback((palabra) => [palabra]);

// Colores de la marca (docs/07-marca.md): el PDF no puede usar los tokens CSS.
const TINTA = '#1B1B1B';
const TEXTO_SECUNDARIO = '#5C5955';
const BORDE = '#D9D5CC';
const ARENA = '#EFEDE7';

const s = StyleSheet.create({
  pagina: { paddingTop: 48, paddingBottom: 48, paddingHorizontal: 52, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.45, color: TINTA },
  titulo: { fontFamily: 'Helvetica-Bold', fontSize: 15, marginBottom: 12 },
  subtitulo: { fontFamily: 'Helvetica-Bold', fontSize: 11.5, marginTop: 6, marginBottom: 6 },
  parrafo: { marginBottom: 8 },
  negrita: { fontFamily: 'Helvetica-Bold' },
  derecha: { textAlign: 'right' },
  nota: { fontFamily: 'Helvetica-Oblique', fontSize: 8.5, color: TEXTO_SECUNDARIO, marginBottom: 8 },
  tabla: { borderTopWidth: 0.75, borderLeftWidth: 0.75, borderColor: BORDE, marginBottom: 10 },
  fila: { flexDirection: 'row' },
  celda: { borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: BORDE, paddingVertical: 4, paddingHorizontal: 5 },
  encabezado: { backgroundColor: ARENA, fontFamily: 'Helvetica-Bold' },
  itemLista: { flexDirection: 'row', marginBottom: 3 },
  vineta: { width: 12 },
  textoLista: { flex: 1 },
  firma: { marginTop: 36 },
  lineaFirma: { marginBottom: 4 },
});

function BloquePdf({ bloque: b }: { bloque: Bloque }) {
  switch (b.tipo) {
    case 'titulo':
      return <Text style={s.titulo}>{b.texto}</Text>;
    case 'subtitulo':
      return <Text style={s.subtitulo}>{b.texto}</Text>;
    case 'parrafo':
      return <Text style={[s.parrafo, b.negrita ? s.negrita : {}, b.derecha ? s.derecha : {}]}>{b.texto}</Text>;
    case 'nota':
      return <Text style={s.nota}>{b.texto}</Text>;
    case 'lista':
      return (
        <View style={s.parrafo}>
          {b.items.map((item, i) => (
            <View key={i} style={s.itemLista} wrap={false}>
              <Text style={s.vineta}>•</Text>
              <Text style={s.textoLista}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'campos':
      return (
        <View style={s.tabla}>
          {b.filas.map(([etiqueta, valor]) => (
            <View key={etiqueta} style={s.fila} wrap={false}>
              <Text style={[s.celda, s.encabezado, { width: '36%' }]}>{etiqueta}</Text>
              <Text style={[s.celda, { width: '64%' }]}>{valor}</Text>
            </View>
          ))}
        </View>
      );
    case 'tabla': {
      const anchos = b.anchos ?? b.columnas.map(() => 1);
      const celda = (contenido: string, i: number, encabezado = false) => (
        <Text
          key={i}
          style={[s.celda, encabezado ? s.encabezado : {}, { flex: anchos[i] ?? 1 }, b.alineacion?.[i] === 'der' ? s.derecha : {}]}
        >
          {contenido}
        </Text>
      );
      return (
        <View style={s.tabla}>
          <View style={s.fila} fixed>
            {b.columnas.map((c, i) => celda(c, i, true))}
          </View>
          {b.filas.map((fila, j) => (
            <View key={j} style={s.fila} wrap={false}>
              {fila.map((v, i) => celda(v, i))}
            </View>
          ))}
        </View>
      );
    }
    case 'firma':
      return (
        <View style={s.firma} wrap={false}>
          {b.lineas.map((l) => (
            <Text key={l} style={s.lineaFirma}>
              {l}
            </Text>
          ))}
        </View>
      );
  }
}

export function DocumentoPdf({ documento }: { documento: DocumentoPostulacion }) {
  return (
    <Document title={documento.titulo} author="Luxis" creator="Luxis" language="es-UY">
      <Page size="A4" style={s.pagina}>
        {documento.bloques.map((b, i) => (
          <BloquePdf key={i} bloque={b} />
        ))}
      </Page>
    </Document>
  );
}

export function generarPdf(documento: DocumentoPostulacion): Promise<Blob> {
  return pdf(<DocumentoPdf documento={documento} />).toBlob();
}
