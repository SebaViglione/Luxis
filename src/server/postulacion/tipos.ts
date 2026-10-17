// Tipos de la feature Postulación (compartidos entre servidor y cliente, sin dependencias de servidor).
import type { Condiciones, DetalleLicitacion, EstadoDocumental, Moneda, PerfilEmpresa } from '@/lib/types';

/** listo: no hay que hacer nada · luxis: lo arma Luxis en esta página · pendiente: hay que conseguirlo ·
 *  riesgo: puede dejar la oferta afuera · info: dato a tener en cuenta. */
export type EstadoItemChecklist = 'listo' | 'luxis' | 'pendiente' | 'riesgo' | 'info';

export interface ItemChecklist {
  id: string;
  titulo: string;
  detalle: string;
  estado: EstadoItemChecklist;
  /** Plazo para conseguirlo o fecha relevante, ya formateado. */
  plazo?: string | null;
  /** Sección del pliego donde se pide (si la detectó el análisis). */
  seccion?: string | null;
  obligatorio?: boolean;
}

export type NivelPreparacion = 'lista' | 'falta-poco' | 'dificil';

export interface ResumenPreparacion {
  nivel: NivelPreparacion;
  titulo: string;
  descripcion: string;
  pendientes: number;
  riesgos: number;
  estadoDocumental: EstadoDocumental | null;
  /** Puntos que se le restan a la confianza del match por la documentación. */
  ajusteConfianza: number;
}

/** Datos de la empresa que piden los formularios y no están en el perfil. Se guardan en perfil_json. */
export interface DatosPostulacion {
  domicilio?: string;
  ciudad?: string;
  codigoPostal?: string;
  representante?: string;
  ciRepresentante?: string;
  cargoRepresentante?: string;
  emailNotificaciones?: string;
}

/** Línea de la cotización que arma el usuario (borrador en localStorage). */
export interface LineaCotizacion {
  nroItem: number;
  incluir: boolean;
  descripcion: string;
  productoEmpresa: string | null;
  cantidad: number;
  unidad: string;
  precioUnitario: number | null;
  moneda: Moneda;
  iva: number;
  caracteristicas: string;
}

export interface Cotizacion {
  lineas: LineaCotizacion[];
  plazoEntrega: string;
  mantenimientoOferta: string;
}

/** Todo lo que la página de postulación necesita del servidor. */
export interface DatosPagina {
  licitacion: DetalleLicitacion['licitacion'] & { aperturaElectronica: boolean };
  items: DetalleLicitacion['items'];
  ofertables: NonNullable<DetalleLicitacion['match']>['itemsOfertables'];
  precios: DetalleLicitacion['precios'];
  condiciones: Condiciones | null;
  confianza: number | null;
  estadoUsuario: NonNullable<DetalleLicitacion['match']>['estadoUsuario'] | null;
  empresa: Pick<PerfilEmpresa, 'nombre' | 'razonSocial' | 'rut' | 'telefono' | 'emailContacto' | 'web' | 'departamento' | 'localidad' | 'descripcion' | 'experienciaLicitaciones' | 'productos'>;
  datosPostulacion: DatosPostulacion;
  checklist: ItemChecklist[];
  resumen: ResumenPreparacion;
}
