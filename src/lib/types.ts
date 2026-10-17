// Tipos compartidos entre módulos. Dueño: seba. Cambios solo por pedido en el canal del equipo.

export type Moneda = 'UYU' | 'USD' | 'UI' | 'UR' | 'OTRA';
export type EstadoDoc = 'vigente' | 'en_tramite' | 'no_tiene' | 'desconocido' | 'vencido';
export type TipoDoc = 'RUPE' | 'DGI' | 'BPS' | 'BSE' | 'UNIT' | 'ISO' | 'OTRO';

// ---------- Empresa ----------
export interface ProductoEmpresa {
  nombre: string;
  categoria: string;
  unidad: string;
  precioReferencia: number | null;
  moneda: Moneda;
  keywords: string[];
  fuente: 'documento' | 'entrevista' | 'manual';
}
export interface DocumentoEmpresa {
  tipo: TipoDoc;
  nombre: string;
  estado: EstadoDoc;
  vencimiento: string | null;
  notas?: string;
}
export interface PerfilEmpresa {
  nombre: string;
  razonSocial?: string;
  rut?: string;
  departamento?: string;
  localidad?: string;
  web?: string;
  telefono?: string;
  emailContacto?: string;
  descripcion: string;
  productos: ProductoEmpresa[];
  zonasEntrega: string[];
  capacidadNotas?: string;
  montoMinimo?: number | null;
  documentacion: DocumentoEmpresa[];
  experienciaLicitaciones?: string;
  organismosInteres?: string[];
  camposFaltantes: string[];
}

// ---------- Licitación ----------
export type CategoriaArchivo = 'pliego_particular' | 'pliego_general' | 'memoria' | 'aclaracion' | 'formulario' | 'planilla' | 'plano' | 'otro';
export type EstadoExtraccion = 'pendiente' | 'ok' | 'no_soportado' | 'error';

export interface ItemLicitacion {
  nroItem: number;
  idArticulo: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
  moneda: Moneda;
  variante?: string;
  presentacion?: string;
  marca?: string;
}
export interface ArchivoLicitacion {
  id: number;
  nombre: string;
  url: string;
  extension: string;
  tamano: number | null;
  contenedor: string | null;
  categoria: CategoriaArchivo;
  relevante: boolean;
  estadoExtraccion: EstadoExtraccion;
  error?: string | null;
  caracteres: number | null;
}
export interface ItemOfertable {
  nroItem: number;
  descripcion: string;
  puedeOfertar: boolean;
  productoEmpresa: string | null;
  nota: string;
}
export interface RequisitoDocumental {
  documento: string;
  tipo: TipoDoc | 'OTRO';
  obligatorio: boolean;
  seccion: string | null;
  detalle: string;
}
export interface FechaClave {
  tipo: 'visita' | 'consultas' | 'prorroga' | 'apertura' | 'entrega' | 'muestras' | 'otro';
  fecha: string | null;
  descripcion: string;
  obligatoria: boolean;
  fuente: string | null;
}
export interface Condiciones {
  plazoEntrega?: string;
  lugarEntrega?: string;
  formaPago?: string;
  mantenimientoOferta?: string;
  garantia?: string;
  muestras?: string;
  cotizarConIva?: boolean | null;
  moneda?: string;
}
export interface GapDocumental {
  documento: string;
  tipo: TipoDoc | 'OTRO';
  obligatorio: boolean;
  tiene: boolean;
  estadoEmpresa: EstadoDoc;
  diasEstimados: number | null;
  alcanzableAntesCierre: boolean | null;
  nota: string;
}
export interface Competidor {
  nombre: string;
  nroDoc: string;
  vecesAdjudicado: number;
  vecesOferto: number;
}
export interface PrecioHistorico {
  nroItem: number;
  idArticulo: number;
  descripcion: string;
  moneda: Moneda;
  unidad: string;
  n: number;
  p25: number | null;
  mediana: number | null;
  p75: number | null;
  minimo: number | null;
  maximo: number | null;
  ultimoGanador: string | null;
  ultimoPrecio: number | null;
  ultimaFecha: string | null;
  competidores: Competidor[];
  precioSugerido: number | null;
  explicacion: string | null;
}
export interface AnalisisPliego {
  resumen: string;
  quePiden: string;
  requisitosDocumentales: RequisitoDocumental[];
  fechasClave: FechaClave[];
  condiciones: Condiciones;
  riesgos: string[];
  confianza: number;
  basadoEn: 'pliego' | 'metadata';
}

export type EstadoUsuarioMatch = 'nuevo' | 'guardada' | 'descartada' | 'presentada' | 'ganada' | 'perdida';
export type EstadoDocumental = 'cumple' | 'alcanzable' | 'dificil' | 'desconocido';

export interface LicitacionCard {
  idCompra: string;
  objeto: string;
  organismo: string;
  tipoCompra: string;
  tipoCompraNombre: string;
  numero: string;
  fechaTopeOfertas: string | null;
  diasParaCierre: number | null;
  fechaPublicacion: string;
  /** Confianza efectiva = confianza del matching − ajuste por dificultad documental. */
  confianza: number;
  /** Confianza del matching sin ajustar y ajuste aplicado (dificil 25 · alcanzable 10). */
  confianzaBase?: number;
  ajusteDocumental?: number;
  razon: string;
  resumen: string | null;
  itemsOfertables: ItemOfertable[];
  estadoDocumental: EstadoDocumental;
  estadoUsuario: EstadoUsuarioMatch;
  tieneVisita: boolean;
  montoEstimado: number | null;
  moneda: Moneda;
}
export interface DetalleLicitacion {
  licitacion: {
    idCompra: string;
    objeto: string;
    organismo: string;
    unidadEjecutora: string | null;
    tipoCompra: string;
    tipoCompraNombre: string;
    numero: string;
    estado: string;
    fechaPublicacion: string;
    fechaTopeOfertas: string | null;
    fechaApertura: string | null;
    fechaSolAclar: string | null;
    fechaSolProrr: string | null;
    fechaTopeEntrega: string | null;
    lugarApertura: string | null;
    lugarEntrega: string | null;
    precioPliego: number | null;
    contacto: { nombre: string | null; email: string | null };
    urlDetalle: string;
    urlOfertar: string;
  };
  items: ItemLicitacion[];
  archivos: ArchivoLicitacion[];
  aclaraciones: { fecha: string; texto: string; url: string | null }[];
  analisis: AnalisisPliego | null;
  match: {
    confianza: number;
    confianzaBase?: number;
    ajusteDocumental?: number;
    razon: string;
    itemsOfertables: ItemOfertable[];
    gapDocumental: GapDocumental[];
    estadoDocumental: EstadoDocumental;
    estadoUsuario: EstadoUsuarioMatch;
  } | null;
  precios: PrecioHistorico[];
}
export interface EventoCalendario {
  id: string;
  idCompra: string;
  tipo: 'apertura' | 'consultas' | 'prorroga' | 'visita' | 'entrega' | 'otro';
  fecha: string;
  titulo: string;
  descripcion: string | null;
  obligatoria: boolean;
}
export interface Notificacion {
  id: number;
  tipo: 'nuevo_match' | 'cierre_proximo' | 'visita_proxima' | 'aclaracion' | 'doc_alcanzable' | 'sistema';
  titulo: string;
  cuerpo: string;
  idCompra: string | null;
  leida: boolean;
  createdAt: string;
}
export interface FiltrosDashboard {
  confianzaMin?: number;
  tipos?: string[];
  organismo?: string;
  cierreDias?: number;
  estado?: 'nuevas' | 'guardadas' | 'descartadas' | 'todas';
  orden?: 'cierre' | 'confianza' | 'monto';
}

// ---------- Códigos ARCE ----------
export const TIPOS_COMPRA: Record<string, string> = {
  LP: 'Licitación Pública', LA: 'Licitación Abreviada', CD: 'Compra Directa', CR: 'Concurso de Precios',
  CE: 'Compra por Excepción', CM: 'Convenio Marco', PR: 'Pregón', PE: 'Procedimiento Especial',
  CI: 'Compra Pública Innovadora', CP: 'PFI - Comparación de precios', DI: 'PFI - Contratación directa',
  LI: 'PFI - Licitación pública internacional', LN: 'PFI - Licitación pública nacional', LL: 'PFI - Licitación internacional limitada',
  AO: 'Arrendamiento de Obra', CO: 'Concesión', EI: 'Llamado a Expresiones de Interés', SI: 'Solicitud de Información', DT: 'Diálogo Técnico',
  VA: 'Venta/Arrendamiento Licitación Abreviada', VC: 'Venta/Arrendamiento Concurso de Precios', VD: 'Venta/Arrendamiento Directa',
  VE: 'Venta/Arrendamiento por Excepción', VL: 'Venta/Arrendamiento Licitación Pública', VR: 'Venta/Arrendamiento por Remate',
};
export const ESTADOS_COMPRA: Record<number, string> = {
  4: 'En trámite (publicada)', 5: 'En trámite (estudio)', 7: 'Adjudicada', 11: 'En trámite (ofertas preparadas)',
  17: 'Adjudicada (con ampliación)', 19: 'Llamado anulado', 27: 'Adjudicada (con renovación)',
};
export const MONEDAS_ARCE: Record<number, Moneda> = { 0: 'UYU', 1: 'USD', 2: 'USD', 4: 'UI', 5: 'UR' };
export function monedaDesdeId(id: number | null | undefined): Moneda {
  if (id === null || id === undefined) return 'UYU';
  return MONEDAS_ARCE[id] ?? 'OTRA';
}

/** Cuánto baja la confianza según lo difícil que es presentarse (se aplica al leer, no se guarda). */
export const AJUSTE_DOCUMENTAL: Record<EstadoDocumental, number> = { dificil: 25, alcanzable: 10, cumple: 0, desconocido: 0 };
export function confianzaEfectiva(confianza: number, estado: string): { confianza: number; ajuste: number } {
  const ajuste = AJUSTE_DOCUMENTAL[estado as EstadoDocumental] ?? 0;
  return { confianza: Math.max(0, confianza - ajuste), ajuste };
}
