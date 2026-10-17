import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';
import * as XLSX from 'xlsx';

export interface TextoExtraido {
  nombre: string;
  extension: string;
  texto: string;
}

export class ArchivoNoSoportadoError extends Error {}

export function extensionDe(nombre: string): string {
  const punto = nombre.lastIndexOf('.');
  return punto === -1 ? '' : nombre.slice(punto + 1).toLowerCase();
}

/** Extrae el texto plano de un archivo subido (pdf, docx, xlsx/xls/csv, html, txt). */
export async function extraerTexto(nombre: string, buffer: Buffer): Promise<TextoExtraido> {
  const extension = extensionDe(nombre);
  let texto: string;

  switch (extension) {
    case 'pdf': {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      texto = text;
      break;
    }
    case 'docx': {
      const { value } = await mammoth.extractRawText({ buffer });
      texto = value;
      break;
    }
    case 'xlsx':
    case 'xls':
    case 'csv': {
      const libro = XLSX.read(buffer, { type: 'buffer' });
      texto = libro.SheetNames.map((hoja) => {
        const csv = XLSX.utils.sheet_to_csv(libro.Sheets[hoja], { blankrows: false });
        return `## Hoja: ${hoja}\n${csv}`;
      }).join('\n\n');
      break;
    }
    case 'html':
    case 'htm':
      texto = textoDeHtml(decodificar(buffer));
      break;
    case 'txt':
      texto = decodificar(buffer);
      break;
    default:
      throw new ArchivoNoSoportadoError(`El formato .${extension || '?'} no está soportado`);
  }

  return { nombre, extension, texto: limpiarTexto(texto) };
}

/** Texto visible de una página HTML (sin scripts, estilos ni navegación repetida). */
export function textoDeHtml(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe, template').remove();
  // Separar bloques para que "<h1>Productos</h1><p>Ladrillo</p>" no quede "ProductosLadrillo".
  $('br').replaceWith('\n');
  $('p, div, li, tr, h1, h2, h3, h4, h5, h6, section, article, header, footer, table, ul, ol').append('\n');
  $('td, th').append(' ');
  const titulo = $('title').first().text().trim();
  const cuerpo = $('body').text() || $.root().text();
  return limpiarTexto(titulo ? `${titulo}\n${cuerpo}` : cuerpo);
}

function decodificar(buffer: Buffer): string {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  // Si hay caracteres de reemplazo, probablemente sea latin1 (común en archivos viejos de Windows).
  return utf8.includes('�') ? new TextDecoder('iso-8859-1').decode(buffer) : utf8;
}

function limpiarTexto(texto: string): string {
  return texto
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}
