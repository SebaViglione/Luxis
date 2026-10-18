// Constantes del onboarding compartidas entre servidor y cliente (sin dependencias de servidor).
import type { EstadoDoc, Moneda, TipoDoc } from '@/lib/types';

export const DEPARTAMENTOS_UY = [
  'Artigas',
  'Canelones',
  'Cerro Largo',
  'Colonia',
  'Durazno',
  'Flores',
  'Florida',
  'Lavalleja',
  'Maldonado',
  'Montevideo',
  'Paysandú',
  'Río Negro',
  'Rivera',
  'Rocha',
  'Salto',
  'San José',
  'Soriano',
  'Tacuarembó',
  'Treinta y Tres',
] as const;

export const UNIDADES = ['bolsa', 'unidad', 'm3', 'kg', 'tonelada', 'm2', 'metro', 'rollo', 'litro'] as const;

export const MONEDAS: Moneda[] = ['UYU', 'USD', 'UI', 'UR', 'OTRA'];

export const TIPOS_DOC_BASE: Exclude<TipoDoc, 'OTRO'>[] = ['RUPE', 'DGI', 'BPS', 'BSE', 'UNIT', 'ISO'];

export const NOMBRE_DOC: Record<TipoDoc, string> = {
  RUPE: 'RUPE activo',
  DGI: 'Certificado único DGI',
  BPS: 'Certificado BPS',
  BSE: 'Seguro BSE (accidentes de trabajo)',
  UNIT: 'Certificación UNIT',
  ISO: 'Certificación ISO',
  OTRO: 'Otro documento',
};

export const ESTADOS_DOC: { valor: EstadoDoc; etiqueta: string }[] = [
  { valor: 'vigente', etiqueta: 'Vigente' },
  { valor: 'en_tramite', etiqueta: 'En trámite' },
  { valor: 'no_tiene', etiqueta: 'No tiene' },
  { valor: 'vencido', etiqueta: 'Vencido' },
  { valor: 'desconocido', etiqueta: 'Sin dato' },
];

// Límites de carga de fuentes (RF-03).
export const MAX_ARCHIVOS = 5;
export const MAX_BYTES_ARCHIVO = 10 * 1024 * 1024;
export const EXTENSIONES_PERMITIDAS = ['pdf', 'docx', 'xlsx', 'xls', 'csv', 'html', 'htm', 'txt'] as const;

// Máximo de preguntas de la entrevista (RF-04).
export const MAX_PREGUNTAS_ENTREVISTA = 8;

// Duración máxima de la entrevista por voz: cuida los minutos compartidos de ElevenLabs.
export const DURACION_MAXIMA_VOZ_S = 4 * 60;
