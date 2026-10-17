// Documentos de la postulación como bloques: un único modelo que se exporta a PDF (vista imprimible)
// y a Word (docx). Funciones puras, se usan en el navegador con los datos que edita el usuario.
import type { DatosPagina, DatosPostulacion, Cotizacion, LineaCotizacion } from './tipos';

export type Bloque =
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'parrafo'; texto: string; negrita?: boolean; derecha?: boolean }
  | { tipo: 'campos'; filas: [string, string][] }
  | { tipo: 'lista'; items: string[] }
  | { tipo: 'tabla'; columnas: string[]; filas: string[][]; alineacion?: ('izq' | 'der')[]; anchos?: number[] }
  | { tipo: 'firma'; lineas: string[] }
  | { tipo: 'nota'; texto: string };

export interface DocumentoPostulacion {
  id: 'formulario' | 'carta' | 'especificacion';
  nombreArchivo: string;
  titulo: string;
  bloques: Bloque[];
}

const SIN_DATO = '____________________';
const fmtNumero = new Intl.NumberFormat('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtFechaLarga = new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Montevideo' });

export function importe(valor: number, moneda: string) {
  const prefijo = moneda === 'UYU' ? '$' : moneda === 'USD' ? 'US$' : moneda;
  return `${prefijo} ${fmtNumero.format(valor)}`;
}

export function totalesCotizacion(lineas: LineaCotizacion[]) {
  const incluidas = lineas.filter((l) => l.incluir && l.precioUnitario != null && l.cantidad > 0);
  const porMoneda = new Map<string, { neto: number; iva: number }>();
  for (const l of incluidas) {
    const neto = l.cantidad * (l.precioUnitario ?? 0);
    const t = porMoneda.get(l.moneda) ?? { neto: 0, iva: 0 };
    t.neto += neto;
    t.iva += (neto * l.iva) / 100;
    porMoneda.set(l.moneda, t);
  }
  return { incluidas, porMoneda };
}

function referencia(p: DatosPagina) {
  const l = p.licitacion;
  return `Ref.: ${l.tipoCompraNombre} N.º ${l.numero} — ${l.objeto}`;
}

function razonSocial(p: DatosPagina) {
  return p.empresa.razonSocial || p.empresa.nombre;
}

function firma(d: DatosPostulacion, fecha: string): Bloque {
  return {
    tipo: 'firma',
    lineas: [
      'Firma: ______________________________',
      `Aclaración: ${d.representante || SIN_DATO}`,
      `C.I.: ${d.ciRepresentante || SIN_DATO}${d.cargoRepresentante ? ` · ${d.cargoRepresentante}` : ''}`,
      `Fecha: ${fecha}`,
    ],
  };
}

export function formularioIdentificacion(p: DatosPagina, d: DatosPostulacion, hoy = new Date()): DocumentoPostulacion {
  const fecha = fmtFechaLarga.format(hoy);
  return {
    id: 'formulario',
    nombreArchivo: `Formulario de identificacion del oferente - ${p.licitacion.numero.replace(/\//g, '-')}`,
    titulo: 'Formulario de identificación del oferente',
    bloques: [
      { tipo: 'titulo', texto: 'Formulario de identificación del oferente' },
      { tipo: 'parrafo', texto: `${p.licitacion.organismo}${p.licitacion.unidadEjecutora ? ` · ${p.licitacion.unidadEjecutora}` : ''}` },
      { tipo: 'parrafo', texto: referencia(p), negrita: true },
      {
        tipo: 'campos',
        filas: [
          ['Razón social', razonSocial(p)],
          ['Nombre comercial', p.empresa.nombre],
          ['RUT', p.empresa.rut || SIN_DATO],
          ['Domicilio', d.domicilio || SIN_DATO],
          ['Localidad / ciudad', d.ciudad || p.empresa.localidad || p.empresa.departamento || SIN_DATO],
          ['Código postal', d.codigoPostal || SIN_DATO],
          ['País', 'Uruguay'],
          ['Teléfono', p.empresa.telefono || SIN_DATO],
          ['Correo electrónico para notificaciones', d.emailNotificaciones || p.empresa.emailContacto || SIN_DATO],
          ['Representante', d.representante || SIN_DATO],
          ['C.I. del representante', d.ciRepresentante || SIN_DATO],
          ['Cargo', d.cargoRepresentante || SIN_DATO],
        ],
      },
      { tipo: 'subtitulo', texto: 'Declaración jurada' },
      {
        tipo: 'parrafo',
        texto: `Quien suscribe, en representación de ${razonSocial(p)}, declara bajo juramento:`,
      },
      {
        tipo: 'lista',
        items: [
          'Que la oferta presentada para el llamado de referencia, incluida la ingresada en línea, vincula a la empresa en todos sus términos.',
          'Que conoce y acepta sin condiciones el Pliego de Condiciones Particulares del llamado y el Pliego Único de Bases y Condiciones Generales (Decreto 131/014).',
          'Que la empresa no está comprendida en ninguna de las prohibiciones para contratar con el Estado del artículo 46 del TOCAF.',
          'Que la empresa está inscripta en el Registro Único de Proveedores del Estado (RUPE) y que quien firma tiene facultades suficientes para representarla.',
        ],
      },
      firma(d, fecha),
    ],
  };
}

export function cartaPresentacion(p: DatosPagina, d: DatosPostulacion, c: Cotizacion, hoy = new Date()): DocumentoPostulacion {
  const fecha = fmtFechaLarga.format(hoy);
  const ciudad = d.ciudad || p.empresa.localidad || p.empresa.departamento || 'Montevideo';
  const { incluidas, porMoneda } = totalesCotizacion(c.lineas);
  const totales = [...porMoneda].map(([moneda, t]) => `${importe(t.neto, moneda)} más impuestos`).join(' y ');
  const cotiza =
    incluidas.length > 0
      ? `cotizando ${incluidas.length} de los ${p.items.length} ítems solicitados por un total de ${totales}`
      : 'según la cotización adjunta';
  // Solo la descripción: la experiencia en licitaciones suele repetirla y está en tercera persona.
  const sobreLaEmpresa = p.empresa.descripcion;
  const condiciones = [
    c.plazoEntrega && `un plazo de entrega de ${c.plazoEntrega}${p.licitacion.lugarEntrega ? ` en ${p.licitacion.lugarEntrega}` : ''}`,
    c.mantenimientoOferta && `el mantenimiento de la oferta por ${c.mantenimientoOferta}`,
  ].filter(Boolean);

  return {
    id: 'carta',
    nombreArchivo: `Carta de presentacion - ${p.licitacion.numero.replace(/\//g, '-')}`,
    titulo: 'Carta de presentación',
    bloques: [
      { tipo: 'parrafo', texto: `${ciudad}, ${fecha}.`, derecha: true },
      { tipo: 'parrafo', texto: `Señores\n${p.licitacion.organismo}${p.licitacion.unidadEjecutora ? `\n${p.licitacion.unidadEjecutora}` : ''}\nPresente` },
      { tipo: 'parrafo', texto: referencia(p), negrita: true },
      { tipo: 'parrafo', texto: 'De nuestra mayor consideración:' },
      {
        tipo: 'parrafo',
        texto: `${razonSocial(p)}${p.empresa.rut ? `, RUT ${p.empresa.rut}` : ''}${
          d.domicilio ? `, con domicilio en ${d.domicilio}${d.ciudad ? `, ${d.ciudad}` : ''}` : ''
        }, presenta su oferta para el llamado de referencia, ${cotiza}, según el detalle de la especificación adjunta.`,
      },
      ...(sobreLaEmpresa ? [{ tipo: 'parrafo' as const, texto: sobreLaEmpresa }] : []),
      ...(condiciones.length ? [{ tipo: 'parrafo' as const, texto: `Ofrecemos ${condiciones.join(' y ')}.` }] : []),
      {
        tipo: 'parrafo',
        texto:
          'Declaramos conocer y aceptar el Pliego de Condiciones Particulares del llamado y el Pliego Único de Bases y Condiciones Generales (Decreto 131/014).',
      },
      {
        tipo: 'parrafo',
        texto: `Quedamos a disposición por cualquier consulta${
          d.emailNotificaciones || p.empresa.emailContacto ? ` en ${d.emailNotificaciones || p.empresa.emailContacto}` : ''
        }${p.empresa.telefono ? ` o al ${p.empresa.telefono}` : ''}.`,
      },
      { tipo: 'parrafo', texto: 'Saludamos a ustedes atentamente.' },
      firma(d, fecha),
    ],
  };
}

export function especificacionOferta(p: DatosPagina, d: DatosPostulacion, c: Cotizacion, hoy = new Date()): DocumentoPostulacion {
  const fecha = fmtFechaLarga.format(hoy);
  const { incluidas, porMoneda } = totalesCotizacion(c.lineas);
  const filas = incluidas.map((l) => [
    String(l.nroItem),
    l.descripcion,
    [l.productoEmpresa, l.caracteristicas].filter(Boolean).join(' · ') || '—',
    `${fmtNumero.format(l.cantidad)} ${l.unidad}`.trim(),
    importe(l.precioUnitario ?? 0, l.moneda),
    `${l.iva} %`,
    importe(l.cantidad * (l.precioUnitario ?? 0), l.moneda),
  ]);
  const resumenTotales = [...porMoneda].flatMap(([moneda, t]) => [
    `Subtotal sin impuestos: ${importe(t.neto, moneda)}`,
    `Impuestos: ${importe(t.iva, moneda)}`,
    `Total con impuestos: ${importe(t.neto + t.iva, moneda)}`,
  ]);

  return {
    id: 'especificacion',
    nombreArchivo: `Especificacion de la oferta - ${p.licitacion.numero.replace(/\//g, '-')}`,
    titulo: 'Especificación de la oferta',
    bloques: [
      { tipo: 'titulo', texto: 'Especificación de la oferta' },
      { tipo: 'parrafo', texto: `${razonSocial(p)}${p.empresa.rut ? ` · RUT ${p.empresa.rut}` : ''}` },
      { tipo: 'parrafo', texto: referencia(p), negrita: true },
      incluidas.length
        ? {
            tipo: 'tabla',
            columnas: ['Ítem', 'Descripción solicitada', 'Producto ofrecido', 'Cantidad', 'Precio unitario sin imp.', 'IVA', 'Subtotal sin imp.'],
            filas,
            alineacion: ['izq', 'izq', 'izq', 'der', 'der', 'der', 'der'],
            anchos: [0.55, 2, 2, 1.15, 1.35, 0.7, 1.35],
          }
        : { tipo: 'nota', texto: 'Todavía no cargaste precios en la cotización.' },
      ...(resumenTotales.length ? [{ tipo: 'lista' as const, items: resumenTotales }] : []),
      {
        tipo: 'campos',
        filas: [
          ['Plazo de entrega', c.plazoEntrega || SIN_DATO],
          ['Lugar de entrega', p.licitacion.lugarEntrega || 'Según el pliego'],
          ['Mantenimiento de la oferta', c.mantenimientoOferta || SIN_DATO],
        ],
      },
      { tipo: 'nota', texto: 'Precios en la moneda indicada, sin impuestos; el IVA se detalla por separado.' },
      firma(d, fecha),
    ],
  };
}
