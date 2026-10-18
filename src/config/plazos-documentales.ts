import type { TipoDoc } from '@/lib/types';

export interface PlazoDocumental {
  tipo: TipoDoc | 'OTRO';
  patrones: RegExp[];      // sobre el nombre del requisito normalizado (sin tildes, mayúsculas)
  diasHabiles: number;     // estimación para obtenerlo si no se tiene
  alcanzable: boolean;     // false = no se consigue en el plazo de una licitación
  nota: string;
  /** Lo arma Luxis en la Postulación (formularios, declaraciones, planilla, especificación): cuenta como que se tiene. */
  preparaLuxis?: boolean;
  /** No es un papel: es el envío de la oferta (lo hace la empresa con lo que arma Luxis). */
  envio?: boolean;
  /** Se exige después de la adjudicación: no frena la oferta. */
  postAdjudicacion?: boolean;
  /** No es un papel: son reglas generales (Pliego Único, TOCAF) que se aceptan al ofertar. */
  reglasGenerales?: boolean;
  /** Visita obligatoria: depende de la fecha de la visita, no de un trámite. */
  visita?: boolean;
  /** Muestras o compra del pliego: Postulación ya los muestra con su fecha o su precio. */
  muestras?: boolean;
  pagoPliego?: boolean;
}

// Notas que la pantalla usa para agrupar los papeles (Papeles, Postulación, avisos).
export const NOTA_REGLAS_GENERALES = 'No es un papel para presentar: son las reglas generales de las compras del Estado. Se aceptan al ofertar.';
export const NOTA_POST_ADJUDICACION = 'Se exige después de la adjudicación o en la entrega: no frena tu oferta.';
export const NOTA_PREPARA_LUXIS = 'Lo prepara Luxis en Postulación.';
export const NOTA_ENVIO = 'No es un papel: es el envío. La oferta la cargás vos en ARCE (o como pida el pliego) con lo que prepara Luxis en Postulación.';
export const NOTA_SIN_DATO = 'No nos dijiste si lo tenés: si ya lo tenés, marcalo en Cuenta.';

// Un formulario, declaración o constancia que nombra al TOCAF o al Pliego Único sí se presenta.
const NO_ES_ENTREGABLE = '^(?!.*(FORMULARIO|DECLARACION|ANEXO|CONSTANCIA|CERTIFICAD|PLANILLA))';
// Lo que arma Luxis se reconoce por palabras sueltas (marca, origen, IVA, anexo…) que también aparecen en
// papeles que Luxis no puede armar: un certificado, una constancia, un pago o una garantía nunca son de Luxis.
const NO_LO_ARMA_LUXIS = '^(?!.*(CERTIFICAD|CONSTANCIA|COMPROBANTE|GARANTIA|PAGO|MUESTRA|FOLLET|CATALOGO|FICHA|VISITA|HABILITACION|REGISTRO NACIONAL|INSCRIPCION EN EL REGISTRO))';
const luxis = (fuente: string) => new RegExp(`${NO_LO_ARMA_LUXIS}.*(${fuente})`);

// El orden importa: gana el primer patrón que matchea. Lo post-adjudicación y los papeles concretos (visita, muestras,
// fichas, certificados) van antes que lo que arma Luxis, que se reconoce por palabras más generales.
export const PLAZOS_DOCUMENTALES: PlazoDocumental[] = [
  { tipo: 'OTRO', patrones: [new RegExp(`${NO_ES_ENTREGABLE}.*(PLIEGO UNICO|CONDICIONES GENERALES|\\bTOCAF\\b|DECRETO 131|RESOLUCION N?\\.? ?3989)`)],
    diasHabiles: 0, alcanzable: true, reglasGenerales: true, nota: NOTA_REGLAS_GENERALES },
  { tipo: 'OTRO', patrones: [/FIEL CUMPLIMIENTO/, /CUMPLIMIENTO DE CONTRATO/, /GARANTIA DE CUMPLIMIENTO/, /CUMPLIMIENTO DEL CONTRATO/,
    /GARANTIA (POR |DE )?(RESPONSABILIDAD LABORAL|CONSERVACION)/, /AL MOMENTO DE (LA )?ADJUDICACION/,
    // Una declaración de plazo "desde la orden de compra" se presenta con la oferta: no es post-adjudicación.
    /^(?!.*(DECLARACION|PLAZO DE ENTREGA|FORMULARIO|PLANILLA)).*(REMITO|FACTURA|AL MOMENTO DE LA ENTREGA|ORDEN DE COMPRA|CONSTANCIA DE ENTREGA)/],
    diasHabiles: 3, alcanzable: true, postAdjudicacion: true, nota: NOTA_POST_ADJUDICACION },
  { tipo: 'OTRO', patrones: [/GARANTIA DE MANTENIMIENTO/, /GARANTIA DE OFERTA/, /GARANTIA .*MANTENIMIENTO/], diasHabiles: 3, alcanzable: true, nota: 'Banco o aseguradora: 1 a 3 días hábiles.' },
  // Presentar la oferta no es un papel: es el envío, que hace la empresa (en ARCE o como diga el pliego) con lo que arma Luxis.
  // ("Formulario/carta de presentación de la oferta" sí es un papel: sigue en la regla de Luxis.)
  { tipo: 'OTRO', patrones: [/^(?!.*(FORMULARIO|CARTA|NOTA|PLANILLA|DECLARACION|ANEXO)).*(OFERTA ENVIADA|OFERTA POR CORREO|OFERTA EN LINEA|PRESENTACION DE (LA )?OFERTA|CARGAR? (DE )?(LA )?OFERTA|OFERTA (INGRESADA|PRESENTADA|CARGADA)|OFERTA EN (ORIGINAL|PAPEL|SOBRE)|INGRES(O|AR) DE (LA )?OFERTA|DOCUMENTACION DE LA OFERTA EN|COTIZACION (ENVIADA|POR CORREO|INGRESADA|PRESENTADA)|ENVIAD[AO] POR (CORREO|MAIL|E-?MAIL))/],
    diasHabiles: 0, alcanzable: true, preparaLuxis: true, envio: true, nota: NOTA_ENVIO },
  { tipo: 'OTRO', patrones: [/VISITA/], diasHabiles: 0, alcanzable: true, visita: true, nota: 'Hay que ir a la visita y pedir la constancia: se adjunta a la oferta.' },
  { tipo: 'OTRO', patrones: [/MUESTRA/], diasHabiles: 2, alcanzable: true, muestras: true, nota: 'Logística de entrega de muestras.' },
  { tipo: 'OTRO', patrones: [/CERTIFICADO DE ORIGEN/, /ORIGEN DE (LOS )?(MATERIALES|BIENES|PRODUCTOS)/], diasHabiles: 5, alcanzable: true,
    nota: 'Lo emite una entidad certificadora (por ejemplo, la Cámara de Industrias). Solo hace falta si pedís la preferencia por producto nacional.' },
  { tipo: 'OTRO', patrones: [/(PAGO|COMPRA|ADQUISICION) DEL PLIEGO/, /COMPROBANTE DE (PAGO|COMPRA)/], diasHabiles: 1, alcanzable: true, pagoPliego: true,
    nota: 'El pliego se paga en el organismo antes de la apertura: guardá el comprobante.' },
  { tipo: 'OTRO', patrones: [/FICHA TECNICA/, /CERTIFICADO DE MARCA/, /CATALOGO/, /FOLLET/, /MANUAL(ES)? DE/, /INFORMACION TECNICA/], diasHabiles: 1, alcanzable: true,
    nota: 'Lo provee el fabricante o importador (en general está en su web).' },
  { tipo: 'OTRO', patrones: [/ANTECEDENTES/, /REFERENCIAS/], diasHabiles: 3, alcanzable: true, nota: 'Cartas de clientes: 1 a 3 días hábiles.' },
  { tipo: 'OTRO', patrones: [luxis('FORMULARIO|DECLARACION|PLANILLA|ESPECIFICACION|ESPECIFICAR|OFERTA TECNICA|OFERTA ECONOMICA|CARTA DE PRESENTACION|NOTA DE PRESENTACION'
    + '|\\bANEXO\\b|DATOS (DE LA EMPRESA|DEL OFERENTE|IDENTIFICATORIOS)|IDENTIFICACION DEL OFERENTE|RAZON SOCIAL|DOMICILIO|NOTIFICACIONES'
    + '|DETALLE DE (PRECIO|MONTO)|DETALLES? TECNICOS?|PRECIO UNITARIO|COTIZACION|\\bIVA\\b|IMPUESTOS|PLAZO DE (ENTREGA|MANTENIMIENTO)|\\bMARCA\\b|\\bORIGEN\\b|PROCEDENCIA'
    + '|IDENTIFICACION DEL (REPUESTO|PRODUCTO|ARTICULO|BIEN)|ACEPTACION DEL PLIEGO|MANTENIMIENTO DE (LA )?OFERTA|RUBRADO'
    + '|PROPUESTA (ECONOMICA|TECNICA|DE PRECIO)|OFERTA COTIZADA|OFERTA (DE|CON) PRECIO')],
    diasHabiles: 0, alcanzable: true, preparaLuxis: true, nota: NOTA_PREPARA_LUXIS },
  { tipo: 'OTRO', patrones: [/HABILITACION/, /REGISTRO NACIONAL DE EMPRESAS/, /\bRNEOP\b/, /REGISTRO DE EMPRESAS CONTRATISTAS/], diasHabiles: 20, alcanzable: false,
    nota: 'Habilitación o registro ante un organismo (MSP, Bomberos, MTOP, Intendencia): lleva semanas.' },
  { tipo: 'RUPE', patrones: [/RUPE/, /R\.U\.P\.E/, /REGISTRO UNICO DE PROVEEDORES/], diasHabiles: 1, alcanzable: true,
    nota: 'Inscripción en línea: con quedar EN INGRESO ya podés ofertar (1 día hábil). Para que te adjudiquen tiene que estar ACTIVO.' },
  // BPS antes que DGI: algunos pliegos llaman "Certificado Único" al de BPS.
  { tipo: 'BPS', patrones: [/BPS/, /BANCO DE PREVISION/, /SEGURIDAD SOCIAL/], diasHabiles: 0, alcanzable: true, nota: 'Se descarga en línea si la empresa está al día.' },
  { tipo: 'DGI', patrones: [/DGI/, /CERTIFICADO UNICO/, /VIGENCIA ANUAL/], diasHabiles: 0, alcanzable: true, nota: 'Se descarga en línea si la empresa está al día.' },
  { tipo: 'BSE', patrones: [/BSE/, /BANCO DE SEGUROS/, /ACCIDENTES DE TRABAJO/], diasHabiles: 3, alcanzable: true, nota: 'Contratación o renovación de póliza: 1 a 3 días hábiles.' },
  { tipo: 'OTRO', patrones: [/NOTARIAL/, /ESCRIBAN/, /REPRESENTACION/, /\bPODER(ES)?\b/, /PERSONERIA/, /CONSTITUCION, OBJETO/], diasHabiles: 2, alcanzable: true,
    nota: 'Lo hace un escribano: 1 a 2 días hábiles. Si ya está cargado en RUPE, no hace falta.' },
  // Una norma que tiene que cumplir el producto (ej. UNIT 20 del portland) la acredita el fabricante; no es una certificación de la empresa.
  { tipo: 'OTRO', patrones: [/^(?!.*DECLARACION).*(CUMPL(A|IR|IMIENTO) (DE |CON )?(LA |LAS )?NORMAS?|SEGUN (LA )?NORMA|NORMA (UNIT|ISO|ASTM|IEC)[ -]?\d)/],
    diasHabiles: 3, alcanzable: true, nota: 'Es una norma del producto: alcanza con el certificado o la ficha técnica del fabricante.' },
  { tipo: 'UNIT', patrones: [/\bUNIT\b/, /NORMA UNIT/, /CERTIFICACION UNIT/], diasHabiles: 60, alcanzable: false, nota: 'Certificación de producto: meses. No alcanzable dentro del plazo de un llamado.' },
  { tipo: 'ISO', patrones: [/ISO ?9001/, /ISO ?14001/, /\bISO\b/], diasHabiles: 90, alcanzable: false, nota: 'Certificación de sistema de gestión: meses.' },
];

export const PLAZO_POR_DEFECTO: PlazoDocumental = { tipo: 'OTRO', patrones: [], diasHabiles: 1, alcanzable: true, nota: 'Documento genérico: se consigue en 1 día hábil.' };

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

export function buscarPlazo(nombreRequisito: string): PlazoDocumental {
  const n = normalizar(nombreRequisito);
  return PLAZOS_DOCUMENTALES.find((p) => p.patrones.some((rx) => rx.test(n))) ?? PLAZO_POR_DEFECTO;
}

/**
 * ¿El detalle dice que se pide recién al adjudicatario, para empezar la obra, al entregar o al cobrar?
 * Esos papeles son obligatorios, pero no para ofertar: no frenan la oferta.
 */
export function sePideDespuesDeAdjudicar(detalle: string | null | undefined): boolean {
  if (!detalle) return false;
  const d = normalizar(detalle);
  return /^(SI TE ADJUDICAN|AL ADJUDICATARIO|DESPUES DE ADJUDICAR|ANTES DE EMPEZAR)/.test(d.trim())
    || /(EXIGID[OA]|SOLO|EXIGIBLE|PEDID[OA]|SOLICITAD[OA]|REQUERID[OA]) (UNICAMENTE )?(AL|PARA EL|A LOS?|PARA LOS) (POTENCIALES )?ADJUDICATARIOS?/.test(d)
    || /SI RESULTA(RA)? ADJUDICATARI|EN CASO DE (RESULTAR )?ADJUDICA|DE NOTIFICADA LA ADJUDICACION|DESDE LA NOTIFICACION DE (LA )?ADJUDICACION|LUEGO DE (LA )?ADJUDICACION|PREVIO A LA ADJUDICACION/.test(d)
    || /ANTES DE(L)? (INICIO|COMENZAR|EMPEZAR|INICIAR)|PARA INICIAR LAS OBRAS|INICIO DE LOS TRABAJOS|DURANTE LA EJECUCION|ETAPA DE EJECUCION|AL MOMENTO DEL COBRO|PARA (PROCEDER AL |EL )?PAGO|PARA COBRAR/.test(d);
}

/**
 * ¿El "requisito" es en realidad un documento de la propia licitación (pliego, bases y condiciones, TOCAF, decretos)?
 * Esos se leen, no se entregan: no van en Papeles. Los formularios, anexos o declaraciones del pliego sí son entregables.
 */
export function esDocumentoDeLaLicitacion(nombre: string): boolean {
  const n = normalizar(nombre).trim();
  if (/FORMULARIO|ANEXO|DECLARACION|ACEPTACION|CONSTANCIA|CERTIFICADO|PLANILLA|PAGO|COMPROBANTE|(COMPRA|ADQUISICION) DEL PLIEGO/.test(n)) return false;
  return /^(EL |LA )?(PLIEGO|BASES Y CONDICIONES|CONDICIONES (GENERALES|PARTICULARES)|TOCAF|DECRETO|RESOLUCION|LEY )/.test(n)
    || /PLIEGO UNICO DE BASES/.test(n);
}
