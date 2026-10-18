// Agenda y estado de la entrevista (sin IA ni DB): qué temas faltan según el perfil y qué quedó anotado.
// La comparten el prompt del chat y de la voz, la herramienta anotar_respuesta y la UI del paso entrevista.
import { getToolName, isToolUIPart, type UIMessage } from 'ai';
import type { PerfilEmpresa, TipoDoc } from '@/lib/types';
import type { TemaEntrevista } from './constantes';
import type { ResultadoAnotar } from './tipos';

export const HERRAMIENTA_ANOTAR = 'anotar_respuesta';

export interface PuntoAgenda {
  tema: TemaEntrevista;
  /** Productos, zonas, capacidad y papeles del Estado: sin eso no se pueden buscar licitaciones. */
  esencial: boolean;
  /** Qué preguntar, ya ajustado a lo que se sabe (ej. solo los papeles sin dato). */
  pregunta: string;
}

const MAX_NOMBRES_EN_PREGUNTA = 4;
const MAX_PRODUCTOS_EN_RESUMEN = 12;

function estadoDoc(perfil: PerfilEmpresa, tipo: TipoDoc) {
  return perfil.documentacion.find((d) => d.tipo === tipo)?.estado ?? 'desconocido';
}

function listar(nombres: string[], max = MAX_NOMBRES_EN_PREGUNTA) {
  return nombres.length > max ? `${nombres.slice(0, max).join(', ')} y ${nombres.length - max} más` : nombres.join(', ');
}

/**
 * Temas que la entrevista todavía tiene que preguntar, en orden, según el perfil (documentos, web y lo ya
 * anotado) y los temas ya tratados en esta conversación (preguntados y contestados, aunque sea con "no sé").
 */
export function agendaEntrevista(perfil: PerfilEmpresa, tratados: Iterable<TemaEntrevista> = []): PuntoAgenda[] {
  const agenda: PuntoAgenda[] = [];

  if (perfil.productos.length === 0) {
    agenda.push({ tema: 'productos', esencial: true, pregunta: 'Qué vende y en qué unidad (bolsa, metro cúbico, unidad, kilo).' });
  } else {
    const sinUnidad = perfil.productos.filter((p) => !p.unidad).map((p) => p.nombre);
    if (sinUnidad.length > 0) {
      agenda.push({ tema: 'productos', esencial: true, pregunta: `En qué unidad vende ${listar(sinUnidad)} (bolsa, metro cúbico, unidad, kilo).` });
    }
  }

  if (perfil.zonasEntrega.length === 0) {
    agenda.push({
      tema: 'zonas',
      esencial: true,
      pregunta: perfil.departamento ? `A qué departamentos entrega: ¿solo ${perfil.departamento} o también otros?` : 'A qué departamentos entrega.',
    });
  }

  if (!perfil.capacidadNotas) {
    agenda.push({
      tema: 'capacidad',
      esencial: true,
      pregunta: 'Capacidad, todo en UNA pregunta: cuánto puede entregar por semana (metros cúbicos, camiones o bolsas) y si entrega a granel, en bolsa o paletizado.',
    });
  }

  const papeles: string[] = [];
  if (estadoDoc(perfil, 'RUPE') === 'desconocido') papeles.push('si tiene RUPE activo');
  const faltaDGI = estadoDoc(perfil, 'DGI') === 'desconocido';
  const faltaBPS = estadoDoc(perfil, 'BPS') === 'desconocido';
  if (faltaDGI && faltaBPS) papeles.push('si tiene los certificados de DGI y BPS al día');
  else if (faltaDGI) papeles.push('si tiene el certificado de DGI al día');
  else if (faltaBPS) papeles.push('si tiene el certificado de BPS al día');
  if (estadoDoc(perfil, 'BSE') === 'desconocido') papeles.push('si tiene el seguro de accidentes de trabajo del BSE');
  const papelesEsenciales = papeles.length > 0;
  if (estadoDoc(perfil, 'UNIT') === 'desconocido' && estadoDoc(perfil, 'ISO') === 'desconocido') papeles.push('si tiene alguna certificación UNIT o ISO');
  if (papeles.length > 0) {
    agenda.push({ tema: 'papeles', esencial: papelesEsenciales, pregunta: `Papeles, todo en UNA pregunta: ${papeles.join(', ')}.` });
  }

  const experiencia: string[] = [];
  if (!perfil.experienciaLicitaciones) experiencia.push('si ya se presentó a licitaciones');
  if (!perfil.organismosInteres?.length) experiencia.push('qué organismos le interesan (intendencias, ministerios, entes como OSE o UTE)');
  if (perfil.montoMinimo == null) experiencia.push('desde qué monto le sirve una venta');
  if (experiencia.length > 0) {
    agenda.push({ tema: 'experiencia', esencial: false, pregunta: `Experiencia, todo en UNA pregunta: ${experiencia.join(', ')}.` });
  }

  const hechos = new Set(tratados);
  return agenda.filter((p) => !hechos.has(p.tema));
}

/** Lo que ya se sabe de la empresa, en frases cortas: el modelo no debe preguntarlo ni pedir que lo confirmen. */
export function resumenConocido(perfil: PerfilEmpresa): string[] {
  const conocido: string[] = [];
  if (perfil.descripcion) conocido.push(`Qué hace: ${perfil.descripcion}`);
  if (perfil.productos.length > 0) {
    const nombres = perfil.productos.map((p) => (p.unidad ? `${p.nombre} (${p.unidad})` : p.nombre));
    conocido.push(`Productos (${perfil.productos.length} ya cargados): ${listar(nombres, MAX_PRODUCTOS_EN_RESUMEN)}.`);
  }
  if (perfil.zonasEntrega.length > 0) conocido.push(`Entrega en: ${perfil.zonasEntrega.join(', ')}.`);
  else if (perfil.departamento) conocido.push(`Está en ${perfil.localidad ? `${perfil.localidad}, ` : ''}${perfil.departamento} (las zonas de entrega todavía no se saben).`);
  if (perfil.capacidadNotas) conocido.push(`Capacidad: ${perfil.capacidadNotas}`);
  const papeles = perfil.documentacion
    .filter((d) => d.estado !== 'desconocido')
    .map((d) => `${d.tipo === 'OTRO' ? d.nombre : d.tipo} ${etiquetaEstado(d.estado)}${d.vencimiento ? ` (vence ${d.vencimiento})` : ''}`);
  if (papeles.length > 0) conocido.push(`Papeles: ${papeles.join(', ')}.`);
  if (perfil.experienciaLicitaciones) conocido.push(`Experiencia en licitaciones: ${perfil.experienciaLicitaciones}`);
  if (perfil.organismosInteres?.length) conocido.push(`Organismos que le interesan: ${perfil.organismosInteres.join(', ')}.`);
  if (perfil.montoMinimo != null) conocido.push(`Monto mínimo que le sirve: $ ${perfil.montoMinimo}.`);
  return conocido;
}

function etiquetaEstado(estado: PerfilEmpresa['documentacion'][number]['estado']) {
  return { vigente: 'vigente', en_tramite: 'en trámite', no_tiene: 'no tiene', vencido: 'vencido', desconocido: 'sin dato' }[estado];
}

/** Temas que cubre un lote de datos anotados (para marcarlos como tratados aunque la respuesta haya sido parcial). */
export function temasDeDatos(datos: Partial<PerfilEmpresa>): TemaEntrevista[] {
  const temas: TemaEntrevista[] = [];
  if (datos.productos?.length) temas.push('productos');
  if (datos.zonasEntrega?.length) temas.push('zonas');
  if (datos.capacidadNotas) temas.push('capacidad');
  if (datos.documentacion?.length) temas.push('papeles');
  if (datos.experienciaLicitaciones || datos.organismosInteres?.length || datos.montoMinimo != null) temas.push('experiencia');
  return temas;
}

/** Acumula lo extraído en varias anotaciones: las listas se suman, en lo demás gana lo último. */
export function fusionarExtraidos(base: Partial<PerfilEmpresa>, nuevo: Partial<PerfilEmpresa>): Partial<PerfilEmpresa> {
  const resultado: Partial<PerfilEmpresa> = { ...base };
  for (const [clave, valor] of Object.entries(nuevo) as [keyof PerfilEmpresa, unknown][]) {
    if (valor === undefined) continue;
    if (Array.isArray(valor)) {
      const previo = base[clave];
      (resultado as Record<string, unknown>)[clave] = Array.isArray(previo) ? [...previo, ...valor] : valor;
    } else {
      (resultado as Record<string, unknown>)[clave] = valor;
    }
  }
  return resultado;
}

/** Salida de la última anotación que hizo la entrevista (la herramienta ya ejecutada más reciente en el historial). */
export function ultimaAnotacion(mensajes: UIMessage[]): ResultadoAnotar | null {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const partes = mensajes[i].parts;
    for (let j = partes.length - 1; j >= 0; j--) {
      const parte = partes[j];
      if (isToolUIPart(parte) && getToolName(parte) === HERRAMIENTA_ANOTAR && parte.state === 'output-available') {
        return parte.output as ResultadoAnotar;
      }
    }
  }
  return null;
}
