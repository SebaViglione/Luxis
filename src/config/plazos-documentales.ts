import type { TipoDoc } from '@/lib/types';

export interface PlazoDocumental {
  tipo: TipoDoc | 'OTRO';
  patrones: RegExp[];      // sobre el nombre del requisito normalizado (sin tildes, mayúsculas)
  diasHabiles: number;     // estimación para obtenerlo si no se tiene
  alcanzable: boolean;     // false = no se consigue en el plazo de una licitación
  nota: string;
}

export const PLAZOS_DOCUMENTALES: PlazoDocumental[] = [
  { tipo: 'RUPE', patrones: [/RUPE/, /REGISTRO UNICO DE PROVEEDORES/], diasHabiles: 5, alcanzable: true, nota: 'Inscripción en línea y validación de documentación; 1 a 5 días hábiles (10 si falta documentación).' },
  { tipo: 'DGI', patrones: [/DGI/, /CERTIFICADO UNICO/, /VIGENCIA ANUAL/], diasHabiles: 0, alcanzable: true, nota: 'Se descarga en línea si la empresa está al día.' },
  { tipo: 'BPS', patrones: [/BPS/, /BANCO DE PREVISION/], diasHabiles: 0, alcanzable: true, nota: 'Se descarga en línea si la empresa está al día.' },
  { tipo: 'BSE', patrones: [/BSE/, /BANCO DE SEGUROS/, /ACCIDENTES DE TRABAJO/], diasHabiles: 3, alcanzable: true, nota: 'Contratación o renovación de póliza: 1 a 3 días hábiles.' },
  { tipo: 'OTRO', patrones: [/GARANTIA DE MANTENIMIENTO/, /GARANTIA DE OFERTA/], diasHabiles: 3, alcanzable: true, nota: 'Banco o aseguradora: 1 a 3 días hábiles.' },
  { tipo: 'OTRO', patrones: [/GARANTIA DE FIEL CUMPLIMIENTO/], diasHabiles: 3, alcanzable: true, nota: 'Se exige después de la adjudicación.' },
  { tipo: 'OTRO', patrones: [/FORMULARIO DE IDENTIFICACION/, /DECLARACION JURADA/, /ANEXO/, /FORMULARIO/], diasHabiles: 0, alcanzable: true, nota: 'Se completa y firma.' },
  { tipo: 'OTRO', patrones: [/ANTECEDENTES/, /REFERENCIAS/], diasHabiles: 3, alcanzable: true, nota: 'Cartas de clientes: 1 a 3 días hábiles.' },
  { tipo: 'OTRO', patrones: [/FICHA TECNICA/, /CERTIFICADO DE MARCA/, /CATALOGO/, /FOLLETO/], diasHabiles: 3, alcanzable: true, nota: 'Lo provee el fabricante o importador.' },
  { tipo: 'OTRO', patrones: [/MUESTRA/], diasHabiles: 2, alcanzable: true, nota: 'Logística de entrega de muestras.' },
  { tipo: 'UNIT', patrones: [/UNIT/, /NORMA UNIT/], diasHabiles: 60, alcanzable: false, nota: 'Certificación de producto: meses. No alcanzable dentro del plazo de un llamado.' },
  { tipo: 'ISO', patrones: [/ISO ?9001/, /ISO ?14001/, /\bISO\b/], diasHabiles: 90, alcanzable: false, nota: 'Certificación de sistema de gestión: meses.' },
  { tipo: 'OTRO', patrones: [/VISITA/], diasHabiles: 0, alcanzable: true, nota: 'Fecha fija: depende de que la visita no haya pasado.' },
];

export const PLAZO_POR_DEFECTO: PlazoDocumental = { tipo: 'OTRO', patrones: [], diasHabiles: 2, alcanzable: true, nota: 'Documento genérico: 1 a 2 días hábiles.' };

export function buscarPlazo(nombreRequisito: string): PlazoDocumental {
  const n = nombreRequisito.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return PLAZOS_DOCUMENTALES.find((p) => p.patrones.some((rx) => rx.test(n))) ?? PLAZO_POR_DEFECTO;
}
