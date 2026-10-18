import type { TipoDoc } from '@/lib/types';

export interface PlazoDocumental {
  tipo: TipoDoc | 'OTRO';
  patrones: RegExp[];      // sobre el nombre del requisito normalizado (sin tildes, mayúsculas)
  diasHabiles: number;     // estimación para obtenerlo si no se tiene
  alcanzable: boolean;     // false = no se consigue en el plazo de una licitación
  nota: string;
  /** Lo arma Luxis en la Postulación (formularios, declaraciones, planilla, especificación): cuenta como que se tiene. */
  preparaLuxis?: boolean;
  /** Se exige después de la adjudicación: no frena la oferta. */
  postAdjudicacion?: boolean;
  /** No es un papel: son reglas generales (Pliego Único, TOCAF) que se aceptan al ofertar. */
  reglasGenerales?: boolean;
}

// El orden importa: gana el primer patrón que matchea. Lo que arma Luxis y lo post-adjudicación va primero
// (ej. "Formulario de identificación del oferente validado en RUPE" es un formulario, no RUPE).
export const PLAZOS_DOCUMENTALES: PlazoDocumental[] = [
  { tipo: 'OTRO', patrones: [/PLIEGO UNICO/, /CONDICIONES GENERALES/, /\bTOCAF\b/, /DECRETO 131/, /RESOLUCION N?\.? ?3989/],
    diasHabiles: 0, alcanzable: true, reglasGenerales: true,
    nota: 'No es un papel para presentar: son las reglas generales de las compras del Estado. Se aceptan al ofertar.' },
  { tipo: 'OTRO', patrones: [/FIEL CUMPLIMIENTO/, /CUMPLIMIENTO DE CONTRATO/, /GARANTIA DE CUMPLIMIENTO/, /CUMPLIMIENTO DEL CONTRATO/,
    /REMITO/, /FACTURA/, /AL MOMENTO DE LA ENTREGA/, /ORDEN DE COMPRA/, /CONSTANCIA DE ENTREGA/],
    diasHabiles: 3, alcanzable: true, postAdjudicacion: true, nota: 'Se exige después de la adjudicación o en la entrega: no frena tu oferta.' },
  { tipo: 'OTRO', patrones: [/GARANTIA DE MANTENIMIENTO/, /GARANTIA DE OFERTA/, /GARANTIA .*MANTENIMIENTO/], diasHabiles: 3, alcanzable: true, nota: 'Banco o aseguradora: 1 a 3 días hábiles.' },
  // Presentar la oferta no es un papel: es el envío, que hace la empresa (en ARCE o como diga el pliego) con lo que arma Luxis.
  // ("Formulario/carta de presentación de la oferta" sí es un papel: sigue en la regla de abajo.)
  { tipo: 'OTRO', patrones: [/^(?!.*(FORMULARIO|CARTA|NOTA|PLANILLA|DECLARACION|ANEXO)).*(OFERTA ENVIADA|OFERTA POR CORREO|OFERTA EN LINEA|PRESENTACION DE (LA )?OFERTA|CARGAR? (DE )?(LA )?OFERTA)/],
    diasHabiles: 0, alcanzable: true, preparaLuxis: true,
    nota: 'No es un papel: es el envío. La oferta la cargás vos en ARCE (o como pida el pliego) con lo que prepara Luxis en Postulación.' },
  { tipo: 'OTRO', patrones: [/FORMULARIO/, /DECLARACION/, /PLANILLA/, /ESPECIFICACION/, /ESPECIFICAR/, /OFERTA TECNICA/, /OFERTA ECONOMICA/,
    /CARTA DE PRESENTACION/, /NOTA DE PRESENTACION/, /ANEXO/, /DATOS (DE LA EMPRESA|DEL OFERENTE|IDENTIFICATORIOS)/, /IDENTIFICACION DEL OFERENTE/, /RAZON SOCIAL/,
    /DETALLE DE (PRECIO|MONTO)/, /PRECIO UNITARIO/, /COTIZACION/, /\bIVA\b/, /IMPUESTOS/, /PLAZO DE (ENTREGA|MANTENIMIENTO)/, /MARCA/, /ORIGEN/,
    /IDENTIFICACION DEL (REPUESTO|PRODUCTO|ARTICULO|BIEN)/, /ACEPTACION DEL PLIEGO/, /MANTENIMIENTO DE (LA )?OFERTA/,
    /PROPUESTA (ECONOMICA|TECNICA|DE PRECIO)/, /OFERTA COTIZADA/, /OFERTA (DE|CON) PRECIO/],
    diasHabiles: 0, alcanzable: true, preparaLuxis: true, nota: 'Lo prepara Luxis en Postulación.' },
  { tipo: 'RUPE', patrones: [/RUPE/, /REGISTRO UNICO DE PROVEEDORES/], diasHabiles: 5, alcanzable: true, nota: 'Inscripción en línea y validación de documentación; 1 a 5 días hábiles (10 si falta documentación). "En ingreso" alcanza para ofertar.' },
  { tipo: 'DGI', patrones: [/DGI/, /CERTIFICADO UNICO/, /VIGENCIA ANUAL/], diasHabiles: 0, alcanzable: true, nota: 'Se descarga en línea si la empresa está al día.' },
  { tipo: 'BPS', patrones: [/BPS/, /BANCO DE PREVISION/], diasHabiles: 0, alcanzable: true, nota: 'Se descarga en línea si la empresa está al día.' },
  { tipo: 'BSE', patrones: [/BSE/, /BANCO DE SEGUROS/, /ACCIDENTES DE TRABAJO/], diasHabiles: 3, alcanzable: true, nota: 'Contratación o renovación de póliza: 1 a 3 días hábiles.' },
  { tipo: 'OTRO', patrones: [/ANTECEDENTES/, /REFERENCIAS/], diasHabiles: 3, alcanzable: true, nota: 'Cartas de clientes: 1 a 3 días hábiles.' },
  { tipo: 'OTRO', patrones: [/FICHA TECNICA/, /CERTIFICADO DE MARCA/, /CATALOGO/, /FOLLETO/], diasHabiles: 3, alcanzable: true, nota: 'Lo provee el fabricante o importador.' },
  { tipo: 'OTRO', patrones: [/MUESTRA/], diasHabiles: 2, alcanzable: true, nota: 'Logística de entrega de muestras.' },
  { tipo: 'UNIT', patrones: [/\bUNIT\b/, /NORMA UNIT/, /CERTIFICACION UNIT/], diasHabiles: 60, alcanzable: false, nota: 'Certificación de producto: meses. No alcanzable dentro del plazo de un llamado.' },
  { tipo: 'ISO', patrones: [/ISO ?9001/, /ISO ?14001/, /\bISO\b/], diasHabiles: 90, alcanzable: false, nota: 'Certificación de sistema de gestión: meses.' },
  { tipo: 'OTRO', patrones: [/VISITA/], diasHabiles: 0, alcanzable: true, nota: 'Fecha fija: depende de que la visita no haya pasado.' },
];

export const PLAZO_POR_DEFECTO: PlazoDocumental = { tipo: 'OTRO', patrones: [], diasHabiles: 1, alcanzable: true, nota: 'Documento genérico: se consigue en 1 día hábil.' };

export function buscarPlazo(nombreRequisito: string): PlazoDocumental {
  const n = nombreRequisito.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return PLAZOS_DOCUMENTALES.find((p) => p.patrones.some((rx) => rx.test(n))) ?? PLAZO_POR_DEFECTO;
}

/**
 * ¿El "requisito" es en realidad un documento de la propia licitación (pliego, bases y condiciones, TOCAF, decretos)?
 * Esos se leen, no se entregan: no van en Papeles. Los formularios, anexos o declaraciones del pliego sí son entregables.
 */
export function esDocumentoDeLaLicitacion(nombre: string): boolean {
  const n = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  if (/FORMULARIO|ANEXO|DECLARACION|ACEPTACION|CONSTANCIA|CERTIFICADO|PLANILLA/.test(n)) return false;
  return /^(EL |LA )?(PLIEGO|BASES Y CONDICIONES|CONDICIONES (GENERALES|PARTICULARES)|TOCAF|DECRETO|RESOLUCION|LEY )/.test(n)
    || /PLIEGO UNICO DE BASES/.test(n);
}
