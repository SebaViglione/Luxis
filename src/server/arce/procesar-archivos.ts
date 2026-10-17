import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { descargarArchivo } from './descargas';
import { extraerTexto, extensionDe, decodificarTexto, type ArchivoExtraido } from './extraccion';
import { clasificarArchivo, marcarRelevantes } from './clasificar';
import { urlPliego, BASE_ARCE } from './normalizar';

const MAX_TEXTO = 400_000;

/**
 * Algunos organismos (Intendencia de Montevideo) publican como pliego un .html chico con un link a su web.
 * Seguimos ese link: devolvemos las URLs de archivos que linkee y el texto de la página (trae el detalle de la compra).
 */
async function seguirStubHtml(buf: Buffer): Promise<{ urls: string[]; link: string | null; texto: string | null }> {
  const $ = cheerio.load(decodificarTexto(buf));
  const link = $('a[href]').map((_, a) => $(a).attr('href')).get().find((h) => /^https?:/i.test(h)) ?? null;
  if (!link) return { urls: [], link: null, texto: null };
  try {
    const pagina = await descargarArchivo(link);
    const $$ = cheerio.load(decodificarTexto(pagina.buffer));
    const urls = $$('a[href]').map((_, a) => $$(a).attr('href')).get()
      .filter((h) => /\.(pdf|docx?|xlsx?|zip|rar)(\?|$)/i.test(h) || /\$FILE\//i.test(h))
      .map((h) => new URL(h, link).toString());
    $$('script, style').remove();
    const texto = $$('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    return { urls: [...new Set(urls)].slice(0, 10), link, texto: texto.length > 200 ? texto : null };
  } catch { return { urls: [], link, texto: null }; }
}

export interface ResultadoArchivos { archivos: number; ok: number; noSoportados: number; errores: number }

/** Descarga pliego y aclaraciones de una licitación, extrae texto, clasifica y guarda en licitacion_archivos. */
export async function procesarArchivos(idCompra: string): Promise<ResultadoArchivos> {
  const [l] = await db.select().from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra));
  if (!l) throw new Error(`Licitación ${idCompra} no encontrada`);
  const acl = await db.select().from(schema.licitacionAclaraciones).where(eq(schema.licitacionAclaraciones.idCompra, idCompra));

  const fuentes: Array<{ url: string; esAclaracion: boolean }> = [];
  if (l.nombrePliego) fuentes.push({ url: urlPliego(l.nombrePliego), esAclaracion: false });
  for (const a of acl) if (a.url) fuentes.push({ url: a.url, esAclaracion: true });

  const extraidos: Array<ArchivoExtraido & { url: string; esAclaracion: boolean }> = [];
  for (const f of fuentes) {
    try {
      const d = await descargarArchivo(f.url);
      const nombre = decodeURIComponent(f.url.split('/').pop() ?? d.nombreFinal);
      if (extensionDe(nombre) === 'html' && d.buffer.length < 4096) {
        const stub = await seguirStubHtml(d.buffer);
        for (const u of stub.urls) {
          try {
            const r = await descargarArchivo(u);
            const n = decodeURIComponent(u.split('/').pop()!.split('?')[0]);
            for (const x of await extraerTexto(n, r.buffer, nombre)) extraidos.push({ ...x, url: u, esAclaracion: f.esAclaracion });
          } catch (e) {
            extraidos.push({ nombre: u.split('/').pop()!, extension: extensionDe(u), contenedor: nombre, tamano: 0, texto: null, estado: 'error', error: (e as Error).message, url: u, esAclaracion: f.esAclaracion });
          }
        }
        if (stub.texto && stub.link) {
          extraidos.push({ nombre: 'detalle_en_web_del_organismo.html', extension: 'html', contenedor: nombre, tamano: stub.texto.length, texto: stub.texto, estado: 'ok', url: stub.link, esAclaracion: false });
        }
        if (stub.urls.length || stub.texto) continue;
      }
      for (const x of await extraerTexto(nombre, d.buffer)) extraidos.push({ ...x, url: f.url, esAclaracion: f.esAclaracion });
    } catch (e) {
      extraidos.push({ nombre: f.url.split('/').pop() ?? 'archivo', extension: extensionDe(f.url), contenedor: null, tamano: 0, texto: null, estado: 'error', error: (e as Error).message, url: f.url, esAclaracion: f.esAclaracion });
    }
  }

  const clasificados = marcarRelevantes(extraidos.map((x) => ({
    ...x, categoria: (() => { const c = clasificarArchivo(x.nombre, x.texto); return x.esAclaracion && c === 'otro' ? 'aclaracion' as const : c; })(),
  })));

  await db.delete(schema.licitacionArchivos).where(eq(schema.licitacionArchivos.idCompra, idCompra));
  if (clasificados.length) {
    await db.insert(schema.licitacionArchivos).values(clasificados.map((x) => ({
      idCompra, nombre: x.nombre, url: x.url.startsWith('http') ? x.url : new URL(x.url, BASE_ARCE).toString(), extension: x.extension,
      tamano: x.tamano, contenedor: x.contenedor, categoria: x.categoria, relevante: x.relevante, estadoExtraccion: x.estado,
      error: x.error ?? null, texto: x.texto ? x.texto.slice(0, MAX_TEXTO) : null, caracteres: x.texto?.length ?? null,
    })));
  }
  await db.update(schema.licitaciones).set({ archivosProcesados: true, updatedAt: new Date() }).where(eq(schema.licitaciones.idCompra, idCompra));
  return {
    archivos: clasificados.length, ok: clasificados.filter((x) => x.estado === 'ok').length,
    noSoportados: clasificados.filter((x) => x.estado === 'no_soportado').length, errores: clasificados.filter((x) => x.estado === 'error').length,
  };
}
