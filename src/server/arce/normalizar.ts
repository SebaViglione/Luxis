import { monedaDesdeId, type Moneda } from '@/lib/types';

// ---------- Tipos normalizados (salida del XML y del scraper) ----------

export interface ItemNormalizado {
  nroItem: number;
  idArticulo: number;
  descArticulo: string;
  descNormalizada: string;
  cantPedida: number | null;
  unidad: string | null;
  idMonedaCotiz: number | null;
  variante: string | null;
  presentacion: string | null;
  marca: string | null;
  atributos: Record<string, unknown>[] | null;
}

export interface AclaracionNormalizada {
  fecha: Date | null;
  texto: string | null;
  nomArchivo: string | null;
  url: string | null;
}

export interface AdjudicacionNormalizada {
  nroItem: number;
  idArticulo: number;
  descArticulo: string;
  descNormalizada: string;
  nroDocProv: string | null;
  nombreComercial: string | null;
  cantAdj: number | null;
  precioUnit: number | null;
  precioTotal: number | null;
  idMoneda: number;
  unidad: string | null;
}

export interface OferenteNormalizado {
  nroDocProv: string;
  nombreComercial: string | null;
}

export interface CompraNormalizada {
  idCompra: string;
  tipoCompra: string;
  subtipoCompra: string | null;
  numCompra: string | null;
  anioCompra: number | null;
  inciso: number | null;
  ue: number | null;
  objeto: string | null;
  estado: number | null;
  fechaPublicacion: Date | null;
  fechaUltMod: Date | null;
  fechaApertura: Date | null;
  fechaTopeOfertas: Date | null;
  fechaSolAclar: Date | null;
  fechaSolProrr: Date | null;
  fechaTopeEntrega: Date | null;
  lugarApertura: string | null;
  lugarEntrega: string | null;
  precioPliego: number | null;
  monedaPliego: number | null;
  nombreContacto: string | null;
  emailContacto: string | null;
  nombrePliego: string | null;
  urlDetalle: string;
  aperturaElectronica: boolean;
  fuente: 'xml' | 'scrape';
  /** Solo scraper: nombres tal cual el portal (el XML trae códigos de inciso/UE). */
  organismo?: string | null;
  unidadEjecutora?: string | null;
  fechaPubAdj: Date | null;
  montoAdj: number | null;
  items: ItemNormalizado[];
  aclaraciones: AclaracionNormalizada[];
  adjudicaciones: AdjudicacionNormalizada[];
  oferentes: OferenteNormalizado[];
  raw: unknown;
}

// ---------- Helpers ----------

export const BASE_ARCE = 'https://www.comprasestatales.gub.uy';
export const urlDetalleCompra = (idCompra: string) => `${BASE_ARCE}/consultas/detalle/mostrar-llamado/1/id/${idCompra}`;
export const urlPliego = (nombre: string) => `${BASE_ARCE}/Pliegos/${encodeURIComponent(nombre)}`;
export const urlAclaracion = (nombre: string) => `${BASE_ARCE}/Aclaraciones/${encodeURIComponent(nombre)}`;
export const urlResolucion = (nombre: string) => `${BASE_ARCE}/Resoluciones/${encodeURIComponent(nombre)}`;

/** Sin tildes, mayúsculas, espacios colapsados. Base para matching de keywords y agrupación de precios. */
export function normalizarTexto(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9ÑÇ%.,/()\-+ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Decodifica entidades numéricas que ARCE deja escapadas (&#xA; &#233; …). */
export function decodificarEntidades(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

export function textoONull(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = decodificarEntidades(String(v)).replace(/[ \t]+/g, ' ').trim();
  return s.length ? s : null;
}

export function numONull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function entONull(v: unknown): number | null {
  const n = numONull(v);
  return n === null ? null : Math.trunc(n);
}

const RX_FECHA = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;
const LIMITE_FUTURO_MS = 3 * 365 * 24 * 3600 * 1000;

/** "DD/MM/YYYY HH:MM[:SS]" en hora de Montevideo (UTC-3, sin horario de verano) → Date. Descarta fechas basura (> hoy + 3 años). */
export function parseFechaArce(v: unknown): Date | null {
  if (!v) return null;
  const m = RX_FECHA.exec(String(v).trim());
  if (!m) return null;
  const [, dd, mm, yyyy, hh = '00', mi = '00', ss = '00'] = m;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${hh.padStart(2, '0')}:${mi}:${ss}-03:00`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now() + LIMITE_FUTURO_MS) return null;
  return d;
}

export function monedaDeCompra(id: number | null): Moneda {
  return monedaDesdeId(id);
}
