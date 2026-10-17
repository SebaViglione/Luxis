import { readFile } from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

export type EstadoExtraido = 'ok' | 'no_soportado' | 'error';
export interface ArchivoExtraido {
  nombre: string;
  extension: string;
  contenedor: string | null;
  tamano: number;
  texto: string | null;
  estado: EstadoExtraido;
  error?: string;
}

const MAX_PROFUNDIDAD = 2;
const MAX_ARCHIVOS = 40;
const MIN_CHARS_PDF = 200;

export const extensionDe = (nombre: string) => path.extname(nombre).replace('.', '').toLowerCase();

function limpiar(t: string): string {
  return t.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

/** Decodifica texto: UTF-8 si es válido; si no, ISO-8859-1 (muchas webs de organismos lo usan sin declararlo). */
export function decodificarTexto(buf: Buffer): string {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch { return new TextDecoder('iso-8859-1').decode(buf); }
}

async function pdf(buf: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const doc = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(doc, { mergePages: false });
  return text.map((p, i) => `[página ${i + 1}]\n${p}`).join('\n\n');
}

async function docx(buf: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  return (await mammoth.extractRawText({ buffer: buf })).value;
}

/** ODT/ODS: zip con content.xml; se quita el marcado y se respetan párrafos. */
function odf(buf: Buffer): string {
  const xml = new AdmZip(buf).getEntry('content.xml')?.getData().toString('utf8') ?? '';
  return xml.replace(/<\/(text:p|text:h|table:table-row)>/g, '\n').replace(/<text:tab\/>|<\/table:table-cell>/g, ' | ')
    .replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

async function doc(buf: Buffer): Promise<string> {
  const { default: WordExtractor } = await import('word-extractor');
  const d = await new WordExtractor().extract(buf);
  return [d.getBody(), d.getFootnotes?.(), d.getHeaders?.()].filter(Boolean).join('\n');
}

async function hoja(buf: Buffer): Promise<string> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'buffer' });
  return wb.SheetNames.map((n) => `=== Hoja: ${n} ===\n${XLSX.utils.sheet_to_csv(wb.Sheets[n], { FS: ' | ', blankrows: false })}`).join('\n\n');
}

function html(buf: Buffer): string {
  const $ = cheerio.load(decodificarTexto(buf));
  $('script, style, noscript').remove();
  return $('body').text() || $.root().text();
}

let wasmUnrar: ArrayBuffer | null = null;
async function rarEntradas(buf: Buffer): Promise<Array<{ nombre: string; data: Buffer }>> {
  const { createExtractorFromData } = await import('node-unrar-js');
  if (!wasmUnrar) {
    const ruta = path.join(process.cwd(), 'node_modules/node-unrar-js/dist/js/unrar.wasm');
    const b = await readFile(ruta);
    wasmUnrar = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  }
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const ex = await createExtractorFromData({ data: ab, wasmBinary: wasmUnrar });
  const out: Array<{ nombre: string; data: Buffer }> = [];
  for (const f of ex.extract().files) {
    if (f.fileHeader.flags.directory || !f.extraction) continue;
    out.push({ nombre: f.fileHeader.name, data: Buffer.from(f.extraction) });
  }
  return out;
}

function zipEntradas(buf: Buffer): Array<{ nombre: string; data: Buffer }> {
  return new AdmZip(buf).getEntries()
    .filter((e) => !e.isDirectory && !e.entryName.startsWith('__MACOSX/'))
    .map((e) => ({ nombre: e.entryName, data: e.getData() }));
}

/** Detecta el tipo real por magic bytes (ARCE a veces publica con extensión equivocada). */
function tipoReal(buf: Buffer, ext: string): string {
  const h = buf.subarray(0, 8);
  if (h.subarray(0, 4).toString('latin1') === '%PDF') return 'pdf';
  if (h[0] === 0x50 && h[1] === 0x4b) return ['docx', 'xlsx', 'odt', 'ods'].includes(ext) ? ext : 'zip';
  if (h.subarray(0, 4).toString('latin1') === 'Rar!') return 'rar';
  if (h[0] === 0xd0 && h[1] === 0xcf && h[2] === 0x11 && h[3] === 0xe0) return ext === 'xls' ? 'xls' : 'doc';
  if (h.subarray(0, 6).toString('latin1') === '7z\xbc\xaf\x27\x1c') return '7z';
  if (/^\s*</.test(buf.subarray(0, 200).toString('latin1'))) return ext === 'xml' ? 'xml' : 'html';
  return ext;
}

/** Extrae texto de un archivo; si es ZIP/RAR, lo desarma recursivamente y devuelve cada archivo interno. */
export async function extraerTexto(nombre: string, buf: Buffer, contenedor: string | null = null, profundidad = 0): Promise<ArchivoExtraido[]> {
  const ext = extensionDe(nombre);
  const tipo = tipoReal(buf, ext);
  const base: Omit<ArchivoExtraido, 'texto' | 'estado'> = { nombre, extension: ext || tipo, contenedor, tamano: buf.length };
  try {
    if (tipo === 'zip' || tipo === 'rar') {
      if (profundidad >= MAX_PROFUNDIDAD) return [{ ...base, texto: null, estado: 'no_soportado', error: 'Archivo comprimido demasiado anidado' }];
      const entradas = tipo === 'zip' ? zipEntradas(buf) : await rarEntradas(buf);
      const res: ArchivoExtraido[] = [];
      for (const e of entradas.slice(0, MAX_ARCHIVOS)) res.push(...(await extraerTexto(path.basename(e.nombre), e.data, contenedor ? `${contenedor}/${nombre}` : nombre, profundidad + 1)));
      if (!res.length) return [{ ...base, texto: null, estado: 'error', error: 'Comprimido vacío' }];
      return res;
    }
    let texto: string | null = null;
    switch (tipo) {
      case 'pdf': texto = await pdf(buf); break;
      case 'docx': texto = await docx(buf); break;
      case 'odt': case 'ods': texto = odf(buf); break;
      case 'doc': texto = await doc(buf); break;
      case 'xls': case 'xlsx': case 'csv': texto = await hoja(buf); break;
      case 'html': case 'htm': case 'xml': texto = html(buf); break;
      case 'txt': case 'rtf': texto = decodificarTexto(buf).replace(/\\[a-z]+-?\d* ?|[{}]/g, ' '); break;
      default:
        return [{ ...base, texto: null, estado: 'no_soportado', error: `Formato .${tipo || 'desconocido'} no soportado` }];
    }
    texto = limpiar(texto ?? '');
    if (tipo === 'pdf' && texto.replace(/\[página \d+\]/g, '').trim().length < MIN_CHARS_PDF) {
      return [{ ...base, texto: null, estado: 'no_soportado', error: 'PDF sin texto (probablemente escaneado)' }];
    }
    return [{ ...base, texto, estado: 'ok' }];
  } catch (e) {
    return [{ ...base, texto: null, estado: 'error', error: (e as Error).message.slice(0, 300) }];
  }
}
