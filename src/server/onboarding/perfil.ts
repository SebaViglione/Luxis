// Esquema, normalización y fusión del perfil de empresa (sin IA ni DB).
import { z } from 'zod';
import type { DocumentoEmpresa, PerfilEmpresa, ProductoEmpresa, TipoDoc } from '@/lib/types';
import { DEPARTAMENTOS_UY, NOMBRE_DOC, TIPOS_DOC_BASE } from './constantes';

const textoOpcional = z.string().trim().max(500).optional();

export const esquemaProducto = z.object({
  nombre: z.string().trim().min(1, 'El producto necesita un nombre.').max(200),
  categoria: z.string().trim().max(100),
  unidad: z.string().trim().min(1, 'Indicá la unidad.').max(30),
  precioReferencia: z.number().nonnegative().nullable(),
  moneda: z.enum(['UYU', 'USD', 'UI', 'UR', 'OTRA']),
  keywords: z.array(z.string().trim().max(60)).max(40),
  fuente: z.enum(['documento', 'entrevista', 'manual']),
});

export const esquemaDocumento = z.object({
  tipo: z.enum(['RUPE', 'DGI', 'BPS', 'BSE', 'UNIT', 'ISO', 'OTRO']),
  nombre: z.string().trim().min(1).max(200),
  estado: z.enum(['vigente', 'en_tramite', 'no_tiene', 'desconocido', 'vencido']),
  vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.').nullable(),
  notas: textoOpcional,
});

/** Valida un PerfilEmpresa que llega del cliente (resumen editable, cuenta). */
export const esquemaPerfilEmpresa = z.object({
  nombre: z.string().trim().min(2, 'Ingresá el nombre de la empresa.').max(200),
  razonSocial: textoOpcional,
  rut: z
    .string()
    .trim()
    .regex(/^\d{12}$/, 'El RUT tiene 12 dígitos.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  departamento: textoOpcional,
  localidad: textoOpcional,
  web: textoOpcional,
  telefono: textoOpcional,
  emailContacto: z.email('Email inválido.').optional().or(z.literal('').transform(() => undefined)),
  descripcion: z.string().trim().max(2000),
  productos: z.array(esquemaProducto).max(2000),
  zonasEntrega: z.array(z.string()).max(19),
  capacidadNotas: textoOpcional,
  montoMinimo: z.number().nonnegative().nullable().optional(),
  documentacion: z.array(esquemaDocumento).max(30),
  experienciaLicitaciones: textoOpcional,
  organismosInteres: z.array(z.string().trim().max(200)).max(30).optional(),
  camposFaltantes: z.array(z.string()),
}) satisfies z.ZodType<PerfilEmpresa, unknown>;

/** Paso 1 del onboarding: datos básicos de la empresa. */
export const esquemaDatosEmpresa = esquemaPerfilEmpresa.pick({
  nombre: true,
  rut: true,
  departamento: true,
  localidad: true,
  web: true,
  telefono: true,
});

export type DatosEmpresa = z.input<typeof esquemaDatosEmpresa>;

/** Mayúsculas, sin tildes y con espacios simples: el mismo formato que usan los ítems de ARCE. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9.,/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PALABRAS_VACIAS = new Set(['DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'CON', 'SIN', 'PARA', 'POR', 'EN', 'Y', 'X']);

/** Palabras clave para productos cargados a mano (las que extrae la IA ya vienen con keywords). */
export function palabrasClave(nombre: string): string[] {
  const palabras = normalizarTexto(nombre)
    .split(' ')
    .filter((p) => p.length > 2 && !PALABRAS_VACIAS.has(p) && !/^\d/.test(p));
  return [...new Set(palabras)].slice(0, 6);
}

export function perfilVacio(nombre: string): PerfilEmpresa {
  return {
    nombre,
    descripcion: '',
    productos: [],
    zonasEntrega: [],
    documentacion: completarDocumentacion([]),
    organismosInteres: [],
    camposFaltantes: [],
  };
}

/** Garantiza una fila por cada documento base (RUPE, DGI, BPS, BSE, UNIT, ISO) para el checklist. */
export function completarDocumentacion(documentos: DocumentoEmpresa[]): DocumentoEmpresa[] {
  const resultado = [...documentos];
  for (const tipo of TIPOS_DOC_BASE) {
    if (!resultado.some((d) => d.tipo === tipo)) {
      resultado.push({ tipo, nombre: NOMBRE_DOC[tipo], estado: 'desconocido', vencimiento: null });
    }
  }
  const orden = (tipo: TipoDoc) => {
    const i = TIPOS_DOC_BASE.indexOf(tipo as (typeof TIPOS_DOC_BASE)[number]);
    return i === -1 ? TIPOS_DOC_BASE.length : i;
  };
  return resultado.sort((a, b) => orden(a.tipo) - orden(b.tipo));
}

/** Departamentos válidos, escritos como en DEPARTAMENTOS_UY (tolera tildes y mayúsculas). */
export function normalizarZonas(zonas: string[]): string[] {
  const porClave = new Map(DEPARTAMENTOS_UY.map((d) => [normalizarTexto(d), d as string]));
  const validas = zonas.map((z) => porClave.get(normalizarTexto(z))).filter((z): z is string => Boolean(z));
  return [...new Set(validas)];
}

/** Lo que todavía no sabemos de la empresa, en palabras que entiende el dueño de una barraca. */
export function calcularFaltantes(perfil: PerfilEmpresa, extra: string[] = []): string[] {
  const faltantes: string[] = [];
  if (perfil.productos.length === 0) faltantes.push('productos que vende y en qué unidad');
  else if (perfil.productos.some((p) => !p.unidad)) faltantes.push('unidad de venta de algunos productos');
  if (perfil.zonasEntrega.length === 0) faltantes.push('departamentos donde entrega');
  if (!perfil.capacidadNotas) faltantes.push('capacidad de entrega semanal y si vende a granel, por bolsa o paletizado');

  const estadoDe = (tipo: TipoDoc) => perfil.documentacion.find((d) => d.tipo === tipo)?.estado ?? 'desconocido';
  if (estadoDe('RUPE') === 'desconocido') faltantes.push('si tiene RUPE activo');
  if (estadoDe('DGI') === 'desconocido' || estadoDe('BPS') === 'desconocido') faltantes.push('certificados DGI y BPS al día');
  if (estadoDe('BSE') === 'desconocido') faltantes.push('seguro BSE de accidentes de trabajo');
  if (estadoDe('UNIT') === 'desconocido' && estadoDe('ISO') === 'desconocido') faltantes.push('certificaciones UNIT o ISO');

  if (!perfil.experienciaLicitaciones) faltantes.push('si ya se presentó a licitaciones');
  if (!perfil.organismosInteres?.length) faltantes.push('tipos de organismos que le interesan');
  if (perfil.montoMinimo == null) faltantes.push('monto mínimo que le vale la pena');

  const vistos = new Set(faltantes.map(normalizarTexto));
  for (const campo of extra) {
    const clave = normalizarTexto(campo);
    // El modelo a veces devuelve nombres de campo ("razonSocial", "rut"): solo aceptamos frases, y no
    // listamos datos de contacto/identidad, que no hacen al matching ni se preguntan en la entrevista.
    if (!/\s/.test(campo.trim()) || CAMPOS_DE_IDENTIDAD.test(clave)) continue;
    if (clave && !vistos.has(clave) && !esCampoCubierto(campo, perfil)) {
      vistos.add(clave);
      faltantes.push(campo);
    }
  }
  return faltantes;
}

const CAMPOS_DE_IDENTIDAD = /RAZON ?SOCIAL|\bRUT\b|LOCALIDAD|\bWEB\b|PAGINA|TELEFONO|EMAIL|CORREO|NOMBRE|DIRECCION/;

// Los campos_faltantes que devuelve el modelo pueden repetir cosas que ya cubrimos arriba.
function esCampoCubierto(campo: string, perfil: PerfilEmpresa) {
  const c = normalizarTexto(campo);
  if (/PRODUCT/.test(c)) return perfil.productos.length > 0;
  if (/ZONA|DEPARTAMENT|ENTREGA/.test(c)) return perfil.zonasEntrega.length > 0;
  if (/RUT\b/.test(c)) return Boolean(perfil.rut);
  if (/TELEFONO/.test(c)) return Boolean(perfil.telefono);
  if (/WEB/.test(c)) return Boolean(perfil.web);
  if (/DESCRIPCION/.test(c)) return Boolean(perfil.descripcion);
  // Estos ya los evalúa calcularFaltantes con reglas propias.
  return /RUPE|DGI|BPS|BSE|UNIT|ISO|CAPACIDAD|LICITACION|ORGANISMO|MONTO|DOCUMENT|PRECIO/.test(c);
}

/**
 * Fusiona el perfil existente con datos nuevos (de documentos, web o entrevista).
 * - Datos de identidad: gana lo que ya cargó el usuario.
 * - Resto de los campos: gana lo nuevo si trae valor.
 * - Productos y zonas: unión sin duplicados. Documentos: uno por tipo, gana lo nuevo salvo "desconocido".
 */
export function fusionarPerfil(base: PerfilEmpresa, nuevo: Partial<PerfilEmpresa>, faltantesModelo: string[] = []): PerfilEmpresa {
  const identidad = <K extends 'razonSocial' | 'rut' | 'departamento' | 'localidad' | 'web' | 'telefono' | 'emailContacto'>(clave: K) =>
    base[clave] || nuevo[clave] || undefined;

  const perfil: PerfilEmpresa = {
    nombre: base.nombre || nuevo.nombre || 'Mi empresa',
    razonSocial: identidad('razonSocial'),
    rut: identidad('rut'),
    departamento: identidad('departamento'),
    localidad: identidad('localidad'),
    web: identidad('web'),
    telefono: identidad('telefono'),
    emailContacto: identidad('emailContacto'),
    descripcion: nuevo.descripcion || base.descripcion || '',
    productos: fusionarProductos(base.productos, nuevo.productos ?? []),
    zonasEntrega: normalizarZonas([...base.zonasEntrega, ...(nuevo.zonasEntrega ?? [])]),
    capacidadNotas: nuevo.capacidadNotas || base.capacidadNotas,
    montoMinimo: nuevo.montoMinimo ?? base.montoMinimo ?? null,
    documentacion: fusionarDocumentos(base.documentacion, nuevo.documentacion ?? []),
    experienciaLicitaciones: nuevo.experienciaLicitaciones || base.experienciaLicitaciones,
    organismosInteres: [...new Set([...(base.organismosInteres ?? []), ...(nuevo.organismosInteres ?? [])])],
    camposFaltantes: [],
  };
  perfil.camposFaltantes = calcularFaltantes(perfil, faltantesModelo);
  return perfil;
}

function fusionarProductos(base: ProductoEmpresa[], nuevos: ProductoEmpresa[]): ProductoEmpresa[] {
  const porNombre = new Map(base.map((p) => [normalizarTexto(p.nombre), p]));
  for (const producto of nuevos) {
    const clave = normalizarTexto(producto.nombre);
    if (!clave) continue;
    const existente = porNombre.get(clave);
    if (!existente) {
      porNombre.set(clave, producto);
    } else {
      porNombre.set(clave, {
        ...existente,
        categoria: existente.categoria || producto.categoria,
        unidad: existente.unidad || producto.unidad,
        precioReferencia: existente.precioReferencia ?? producto.precioReferencia,
        moneda: existente.precioReferencia != null ? existente.moneda : producto.moneda,
        keywords: [...new Set([...existente.keywords, ...producto.keywords])],
      });
    }
  }
  return [...porNombre.values()];
}

function fusionarDocumentos(base: DocumentoEmpresa[], nuevos: DocumentoEmpresa[]): DocumentoEmpresa[] {
  const clave = (d: DocumentoEmpresa) => (d.tipo === 'OTRO' ? `OTRO:${normalizarTexto(d.nombre)}` : d.tipo);
  const porClave = new Map(base.map((d) => [clave(d), d]));
  for (const doc of nuevos) {
    const existente = porClave.get(clave(doc));
    if (!existente || doc.estado !== 'desconocido') {
      porClave.set(clave(doc), { ...existente, ...doc, vencimiento: doc.vencimiento ?? existente?.vencimiento ?? null });
    }
  }
  return completarDocumentacion([...porClave.values()]);
}
