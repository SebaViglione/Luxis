import * as cheerio from 'cheerio';
import { UA_NAVEGADOR } from './xml';
import {
  BASE_ARCE, normalizarTexto, parseFechaArce, urlDetalleCompra, textoONull,
  type CompraNormalizada, type ItemNormalizado, type AclaracionNormalizada,
} from './normalizar';

const TIPO_POR_NOMBRE: Array<[RegExp, string]> = [
  [/^licitaci[oó]n p[uú]blica/i, 'LP'], [/^licitaci[oó]n abreviada/i, 'LA'], [/^compra directa/i, 'CD'],
  [/^concurso de precios/i, 'CR'], [/^compra por excepci[oó]n/i, 'CE'], [/^convenio marco/i, 'CM'],
  [/^preg[oó]n/i, 'PR'], [/^procedimiento especial/i, 'PE'], [/^llamado a expresiones/i, 'EI'], [/^solicitud de informaci/i, 'SI'],
];

/** Extrae el id de compra de una URL de ARCE o devuelve el texto si ya es un id. */
export function idDesdeUrl(entrada: string): string | null {
  const s = entrada.trim();
  const m = /\/id\/([a-z]?\d+)/i.exec(s) ?? /^([a-z]?\d{4,})$/i.exec(s);
  return m ? m[1] : null;
}

const fechaHs = (s: string | null | undefined) => parseFechaArce((s ?? '').replace(/hs\.?/i, '').trim());
const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

/** Scrapea la página de detalle de un llamado. Devuelve null si no existe. */
export async function scrapeDetalle(idCompra: string): Promise<CompraNormalizada | null> {
  const url = urlDetalleCompra(idCompra);
  const res = await fetch(url, { headers: { 'User-Agent': UA_NAVEGADOR, Referer: `${BASE_ARCE}/consultas`, 'Accept-Language': 'es-UY,es;q=0.9' } });
  if (!res.ok) throw new Error(`ARCE respondió HTTP ${res.status} para ${idCompra}`);
  const $ = cheerio.load(await res.text());
  const titulo = $('h2').first().text().replace(/\s+/g, ' ').trim();
  if (!titulo) return null;

  // "Licitación Abreviada 41/2026 Intendencia de Tacuarembó | Unidad"
  const mt = /^(.+?)\s+([A-Z]?\d+)\/(\d{4})\s+(.+?)(?:\s*\|\s*(.+))?$/.exec(titulo);
  const nombreTipo = mt?.[1] ?? '';
  const tipoCompra = TIPO_POR_NOMBRE.find(([rx]) => rx.test(nombreTipo))?.[1] ?? 'CD';
  const cuerpo = $('.row.content').text().replace(/\s+/g, ' ');
  const objeto = (() => {
    const i = cuerpo.indexOf(titulo, cuerpo.indexOf(titulo) + titulo.length);
    const tras = i > -1 ? cuerpo.slice(i + titulo.length) : '';
    return textoONull(tras.split(/Recepci[oó]n de ofertas hasta:|Fecha Publicaci[oó]n:/)[0]);
  })();
  const campo = (etiqueta: RegExp) => {
    let v: string | null = null;
    $('ul.buy-detail-list').each((_, ul) => {
      const t = $(ul).text().replace(/\s+/g, ' ').trim();
      const m = etiqueta.exec(t);
      if (m && !v) v = textoONull(t.slice(m.index + m[0].length));
    });
    return v as string | null;
  };
  const recepcion = /Recepci[oó]n de ofertas hasta:\s*([\d/]+\s+[\d:]+)/i.exec(cuerpo)?.[1] ?? null;
  const publicacion = /Fecha Publicaci[oó]n:\s*([\d/]+\s+[\d:]+)/i.exec(cuerpo)?.[1] ?? null;
  const apertura = campo(/Acto de Apertura:/i);
  const email = /[\w.+-]+@[\w-]+\.[\w.-]*\w/.exec(campo(/Informaci[oó]n de contacto:/i) ?? cuerpo.split(/Informaci[oó]n de contacto:/i)[1] ?? '')?.[0] ?? null;

  const items: ItemNormalizado[] = [];
  $('.row.item .desc-item').each((_, el) => {
    const h3 = $(el).find('h3');
    const nro = Number(/N[ºo°]\s*(\d+)/.exec(h3.find('.buy-item-title-small').text().replace(/\u00a0/g, ' '))?.[1] ?? items.length + 1);
    const cod = Number(/(\d+)/.exec(h3.find('.cod-art').text())?.[1] ?? 0);
    const desc = h3.clone().children('.buy-item-title-small, .cod-art').remove().end().text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    const cantTxt = $(el).find('ul.list-inline strong').first().text().trim();
    const mc = /([\d.]+(?:,\d+)?)\s*(.*)/.exec(cantTxt);
    const atributos: Record<string, unknown>[] = [];
    $(el).parent().find('table.features-table tbody tr').each((__, tr) => {
      const tds = $(tr).find('td');
      atributos.push({ propiedad: $(tds[0]).text().trim(), valor: $(tds[1]).text().trim() });
    });
    const presentacion = atributos.find((a) => /^presentaci/i.test(String(a.propiedad)))?.valor as string | undefined;
    items.push({
      nroItem: nro, idArticulo: cod, descArticulo: desc, descNormalizada: normalizarTexto(desc),
      cantPedida: mc ? num(mc[1]) : null, unidad: textoONull(mc?.[2]), idMonedaCotiz: 0,
      variante: null, presentacion: presentacion ?? null, marca: null, atributos: atributos.length ? atributos : null,
    });
  });

  const aclaraciones: AclaracionNormalizada[] = [];
  $('.aclaration-container tbody tr').each((_, tr) => {
    const td = $(tr).find('td').first();
    const href = $(tr).find('a[href]').attr('href') ?? null;
    aclaraciones.push({
      fecha: fechaHs(td.find('strong').text()),
      texto: textoONull(td.clone().children('strong').remove().end().text()),
      nomArchivo: href ? decodeURIComponent(href.split('/').pop()!) : null,
      url: href ? new URL(href, BASE_ARCE).toString() : null,
    });
  });

  const hrefPliego = $('a[href*="/Pliegos/"]').first().attr('href') ?? null;
  const inc = /^(.+?)$/.exec(mt?.[4] ?? '');
  return {
    idCompra, tipoCompra, subtipoCompra: null, numCompra: mt?.[2] ?? null, anioCompra: mt ? Number(mt[3]) : null,
    inciso: null, ue: null, objeto, estado: 4,
    fechaPublicacion: fechaHs(publicacion), fechaUltMod: null, fechaApertura: fechaHs(apertura),
    fechaTopeOfertas: fechaHs(recepcion) ?? fechaHs(apertura), fechaSolAclar: fechaHs(campo(/Aclaraciones hasta el:/i)),
    fechaSolProrr: fechaHs(campo(/Pr[oó]rrogas hasta el:/i)), fechaTopeEntrega: fechaHs(recepcion),
    lugarApertura: campo(/Lugar acto de Apertura:/i), lugarEntrega: campo(/Lugar de entrega de ofertas:/i),
    precioPliego: (() => { const p = campo(/^Precio/i); return p ? num(p.replace(/[^\d.,]/g, '')) || null : null; })(),
    monedaPliego: 0, nombreContacto: null, emailContacto: email,
    nombrePliego: hrefPliego ? decodeURIComponent(hrefPliego.split('/').pop()!) : null,
    urlDetalle: url, aperturaElectronica: /apertura electr[oó]nica/i.test(cuerpo), fuente: 'scrape',
    fechaPubAdj: null, montoAdj: null, items, aclaraciones, adjudicaciones: [], oferentes: [],
    organismo: inc?.[1] ?? null, unidadEjecutora: mt?.[5] && mt[5] !== inc?.[1] ? mt[5] : null,
    raw: { titulo },
  };
}
