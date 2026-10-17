import { XMLParser } from 'fast-xml-parser';
import {
  type CompraNormalizada, type ItemNormalizado, type AclaracionNormalizada,
  type AdjudicacionNormalizada, type OferenteNormalizado,
  normalizarTexto, textoONull, numONull, entONull, parseFechaArce, urlDetalleCompra, urlAclaracion,
} from './normalizar';

export type TipoPublicacion = 'lv' | 'l' | 'a';

const URL_REPORTE = 'https://www.comprasestatales.gub.uy/comprasenlinea/jboss/generarReporte';
export const UA_NAVEGADOR = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const MAX_DIAS_VENTANA = 10;
const TIMEOUT_MS = 90_000;

const TAGS_ARRAY = new Set(['compra', 'item', 'adjudicacion', 'oferente', 'aclaracion', 'mod_llamado', 'atributo_item', 'atributo_adjudicacion', 'valor_atributo_item']);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  processEntities: true,
  isArray: (tagName) => TAGS_ARRAY.has(tagName),
});

function pad(n: number) { return String(n).padStart(2, '0'); }

/** Partes de fecha en hora de Montevideo (UTC-3). */
function partesMvd(d: Date) {
  const local = new Date(d.getTime() - 3 * 3600 * 1000);
  return { anio: local.getUTCFullYear(), mes: pad(local.getUTCMonth() + 1), dia: pad(local.getUTCDate()), hora: pad(local.getUTCHours()) };
}

export function urlReporte(tipo: TipoPublicacion, desde: Date, hasta: Date, tipoCompra?: string): string {
  const i = partesMvd(desde);
  const f = partesMvd(hasta);
  const p = new URLSearchParams({
    tipo_publicacion: tipo,
    tipo_compra: tipoCompra ?? '',
    anio_inicial: String(i.anio), mes_inicial: i.mes, dia_inicial: i.dia, hora_inicial: i.hora,
    anio_final: String(f.anio), mes_final: f.mes, dia_final: f.dia, hora_final: f.hora,
  });
  return `${URL_REPORTE}?${p.toString()}`;
}

async function fetchConReintentos(url: string, intentos = 3): Promise<string> {
  let ultimoError: unknown;
  for (let i = 1; i <= intentos; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA_NAVEGADOR, Accept: 'text/xml,application/xml,*/*', 'Accept-Language': 'es-UY,es;q=0.9' },
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const buf = await res.arrayBuffer();
      return new TextDecoder('iso-8859-1').decode(buf);
    } catch (e) {
      ultimoError = e;
      if (i < intentos) await new Promise((r) => setTimeout(r, 2000 * i));
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(`ARCE no respondió tras ${intentos} intentos: ${(ultimoError as Error)?.message}`);
}

type Attrs = Record<string, string>;
type CompraXml = Attrs & {
  items?: { item?: Attrs[] };
  aclaraciones_lla?: { aclaracion?: Attrs[] };
  aclaraciones_adj?: { aclaracion?: Attrs[] };
  oferentes?: { oferente?: Attrs[] };
  adjudicaciones?: { adjudicacion?: (Attrs & { atributos_adjudicacion?: unknown })[] };
};

/** Parsea el XML crudo del reporte y devuelve las compras tal cual vienen (atributos como strings). */
export function parsearReporte(xml: string): { fechaGenerado: string | null; cantCompras: number; compras: CompraXml[] } {
  const doc = parser.parse(xml);
  const reporte = doc?.reporte ?? {};
  const cabezal: Attrs = reporte.reporte_cabezal ?? {};
  const compras: CompraXml[] = reporte.reporte_dato?.compra ?? [];
  return { fechaGenerado: cabezal.fecha_generado ?? null, cantCompras: Number(cabezal.cant_compras ?? compras.length), compras };
}

function mapItem(it: Attrs & { atributos_item?: { atributo_item?: Attrs[] } }): ItemNormalizado {
  const desc = textoONull(it.desc_articulo) ?? '';
  const atributos = it.atributos_item?.atributo_item?.map((a) => ({
    propiedad: a.desc_prop_atributo, unidad: a.desc_unidad_med_prop_atributo, requerido: a.requerido,
    valor: a.valor_texto ?? a.valor_numerico ?? a.valor_fecha ?? a.valor_booleano ?? null,
  })) ?? null;
  return {
    nroItem: entONull(it.nro_item) ?? 0,
    idArticulo: entONull(it.id_articulo) ?? 0,
    descArticulo: desc,
    descNormalizada: normalizarTexto(desc),
    cantPedida: numONull(it.cant_pedida),
    unidad: textoONull(it.unidad),
    idMonedaCotiz: entONull(it.id_moneda_cotiz),
    variante: limpiarGuiones(it.variante),
    presentacion: limpiarGuiones(it.presentacion),
    marca: limpiarGuiones(it.desc_marca),
    atributos: atributos && atributos.length ? atributos : null,
  };
}

function limpiarGuiones(v: unknown): string | null {
  const s = textoONull(v);
  return s && !/^-+$/.test(s) ? s : null;
}

function mapAclaracion(a: Attrs): AclaracionNormalizada {
  const nom = textoONull(a.nom_archivo);
  return { fecha: parseFechaArce(a.fecha), texto: textoONull(a.texto), nomArchivo: nom, url: nom ? urlAclaracion(nom) : null };
}

function mapAdjudicacion(a: Attrs): AdjudicacionNormalizada {
  const desc = textoONull(a.desc_articulo) ?? '';
  return {
    nroItem: entONull(a.nro_item) ?? 0,
    idArticulo: entONull(a.id_articulo) ?? 0,
    descArticulo: desc,
    descNormalizada: normalizarTexto(desc),
    nroDocProv: textoONull(a.nro_doc_prov),
    nombreComercial: textoONull(a.nombre_comercial),
    cantAdj: numONull(a.cant_adj),
    precioUnit: numONull(a.precio_unit),
    precioTotal: numONull(a.precio_tot_imp),
    idMoneda: entONull(a.id_moneda) ?? 0,
    unidad: textoONull(a.unidad),
  };
}

function mapOferente(o: Attrs): OferenteNormalizado | null {
  const doc = textoONull(o.nro_doc_prov);
  return doc ? { nroDocProv: doc, nombreComercial: textoONull(o.nombre_comercial) } : null;
}

export function mapCompra(c: CompraXml): CompraNormalizada | null {
  const idCompra = textoONull(c.id_compra);
  const tipoCompra = textoONull(c.id_tipocompra);
  if (!idCompra || !tipoCompra) return null;
  const apertura = parseFechaArce(c.fecha_hora_apertura);
  const topeEntrega = parseFechaArce(c.fecha_hora_tope_entrega);
  const { items, aclaraciones_lla, aclaraciones_adj, oferentes, adjudicaciones, ...attrs } = c;
  return {
    idCompra,
    tipoCompra: tipoCompra.slice(0, 2),
    subtipoCompra: textoONull(c.subtipo_compra),
    numCompra: textoONull(c.num_compra),
    anioCompra: entONull(c.anio_compra),
    inciso: entONull(c.id_inciso),
    ue: entONull(c.id_ue),
    objeto: textoONull(c.objeto),
    estado: entONull(c.estado_compra),
    fechaPublicacion: parseFechaArce(c.fecha_publicacion),
    fechaUltMod: parseFechaArce(c.fecha_ult_mod_llamado),
    fechaApertura: apertura,
    // Recepción de ofertas: tope de entrega si existe; si no, la apertura.
    fechaTopeOfertas: topeEntrega ?? apertura,
    fechaSolAclar: parseFechaArce(c.fecha_sol_aclar),
    fechaSolProrr: parseFechaArce(c.fecha_sol_prorr),
    fechaTopeEntrega: topeEntrega,
    lugarApertura: textoONull(c.lugar_apertura),
    lugarEntrega: textoONull(c.lugar_entrega),
    precioPliego: numONull(c.precio_pliego),
    monedaPliego: entONull(c.id_moneda_pliego),
    nombreContacto: textoONull(c.nombre_contacto),
    emailContacto: textoONull(c.email_contacto),
    nombrePliego: textoONull(c.nombre_pliego),
    urlDetalle: urlDetalleCompra(idCompra),
    aperturaElectronica: c.apel === 'S',
    fuente: 'xml',
    fechaPubAdj: parseFechaArce(c.fecha_pub_adj),
    montoAdj: numONull(c.monto_adj),
    items: (items?.item ?? []).map(mapItem),
    aclaraciones: [...(aclaraciones_lla?.aclaracion ?? []), ...(aclaraciones_adj?.aclaracion ?? [])].map(mapAclaracion),
    adjudicaciones: (adjudicaciones?.adjudicacion ?? []).map(mapAdjudicacion),
    oferentes: (oferentes?.oferente ?? []).map(mapOferente).filter((o): o is OferenteNormalizado => o !== null),
    raw: attrs,
  };
}

/** Divide [desde, hasta] en ventanas de ≤ 10 días (límite de ARCE). */
export function ventanas(desde: Date, hasta: Date, dias = MAX_DIAS_VENTANA): Array<{ desde: Date; hasta: Date }> {
  const out: Array<{ desde: Date; hasta: Date }> = [];
  let ini = new Date(desde);
  while (ini < hasta) {
    const fin = new Date(Math.min(ini.getTime() + dias * 24 * 3600 * 1000 - 1000, hasta.getTime()));
    out.push({ desde: ini, hasta: fin });
    ini = new Date(fin.getTime() + 1000);
  }
  return out;
}

/** Descarga y normaliza un rango completo, ventana por ventana. `onVentana` permite loguear progreso. */
export async function generarReporte(
  tipo: TipoPublicacion,
  desde: Date,
  hasta: Date,
  opts: { tipoCompra?: string; onVentana?: (info: { desde: Date; hasta: Date; compras: number; bytes: number; ms: number }) => void } = {},
): Promise<CompraNormalizada[]> {
  const resultado: CompraNormalizada[] = [];
  for (const v of ventanas(desde, hasta)) {
    const t0 = Date.now();
    const xml = await fetchConReintentos(urlReporte(tipo, v.desde, v.hasta, opts.tipoCompra));
    const { compras } = parsearReporte(xml);
    for (const c of compras) {
      const m = mapCompra(c);
      if (m) resultado.push(m);
    }
    opts.onVentana?.({ desde: v.desde, hasta: v.hasta, compras: compras.length, bytes: xml.length, ms: Date.now() - t0 });
  }
  return resultado;
}
