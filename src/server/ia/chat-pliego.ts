// Contexto y prompt del chat con el pliego: metadata de la licitación + texto de los archivos
// relevantes con párrafos numerados [pN] para poder citar.
import { and, asc, eq } from 'drizzle-orm';
import type { SystemModelMessage } from 'ai';
import { db } from '@/db';
import { licitacionAclaraciones, licitacionArchivos, licitaciones, licitacionItems } from '@/db/schema';
import type { CategoriaArchivo, PerfilEmpresa } from '@/lib/types';
import { PRIORIDAD } from '@/server/arce/clasificar';
import { buscarParrafos, obtenerParrafo, resumenParrafos } from '@/server/ia/busqueda';

const MAX_CARACTERES = 350_000;
/** Por encima de este total de texto relevante, el chat usa búsqueda híbrida (extractos) en vez del texto completo. */
const UMBRAL_EXTRACTOS = 60_000;
const K_EXTRACTOS = 14;
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
  /** 'completo': todo el texto relevante; 'extractos': párrafos recuperados por búsqueda híbrida. */
  modo: 'completo' | 'extractos';
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
    // Líneas larguísimas (texto sin saltos, típico de algunos .docx/.xml) se parten por oraciones.
    const segmentos = bloque
      .split('\n')
      .flatMap((linea) => (linea.length > LARGO_PARRAFO * 2 ? linea.split(/(?<=[.;:])\s+(?=\S)/) : [linea]))
      .flatMap((oracion) => (oracion.length > LARGO_PARRAFO * 2 ? oracion.match(/.{1,700}(?:\s|$)|\S+/g) ?? [oracion] : [oracion]));
    let actual = '';
    for (const linea of segmentos) {
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

/**
 * Arma el contexto del chat. Pliegos chicos: texto completo. Pliegos grandes (> 60k caracteres relevantes) y con
 * `consulta`: solo los párrafos que recupera la búsqueda híbrida (vectorial + full-text), con la misma numeración [pN].
 */
export async function armarContextoPliego(idCompra: string, consulta?: string): Promise<ContextoPliego | null> {
  // La búsqueda (que incluye ~1–2 s de embedding en Gemini) arranca en paralelo con la lectura de la licitación.
  const busqueda = consulta?.trim() ? buscarParrafos(idCompra, consulta, { k: K_EXTRACTOS }).catch(() => []) : null;
  const [licitacion] = await db.select().from(licitaciones).where(eq(licitaciones.idCompra, idCompra)).limit(1);
  if (!licitacion) return null;

  const [items, aclaraciones, archivos] = await Promise.all([
    db.select().from(licitacionItems).where(eq(licitacionItems.idCompra, idCompra)).orderBy(asc(licitacionItems.nroItem)),
    db.select().from(licitacionAclaraciones).where(eq(licitacionAclaraciones.idCompra, idCompra)).orderBy(asc(licitacionAclaraciones.fecha)),
    db
      .select({ nombre: licitacionArchivos.nombre, categoria: licitacionArchivos.categoria, caracteres: licitacionArchivos.caracteres })
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

  const totalCaracteres = archivos.reduce((t, a) => t + (a.caracteres ?? 0), 0);
  if (busqueda && totalCaracteres > UMBRAL_EXTRACTOS) {
    const extractos = contextoPorExtractos(await busqueda, archivos.map((a) => a.nombre));
    if (extractos) {
      return {
        idCompra, objeto: licitacion.objeto ?? '', emailContacto: licitacion.emailContacto, basadoEn: 'pliego',
        archivos: extractos.archivos, omitidos: [], modo: 'extractos', texto: [metadata, ...extractos.bloques].join('\n\n'),
      };
    }
  }

  const conTexto = await db
    .select({ nombre: licitacionArchivos.nombre, categoria: licitacionArchivos.categoria, texto: licitacionArchivos.texto })
    .from(licitacionArchivos)
    .where(and(eq(licitacionArchivos.idCompra, idCompra), eq(licitacionArchivos.relevante, true), eq(licitacionArchivos.estadoExtraccion, 'ok')));
  const ordenados = conTexto
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
    bloques.push(`=== ARCHIVO: "${archivo.nombre}" ===\n(tipo de documento: ${archivo.categoria})\n${lineas.join('\n')}`);
    incluidos.push({ nombre: archivo.nombre, categoria: archivo.categoria, parrafos: lineas.length, recortado });
  }

  return {
    idCompra,
    objeto: licitacion.objeto ?? '',
    emailContacto: licitacion.emailContacto,
    basadoEn: incluidos.length > 0 ? 'pliego' : 'metadata',
    archivos: incluidos,
    omitidos,
    modo: 'completo',
    texto: [metadata, ...bloques].join('\n\n'),
  };
}

/**
 * Resumen para el tab del chat (qué se leyó) sin cargar el texto de pliegos grandes:
 * usa los conteos de licitacion_parrafos; si el pliego es chico o no está indexado, arma el contexto normal.
 */
export async function resumenContextoPliego(idCompra: string): Promise<Omit<ContextoPliego, 'texto'> | null> {
  const [lic] = await db.select({ objeto: licitaciones.objeto, emailContacto: licitaciones.emailContacto }).from(licitaciones).where(eq(licitaciones.idCompra, idCompra)).limit(1);
  if (!lic) return null;
  const archivos = await db.select({ nombre: licitacionArchivos.nombre, caracteres: licitacionArchivos.caracteres }).from(licitacionArchivos)
    .where(and(eq(licitacionArchivos.idCompra, idCompra), eq(licitacionArchivos.relevante, true), eq(licitacionArchivos.estadoExtraccion, 'ok')));
  const total = archivos.reduce((t, a) => t + (a.caracteres ?? 0), 0);
  if (total > UMBRAL_EXTRACTOS) {
    const nombres = new Set(archivos.map((a) => a.nombre));
    const resumen = (await resumenParrafos(idCompra)).filter((r) => nombres.has(r.archivo_nombre));
    if (resumen.length) {
      return {
        idCompra, objeto: lic.objeto ?? '', emailContacto: lic.emailContacto, basadoEn: 'pliego', modo: 'extractos', omitidos: [],
        archivos: resumen.sort((a, b) => prioridad(a.categoria) - prioridad(b.categoria))
          .map((r) => ({ nombre: r.archivo_nombre, categoria: r.categoria, parrafos: r.parrafos, recortado: false })),
      };
    }
  }
  const completo = await armarContextoPliego(idCompra);
  if (!completo) return null;
  const { texto: _texto, ...resto } = completo;
  void _texto;
  return resto;
}

/** Párrafos relevantes para la consulta, agrupados por archivo (orden PRIORIDAD) y con su [pN] original. */
function contextoPorExtractos(resultados: Awaited<ReturnType<typeof buscarParrafos>>, relevantes: string[]) {
  const encontrados = resultados.filter((p) => relevantes.includes(p.archivoNombre));
  if (!encontrados.length) return null;
  const porArchivo = new Map<string, { categoria: string; parrafos: Map<number, string> }>();
  for (const p of encontrados) {
    const g = porArchivo.get(p.archivoNombre) ?? { categoria: p.categoria, parrafos: new Map() };
    g.parrafos.set(p.nroParrafo, p.texto);
    porArchivo.set(p.archivoNombre, g);
  }
  const ordenados = [...porArchivo.entries()].sort((a, b) => prioridad(a[1].categoria) - prioridad(b[1].categoria));
  const bloques = ordenados.map(([nombre, g]) => {
    const lineas = [...g.parrafos.entries()].sort((a, b) => a[0] - b[0]).map(([n, t]) => `[p${n}] ${t}`);
    return `=== ARCHIVO: "${nombre}" ===\n(tipo de documento: ${g.categoria} · extractos seleccionados)\n${lineas.join('\n')}`;
  });
  const archivos: ArchivoEnContexto[] = ordenados.map(([nombre, g]) => ({ nombre, categoria: g.categoria, parrafos: g.parrafos.size, recortado: true }));
  return { bloques, archivos };
}

const normalizarNombre = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Texto de un párrafo citado ([archivo, pN]) para mostrarlo en la UI. Tolera que el modelo cite el
 * nombre con otra capitalización, sin extensión, abreviado o con el tipo de documento
 * ("pliego_particular") en lugar del nombre.
 */
export async function buscarParrafo(
  idCompra: string,
  archivo: string,
  numero: number,
): Promise<{ archivo: string; texto: string } | null> {
  // Camino rápido: un solo párrafo desde licitacion_parrafos (misma numeración), sin cargar el archivo.
  const rapido = await obtenerParrafo(idCompra, archivo, numero).catch(() => null);
  if (rapido) return { archivo: rapido.archivoNombre, texto: rapido.texto };
  const archivos = await db
    .select({ nombre: licitacionArchivos.nombre, categoria: licitacionArchivos.categoria, texto: licitacionArchivos.texto })
    .from(licitacionArchivos)
    .where(and(eq(licitacionArchivos.idCompra, idCompra), eq(licitacionArchivos.estadoExtraccion, 'ok')));
  const conTexto = archivos.filter((a) => a.texto);
  const buscado = normalizarNombre(archivo);
  const porPrioridad = (lista: typeof conTexto) => [...lista].sort((a, b) => prioridad(a.categoria) - prioridad(b.categoria));

  const elegido =
    conTexto.find((a) => a.nombre === archivo) ??
    conTexto.find((a) => normalizarNombre(a.nombre) === buscado) ??
    porPrioridad(conTexto.filter((a) => normalizarNombre(a.categoria) === buscado))[0] ??
    porPrioridad(
      conTexto.filter((a) => {
        const nombre = normalizarNombre(a.nombre);
        return buscado.length >= 4 && (nombre.includes(buscado) || buscado.includes(nombre));
      }),
    )[0];
  if (!elegido?.texto) return null;

  const texto = dividirEnParrafos(elegido.texto)[numero - 1];
  return texto ? { archivo: elegido.nombre, texto } : null;
}

const REGLAS = `Sos el asistente de Luxis que responde preguntas sobre UNA licitación pública de Uruguay (portal ARCE) a una barraca de materiales de construcción.
Reglas:
- Respondés solo con información del pliego y los datos de la licitación que tenés abajo. Nunca uses conocimiento externo sobre esta licitación.
- Cada afirmación lleva una cita con el formato exacto [nombre del archivo, pN]. El nombre tiene que ser IDÉNTICO al que aparece entre comillas en el encabezado === ARCHIVO: "…" === (no uses el tipo de documento ni lo abrevies) y pN es UN solo párrafo. Si te apoyás en varios párrafos, poné varias citas seguidas: [Pliego de Condiciones Particulares.pdf, p12] [Pliego de Condiciones Particulares.pdf, p13]. Nunca uses rangos ni agregues texto dentro de los corchetes. Para datos del portal citá [Datos ARCE]. No inventes números de párrafo.
- Si la respuesta no está, decí claramente "No está en el pliego" y sugerí a quién consultar (el contacto de la licitación si existe) y hasta cuándo se pueden hacer consultas.
- Respondé en español rioplatense, conciso. Usá viñetas ("- ") cuando enumeres requisitos o documentos.
- Nunca inventes fechas, montos, cantidades ni requisitos. Si un dato es ambiguo, decilo.
- Si te preguntan algo que no tiene que ver con esta licitación, respondé en una frase que solo podés ayudar con este pliego.`;

const REGLAS_PERFIL = `Además del pliego tenés el PERFIL DE LA EMPRESA que pregunta (lo cargó en Luxis; no es parte del pliego). Usalo para responder qué ítems puede ofertar comparando con sus productos, unidades y zonas de entrega, qué documentos le faltan o si la entrega le queda lejos. Lo que salga del perfil citalo como [Perfil de tu empresa]; lo del pliego, con [archivo, pN]. Nunca digas que la empresa vende algo que no figura en sus productos: si hay un equivalente probable, decí que es un equivalente y que lo confirme.`;

const ESTADO_DOC_TEXTO: Record<string, string> = { vigente: 'vigente', en_tramite: 'en trámite', no_tiene: 'no tiene', vencido: 'vencido', desconocido: 'sin dato' };

function bloquePerfil(perfil: PerfilEmpresa): string {
  const precio = (p: PerfilEmpresa['productos'][number]) =>
    p.precioReferencia == null ? 'sin precio de lista' : `${p.moneda === 'USD' ? 'US$' : '$'} ${p.precioReferencia.toLocaleString('es-UY')} sin IVA`;
  return [
    '=== PERFIL DE LA EMPRESA QUE PREGUNTA ===',
    `Empresa: ${perfil.nombre}${perfil.localidad ? ` (${perfil.localidad}${perfil.departamento ? `, ${perfil.departamento}` : ''})` : ''}`,
    `Entrega en: ${perfil.zonasEntrega.length ? perfil.zonasEntrega.join(', ') : 'sin dato'}`,
    `Capacidad: ${perfil.capacidadNotas || 'sin dato'}`,
    `Documentación: ${perfil.documentacion.map((d) => `${d.tipo === 'OTRO' ? d.nombre : d.tipo}: ${ESTADO_DOC_TEXTO[d.estado] ?? d.estado}`).join('; ')}`,
    `Productos que vende (${perfil.productos.length}), nombre · unidad · precio de lista:`,
    ...perfil.productos.slice(0, 300).map((p) => `- ${p.nombre} · ${p.unidad || 'sin unidad'} · ${precio(p)}`),
  ].join('\n');
}

/** Mensajes de sistema: reglas + contexto del pliego (con breakpoint de prompt caching de Anthropic) + perfil de la empresa. */
export function instruccionesChatPliego(contexto: ContextoPliego, perfil?: PerfilEmpresa | null): SystemModelMessage[] {
  const avisos: string[] = [];
  if (contexto.basadoEn === 'metadata') {
    avisos.push(
      'IMPORTANTE: no tenemos el texto del pliego de esta licitación (no se pudo descargar o leer). Respondé solo con los datos del portal y aclará al principio de cada respuesta que no tenés el pliego.',
    );
  }
  if (contexto.modo === 'extractos') {
    avisos.push(
      'AVISO: el pliego es largo; abajo tenés EXTRACTOS (párrafos seleccionados por búsqueda para esta pregunta), no el texto completo. Los [pN] son los números reales de cada archivo: citalos tal cual. Si la respuesta no aparece en los extractos, decí que no la encontraste en las partes consultadas del pliego y sugerí reformular la pregunta o consultar al contacto.',
    );
  }
  const recortados = contexto.modo === 'completo' ? contexto.archivos.filter((a) => a.recortado).map((a) => a.nombre) : [];
  if (recortados.length || contexto.omitidos.length) {
    avisos.push(
      `AVISO: el pliego es muy largo y no entró completo.${recortados.length ? ` Recortados: ${recortados.join(', ')}.` : ''}${
        contexto.omitidos.length ? ` No incluidos: ${contexto.omitidos.join(', ')}.` : ''
      } Si la respuesta podría estar en esas partes, decilo.`,
    );
  }

  // El perfil va después del pliego: así el prefijo cacheado (reglas + pliego) es el mismo para todas las empresas.
  return [
    { role: 'system', content: [REGLAS, ...avisos].join('\n\n') },
    {
      role: 'system',
      content: contexto.texto,
      providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
    },
    ...(perfil ? [{ role: 'system' as const, content: `${REGLAS_PERFIL}\n\n${bloquePerfil(perfil)}` }] : []),
  ];
}
