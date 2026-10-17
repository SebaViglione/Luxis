import * as cheerio from 'cheerio';
import { textoDeHtml } from './extraer-texto';

export interface PaginaWeb {
  url: string;
  texto: string;
}

const UA_NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const TIMEOUT_MS = 15_000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_CARACTERES_POR_PAGINA = 40_000;
const MAX_LINKS_INTERNOS = 3;
const LINKS_INTERESANTES = /producto|catalogo|catálogo|nosotros|quienes|quiénes|empresa|servicio|materiales|lista|precios/i;

export class WebNoDisponibleError extends Error {}

/** Normaliza lo que pega el usuario ("mibarraca.com.uy" → "https://mibarraca.com.uy/"). */
export function normalizarUrl(entrada: string): URL {
  const conProtocolo = /^https?:\/\//i.test(entrada.trim()) ? entrada.trim() : `https://${entrada.trim()}`;
  let url: URL;
  try {
    url = new URL(conProtocolo);
  } catch {
    throw new WebNoDisponibleError('La dirección web no es válida.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || esHostPrivado(url.hostname)) {
    throw new WebNoDisponibleError('La dirección web no es válida.');
  }
  return url;
}

/**
 * Descarga la web de la empresa y hasta 3 páginas internas relevantes (/productos, /nosotros, /catalogo…)
 * y devuelve el texto visible de cada una.
 */
export async function fetchWeb(entrada: string): Promise<PaginaWeb[]> {
  const inicio = normalizarUrl(entrada);
  const html = await descargar(inicio);
  const paginas: PaginaWeb[] = [{ url: inicio.toString(), texto: textoDeHtml(html).slice(0, MAX_CARACTERES_POR_PAGINA) }];

  for (const link of linksInternos(html, inicio)) {
    try {
      const htmlInterno = await descargar(link);
      paginas.push({ url: link.toString(), texto: textoDeHtml(htmlInterno).slice(0, MAX_CARACTERES_POR_PAGINA) });
    } catch {
      // Una página interna caída no invalida el resto.
    }
  }
  return paginas.filter((p) => p.texto.length > 0);
}

async function descargar(url: URL): Promise<string> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      headers: { 'User-Agent': UA_NAVEGADOR, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'es-UY,es;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new WebNoDisponibleError(`No pudimos abrir ${url.hostname}: no respondió a tiempo.`);
  }
  if (!respuesta.ok) throw new WebNoDisponibleError(`No pudimos abrir ${url.hostname} (error ${respuesta.status}).`);

  const tipo = respuesta.headers.get('content-type') ?? '';
  if (tipo && !tipo.includes('html') && !tipo.includes('text')) {
    throw new WebNoDisponibleError(`${url.hostname} no devolvió una página web.`);
  }
  const buffer = await respuesta.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) throw new WebNoDisponibleError(`La página de ${url.hostname} es demasiado grande.`);

  const charset = /charset=([^;]+)/i.exec(tipo)?.[1]?.trim().toLowerCase();
  try {
    return new TextDecoder(charset || 'utf-8').decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

function linksInternos(html: string, base: URL): URL[] {
  const $ = cheerio.load(html);
  const vistos = new Set<string>([base.toString()]);
  const candidatos: URL[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const texto = $(el).text();
    if (!LINKS_INTERESANTES.test(href) && !LINKS_INTERESANTES.test(texto)) return;
    try {
      const url = new URL(href, base);
      url.hash = '';
      if (url.hostname !== base.hostname || vistos.has(url.toString())) return;
      if (/\.(pdf|jpe?g|png|gif|zip|rar|docx?|xlsx?)$/i.test(url.pathname)) return;
      vistos.add(url.toString());
      candidatos.push(url);
    } catch {
      // href inválido
    }
  });
  return candidatos.slice(0, MAX_LINKS_INTERNOS);
}

function esHostPrivado(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h === '[::1]') return true;
  const ipv4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
