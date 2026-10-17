// Contexto y prompt del chat con el pliego: metadata de la licitación + texto de los archivos
// relevantes con párrafos numerados [pN] para poder citar.
import { and, asc, eq } from 'drizzle-orm';
import type { SystemModelMessage } from 'ai';
import { db } from '@/db';
import { licitacionAclaraciones, licitacionArchivos, licitaciones, licitacionItems } from '@/db/schema';
import type { CategoriaArchivo } from '@/lib/types';
import { PRIORIDAD } from '@/server/arce/clasificar';

const MAX_CARACTERES = 350_000;
const LARGO_PARRAFO = 700;

// Mismo orden que usa el análisis del pliego (seba) cuando el texto no entra completo.
const prioridad = (categoria: string) => PRIORIDAD[categoria as CategoriaArchivo] ?? 9;

export interface ArchivoEnContexto {
  nombre: string;
  categoria: string;
  parrafos: number;
  recortado: boolean;
}

export interface ContextoPliego {
  idCompra: string;
  objeto: string;
  emailContacto: string | null;
  basadoEn: 'pliego' | 'metadata';
  archivos: ArchivoEnContexto[];
  omitidos: string[];
  texto: string;
}

/**
 * Divide un texto en párrafos estables (la numeración tiene que coincidir entre el contexto
 * que ve el modelo y la cita que muestra la UI). Si el texto viene sin líneas en blanco
 * (típico de PDFs), agrupa líneas hasta ~700 caracteres.
 */
export function dividirEnParrafos(texto: string): string[] {
  const bloques = texto
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  const parrafos: string[] = [];
  for (const bloque of bloques) {
    if (bloque.length <= LARGO_PARRAFO * 2) {
      parrafos.push(bloque.replace(/\n+/g, ' '));
      continue;
    }
    let actual = '';
    for (const linea of bloque.split('\n')) {
      if (actual && actual.length + linea.length > LARGO_PARRAFO) {
        parrafos.push(actual.trim());
        actual = '';
      }
      actual += `${linea} `;
    }
    if (actual.trim()) parrafos.push(actual.trim());
  }
  return parrafos;
}

export async function armarContextoPliego(idCompra: string): Promise<ContextoPliego | null> {
  const [licitacion] = await db.select().from(licitaciones).where(eq(licitaciones.idCompra, idCompra)).limit(1);
  if (!licitacion) return null;

  const [items, aclaraciones, archivos] = await Promise.all([
    db.select().from(licitacionItems).where(eq(licitacionItems.idCompra, idCompra)).orderBy(asc(licitacionItems.nroItem)),
    db.select().from(licitacionAclaraciones).where(eq(licitacionAclaraciones.idCompra, idCompra)).orderBy(asc(licitacionAclaraciones.fecha)),
    db
      .select({ nombre: licitacionArchivos.nombre, categoria: licitacionArchivos.categoria, texto: licitacionArchivos.texto })
      .from(licitacionArchivos)
      .where(
        and(
          eq(licitacionArchivos.idCompra, idCompra),
          eq(licitacionArchivos.relevante, true),
          eq(licitacionArchivos.estadoExtraccion, 'ok'),
        ),
      ),
  ]);

  const fecha = (d: Date | null) =>
    d ? d.toLocaleString('es-UY', { timeZone: 'America/Montevideo', dateStyle: 'short', timeStyle: 'short' }) : 'no informada';

  const metadata = [
    '=== DATOS DE LA LICITACIÓN (portal ARCE) ===',
    `Compra: ${licitacion.tipoCompra} ${licitacion.numCompra ?? ''}/${licitacion.anioCompra ?? ''} (id ${licitacion.idCompra})`,
    `Objeto: ${licitacion.objeto ?? 'sin objeto'}`,
    `Organismo: ${licitacion.organismo ?? 'no informado'}${licitacion.unidadEjecutora ? ` · ${licitacion.unidadEjecutora}` : ''}`,
    `Publicación: ${fecha(licitacion.fechaPublicacion)}`,
    `Recepción de ofertas hasta: ${fecha(licitacion.fechaTopeOfertas)}`,
    `Apertura: ${fecha(licitacion.fechaApertura)}${licitacion.lugarApertura ? ` en ${licitacion.lugarApertura}` : ''}`,
    `Consultas hasta: ${fecha(licitacion.fechaSolAclar)} · Prórroga hasta: ${fecha(licitacion.fechaSolProrr)}`,
    `Lugar de entrega: ${licitacion.lugarEntrega ?? 'no informado'}`,
    `Precio del pliego: ${licitacion.precioPliego ?? 'sin costo informado'}`,
    `Contacto: ${[licitacion.nombreContacto, licitacion.emailContacto].filter(Boolean).join(' · ') || 'no informado'}`,
    `Página en ARCE: ${licitacion.urlDetalle ?? 'no informada'}`,
    '',
    'Ítems:',
    ...(items.length
      ? items.map(
          (i) =>
            `- Ítem ${i.nroItem}: ${i.descArticulo} · cantidad ${i.cantPedida ?? '?'} ${i.unidad ?? ''}${
              i.variante ? ` · variante ${i.variante}` : ''
            }${i.presentacion ? ` · presentación ${i.presentacion}` : ''}${i.marca ? ` · marca ${i.marca}` : ''}`,
        )
      : ['- (sin ítems publicados)']),
    ...(aclaraciones.length
      ? ['', 'Aclaraciones publicadas en el portal:', ...aclaraciones.map((a) => `- ${fecha(a.fecha)}: ${a.texto ?? a.nomArchivo ?? ''}`)]
      : []),
  ].join('\n');

  const ordenados = archivos
    .filter((a) => a.texto?.trim())
    .sort((a, b) => prioridad(a.categoria) - prioridad(b.categoria));

  let restante = MAX_CARACTERES - metadata.length;
  const bloques: string[] = [];
  const incluidos: ArchivoEnContexto[] = [];
  const omitidos: string[] = [];

  for (const archivo of ordenados) {
    if (restante <= 2_000) {
      omitidos.push(archivo.nombre);
      continue;
    }
    const parrafos = dividirEnParrafos(archivo.texto ?? '');
    const lineas: string[] = [];
    let usados = 0;
    let recortado = false;
    for (let i = 0; i < parrafos.length; i++) {
      const linea = `[p${i + 1}] ${parrafos[i]}`;
      if (usados + linea.length > restante) {
        recortado = true;
        break;
      }
      lineas.push(linea);
      usados += linea.length + 1;
    }
    restante -= usados;
    bloques.push(`=== ARCHIVO: ${archivo.nombre} (${archivo.categoria}) ===\n${lineas.join('\n')}`);
    incluidos.push({ nombre: archivo.nombre, categoria: archivo.categoria, parrafos: lineas.length, recortado });
  }

  return {
    idCompra,
    objeto: licitacion.objeto ?? '',
    emailContacto: licitacion.emailContacto,
    basadoEn: incluidos.length > 0 ? 'pliego' : 'metadata',
    archivos: incluidos,
    omitidos,
    texto: [metadata, ...bloques].join('\n\n'),
  };
}

/** Texto de un párrafo citado ([archivo, pN]) para mostrarlo en la UI. */
export async function buscarParrafo(idCompra: string, archivo: string, numero: number): Promise<string | null> {
  const [fila] = await db
    .select({ texto: licitacionArchivos.texto })
    .from(licitacionArchivos)
    .where(and(eq(licitacionArchivos.idCompra, idCompra), eq(licitacionArchivos.nombre, archivo)))
    .limit(1);
  if (!fila?.texto) return null;
  return dividirEnParrafos(fila.texto)[numero - 1] ?? null;
}

const REGLAS = `Sos el asistente de Luxis que responde preguntas sobre UNA licitación pública de Uruguay (portal ARCE) a una barraca de materiales de construcción.
Reglas:
- Respondés solo con información del pliego y los datos de la licitación que tenés abajo. Nunca uses conocimiento externo sobre esta licitación.
- Cada afirmación lleva cita con el formato exacto [nombre del archivo, pN] (ej. [Pliego particular.pdf, p12]). Para datos del portal citá [Datos ARCE]. No inventes números de párrafo.
- Si la respuesta no está, decí claramente "No está en el pliego" y sugerí a quién consultar (el contacto de la licitación si existe) y hasta cuándo se pueden hacer consultas.
- Respondé en español rioplatense, conciso. Usá viñetas ("- ") cuando enumeres requisitos o documentos.
- Nunca inventes fechas, montos, cantidades ni requisitos. Si un dato es ambiguo, decilo.
- Si te preguntan algo que no tiene que ver con esta licitación, respondé en una frase que solo podés ayudar con este pliego.`;

/** Mensajes de sistema: reglas + contexto del pliego (con breakpoint de prompt caching de Anthropic). */
export function instruccionesChatPliego(contexto: ContextoPliego): SystemModelMessage[] {
  const avisos: string[] = [];
  if (contexto.basadoEn === 'metadata') {
    avisos.push(
      'IMPORTANTE: no tenemos el texto del pliego de esta licitación (no se pudo descargar o leer). Respondé solo con los datos del portal y aclará al principio de cada respuesta que no tenés el pliego.',
    );
  }
  const recortados = contexto.archivos.filter((a) => a.recortado).map((a) => a.nombre);
  if (recortados.length || contexto.omitidos.length) {
    avisos.push(
      `AVISO: el pliego es muy largo y no entró completo.${recortados.length ? ` Recortados: ${recortados.join(', ')}.` : ''}${
        contexto.omitidos.length ? ` No incluidos: ${contexto.omitidos.join(', ')}.` : ''
      } Si la respuesta podría estar en esas partes, decilo.`,
    );
  }

  return [
    { role: 'system', content: [REGLAS, ...avisos].join('\n\n') },
    {
      role: 'system',
      content: contexto.texto,
      providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
    },
  ];
}
