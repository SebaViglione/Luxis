import type { CategoriaArchivo, Moneda } from '@/lib/types';

const TZ = 'America/Montevideo';
const fmtFecha = new Intl.DateTimeFormat('es-UY', {
  timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const fmtNumero = new Intl.NumberFormat('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCantidad = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 2 });

function simbolo(moneda: Moneda): string {
  return moneda === 'UYU' ? '$' : moneda === 'USD' ? 'US$' : moneda;
}

function partes(iso: string) {
  return Object.fromEntries(fmtFecha.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
}

export function fechaHora(iso: string | null): string {
  if (!iso) return '—';
  const p = partes(iso);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

export function fecha(iso: string | null): string {
  if (!iso) return '—';
  const p = partes(iso);
  return `${p.day}/${p.month}/${p.year}`;
}

export function fechaCorta(iso: string | null): string {
  if (!iso) return '—';
  const p = partes(iso);
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`;
}

export function monto(valor: number | null, moneda: Moneda = 'UYU'): string {
  if (valor === null) return '—';
  return `${simbolo(moneda)} ${fmtNumero.format(valor)}`;
}

/** Monto sin decimales de relleno ("$ 6.000", "$ 161,7"): para ejes de gráficos y rótulos chicos. */
export function montoCorto(valor: number, moneda: Moneda = 'UYU'): string {
  return `${simbolo(moneda)} ${fmtCantidad.format(valor)}`;
}

export function cantidad(valor: number): string {
  return fmtCantidad.format(valor);
}

export function diasHasta(iso: string | null, ahora: number): number | null {
  if (!iso) return null;
  return Math.ceil((Date.parse(iso) - ahora) / 864e5);
}

export function textoCierre(dias: number | null): string {
  if (dias === null) return 'sin fecha de cierre';
  if (dias < 0) return 'cerrada';
  if (dias === 0) return 'cierra hoy';
  if (dias === 1) return 'cierra mañana';
  return `cierra en ${dias} días`;
}

export function textoFaltan(dias: number | null): string {
  if (dias === null) return '';
  if (dias < 0) return dias === -1 ? 'fue ayer' : `fue hace ${-dias} días`;
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  return `faltan ${dias} días`;
}

export function tamano(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} MB`;
}

export const CATEGORIA_ARCHIVO: Record<CategoriaArchivo, string> = {
  pliego_particular: 'Pliego particular',
  pliego_general: 'Pliego general',
  memoria: 'Memoria técnica',
  aclaracion: 'Aclaración',
  formulario: 'Formulario',
  planilla: 'Planilla',
  plano: 'Plano',
  otro: 'Otro',
};

export function capitalizar(texto: string): string {
  const t = texto.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ARCE publica muchos objetos e ítems en mayúsculas sostenidas; se pasan a oración para que se lean.
export function suavizarMayusculas(texto: string): string {
  const letras = texto.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
  if (!letras) return texto;
  const mayus = letras.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length;
  return mayus / letras.length > 0.6 ? capitalizar(texto.trim()) : texto.trim();
}

const SIGLAS = new Set(['S', 'A', 'SA', 'SRL', 'LTDA', 'SAS', 'SACIF', 'SACI', 'CIA', 'UTE', 'SC', 'SCA', 'SRLA', 'RUT', 'IM', 'MTOP', 'MSP', 'ANEP', 'UTU', 'OSE', 'UTE', 'ANTEL', 'BPS', 'BSE', 'ASSE', 'UDELAR', 'INAU', 'MIDES', 'MGAP', 'MEC', 'MDN', 'MI']);
const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'el', 'en', 'para', 'por', 'con', 'o', 'u', 'al', 'a']);

// Nombres de empresas y organismos que ARCE publica en mayúsculas sostenidas: "LAGO DORVAL S A" → "Lago Dorval S A".
export function nombrePropio(texto: string): string {
  const t = texto.trim();
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, '');
  if (!letras || letras.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, '').length / letras.length < 0.6) return t;
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((palabra, i) => {
      const limpia = palabra.replace(/[.,;:()"']/g, '').toUpperCase();
      if (SIGLAS.has(limpia)) return palabra.toUpperCase();
      if (i > 0 && MENORES.has(palabra)) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
}
