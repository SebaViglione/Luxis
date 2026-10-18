// IA del perfil de empresa: extracción desde documentos/web/transcript y entrevista por chat y por voz.
import { tool } from 'ai';
import { z } from 'zod';
import { generarObjeto } from '@/lib/ia/estructurado';
import { modeloFuerte } from '@/lib/ia/modelos';
import type { DocumentoEmpresa, PerfilEmpresa, ProductoEmpresa } from '@/lib/types';
import { DEPARTAMENTOS_UY, MAX_PREGUNTAS_ENTREVISTA, UNIDADES } from '@/server/onboarding/constantes';
import { normalizarZonas } from '@/server/onboarding/perfil';

const MAX_CARACTERES_FUENTES = 150_000;
// Una lista de precios de 40+ productos con keywords no entra en el default de 4000 tokens.
const MAX_TOKENS_PERFIL = 16_000;

export interface FuenteTexto {
  /** Nombre del archivo, URL o "Entrevista por voz". */
  fuente: string;
  texto: string;
}

// Esquema que ve el modelo: campos nullables en lugar de opcionales (más estable en salidas estructuradas).
const productoIA = z.object({
  nombre: z.string().describe('Nombre comercial del producto, ej. "Cemento Portland bolsa 25 kg", "Arena terciada"'),
  categoria: z
    .string()
    .describe(
      'Una de: cemento y cal, áridos, ladrillos y bloques, hierro y mallas, chapas y techos, caños y sanitaria, maderas, yeso y placas, impermeabilizantes, adhesivos y pastinas, cerámicas, pinturas, herramientas, otros',
    ),
  unidad: z.enum(UNIDADES).describe('Unidad de venta normalizada'),
  precioReferencia: z.number().nullable().describe('Precio unitario si aparece en el texto; si no, null'),
  moneda: z.enum(['UYU', 'USD', 'UI', 'UR', 'OTRA']).describe('Moneda del precio; UYU si no se aclara'),
  keywords: z
    .array(z.string())
    .describe('3 a 6 palabras clave en MAYÚSCULAS y sin tildes, como aparecen en ítems de licitaciones de ARCE (ej. "PORTLAND", "CEMENTO")'),
});

const documentoIA = z.object({
  tipo: z.enum(['RUPE', 'DGI', 'BPS', 'BSE', 'UNIT', 'ISO', 'OTRO']),
  nombre: z.string().describe('Nombre del documento o certificado'),
  estado: z.enum(['vigente', 'en_tramite', 'no_tiene', 'desconocido', 'vencido']),
  vencimiento: z.string().nullable().describe('Fecha de vencimiento YYYY-MM-DD si aparece; si no, null'),
  notas: z.string().nullable(),
});

const perfilIA = z.object({
  nombre: z.string().nullable(),
  razonSocial: z.string().nullable(),
  rut: z.string().nullable().describe('RUT uruguayo de 12 dígitos, solo números'),
  departamento: z.string().nullable(),
  localidad: z.string().nullable(),
  web: z.string().nullable(),
  telefono: z.string().nullable(),
  emailContacto: z.string().nullable(),
  descripcion: z.string().describe('2 o 3 frases: qué vende la empresa, dónde y a quién'),
  productos: z.array(productoIA),
  zonasEntrega: z.array(z.enum(DEPARTAMENTOS_UY)).describe('Departamentos de Uruguay donde entrega'),
  capacidadNotas: z.string().nullable().describe('Capacidad de entrega semanal, flota, venta a granel/bolsa/pallet'),
  montoMinimo: z.number().nullable().describe('Monto mínimo de una venta que le interesa, en pesos uruguayos'),
  documentacion: z.array(documentoIA),
  experienciaLicitaciones: z.string().nullable(),
  organismosInteres: z.array(z.string()),
  camposFaltantes: z.array(z.string()).describe('Datos que NO pudiste completar con evidencia, en palabras simples'),
});

type PerfilIA = z.infer<typeof perfilIA>;

// Cómo se traducen respuestas habladas a zonas, papeles y montos: lo comparten la extracción y la entrevista.
const REGLAS_RESPUESTAS = `- Zonas: solo departamentos de Uruguay. "Todo el país" son los 19; "área metropolitana" es Montevideo, Canelones y San José; una ciudad o zona ("la Costa", "Punta del Este") cuenta como su departamento.
- Papeles: "sí", "al día" o "activo" es vigente; "lo estoy tramitando" es en_tramite; "se me venció" es vencido; "no tengo" es no_tiene; "no sé" o sin respuesta es desconocido. Si a la pregunta por los papeles contesta "todo al día", vale para RUPE, DGI, BPS y BSE; UNIT e ISO solo si los nombra. Si dice hasta cuándo vence, guardá la fecha.
- Monto mínimo: número en pesos uruguayos ("50 mil" son 50000).`;

const PROMPT_EXTRAER = `Sos un analista que arma el perfil comercial de una barraca de materiales de construcción de Uruguay a partir de documentos, su web o la transcripción de una entrevista.
Devolvé SOLO el objeto JSON del schema. Reglas:
- productos: uno por línea comercial real (ej. "Cemento Portland bolsa 25 kg", "Ladrillo de campo", "Arena terciada m3"). Normalizá unidad (bolsa, unidad, m3, kg, tonelada, m2, metro, rollo, litro). Si hay precio, copialo con su moneda; si no, null.
- Si una planilla trae muchas variantes (medidas, marcas), mantené cada variante que tenga precio propio como producto separado.
- documentacion: marcá vigente solo si el texto lo afirma; si no se menciona, estado "desconocido". "Al día" o "activo" cuenta como vigente; "en trámite" como en_tramite; "no tenemos" como no_tiene.
- zonas_entrega: departamentos de Uruguay mencionados.
- capacidadNotas: en una frase, cuánto entrega por semana, con qué flota y si vende a granel, en bolsa o paletizado.
- descripcion: si los datos cargados ya traen una, conservá lo que dice y sumá lo nuevo.
- campos_faltantes: lista de campos que NO pudiste completar con evidencia.
- No inventes. Si dudás, dejá null y agregalo a campos_faltantes.
- Escribí todo en español rioplatense.

Si la fuente es la transcripción de una entrevista (líneas "Luxis:" y "Empresa:"):
- Los datos los da la Empresa. Lo que dice Luxis cuenta solo si la Empresa lo confirma (Luxis: "¿Tenés RUPE activo?" Empresa: "Sí" → RUPE vigente). Los ejemplos que Luxis nombra al preguntar no son productos de la empresa.
- Si la Empresa corrige un dato, vale lo último que dijo.
- En las entrevistas por voz el reconocimiento de habla se equivoca: interpretá el término evidente ("rupe" o "ruppe" es RUPE, "be pe ese" es BPS, "metros" de arena son m3).
- experienciaLicitaciones: en una frase, lo que contó (ej. "Se presentó dos veces a la Intendencia de Canelones", "Nunca se presentó").
${REGLAS_RESPUESTAS}`;

/**
 * Arma un perfil de empresa desde textos de documentos, páginas web o transcripts.
 * `perfilActual` se pasa como contexto para no repetir preguntas ni pisar datos con menos evidencia.
 */
export async function extraerPerfil(
  fuentes: FuenteTexto[],
  perfilActual: PerfilEmpresa,
  fuenteProductos: ProductoEmpresa['fuente'] = 'documento',
): Promise<{ perfil: Partial<PerfilEmpresa>; faltantes: string[] }> {
  const { objeto, tokensEntrada, tokensSalida } = await generarObjeto({
    modelo: modeloFuerte,
    schema: perfilIA,
    system: PROMPT_EXTRAER,
    prompt: [
      `Datos que ya cargó el usuario (no los contradigas salvo evidencia clara):\n${JSON.stringify(resumenParaContexto(perfilActual))}`,
      `FUENTES:\n${unirFuentes(fuentes)}`,
    ].join('\n\n'),
    maxOutputTokens: MAX_TOKENS_PERFIL,
    // Hasta 16k tokens de salida: necesita más que el tiempo por defecto, dentro de los 300 s de la ruta.
    timeoutMs: 240_000,
  });
  console.info(`[perfil] ${objeto.productos.length} productos · tokens entrada=${tokensEntrada} salida=${tokensSalida}`);

  return { perfil: desdeIA(objeto, fuenteProductos), faltantes: objeto.camposFaltantes };
}

function unirFuentes(fuentes: FuenteTexto[]): string {
  const presupuesto = Math.floor(MAX_CARACTERES_FUENTES / Math.max(fuentes.length, 1));
  return fuentes
    .map(({ fuente, texto }) => {
      const recortado = texto.length > presupuesto ? `${texto.slice(0, presupuesto)}\n[… texto recortado …]` : texto;
      return `=== FUENTE: ${fuente} ===\n${recortado}`;
    })
    .join('\n\n');
}

function resumenParaContexto(perfil: PerfilEmpresa) {
  return {
    nombre: perfil.nombre,
    rut: perfil.rut,
    departamento: perfil.departamento,
    web: perfil.web,
    descripcion: perfil.descripcion,
    productosYaCargados: perfil.productos.map((p) => `${p.nombre} (${p.unidad})`),
    zonasEntrega: perfil.zonasEntrega,
    capacidad: perfil.capacidadNotas,
    documentacion: perfil.documentacion.map((d) => `${d.tipo}: ${d.estado}`),
  };
}

function nulo<T>(valor: T | null): T | undefined {
  return valor ?? undefined;
}

function desdeIA(ia: Partial<PerfilIA>, fuente: ProductoEmpresa['fuente']): Partial<PerfilEmpresa> {
  const rut = ia.rut?.replace(/\D/g, '');
  return {
    nombre: nulo(ia.nombre ?? null),
    razonSocial: nulo(ia.razonSocial ?? null),
    rut: rut && rut.length === 12 ? rut : undefined,
    departamento: nulo(ia.departamento ?? null),
    localidad: nulo(ia.localidad ?? null),
    web: nulo(ia.web ?? null),
    telefono: nulo(ia.telefono ?? null),
    emailContacto: nulo(ia.emailContacto ?? null),
    descripcion: ia.descripcion ?? undefined,
    productos: ia.productos?.map((p) => ({
      nombre: p.nombre.trim(),
      categoria: p.categoria,
      unidad: p.unidad,
      precioReferencia: p.precioReferencia,
      moneda: p.moneda,
      keywords: p.keywords.slice(0, 8),
      fuente,
    })),
    zonasEntrega: ia.zonasEntrega ? normalizarZonas(ia.zonasEntrega) : undefined,
    capacidadNotas: nulo(ia.capacidadNotas ?? null),
    montoMinimo: ia.montoMinimo ?? undefined,
    documentacion: ia.documentacion?.map(
      (d): DocumentoEmpresa => ({
        tipo: d.tipo,
        nombre: d.nombre,
        estado: d.estado,
        vencimiento: d.vencimiento && /^\d{4}-\d{2}-\d{2}$/.test(d.vencimiento) ? d.vencimiento : null,
        notas: nulo(d.notas),
      }),
    ),
    experienciaLicitaciones: nulo(ia.experienciaLicitaciones ?? null),
    organismosInteres: ia.organismosInteres,
  };
}

// ---------------------------------------------------------------------------------------------
// Entrevista (por chat y por voz)

/** Datos nuevos que junta la entrevista. Todo opcional: solo se manda lo que se aprendió. */
const datosEntrevista = perfilIA.omit({ camposFaltantes: true }).partial();

// Con una lista de precios grande, nombrar cada producto no ayuda a preguntar y alarga cada turno.
const MAX_PRODUCTOS_EN_PROMPT = 40;

export type CanalEntrevista = { canal: 'chat'; preguntasHechas: number } | { canal: 'voz'; minutos: number };

/** Saludo con el que arranca la llamada; el prompt de voz cuenta con que ya se dijo. */
export function primerMensajeVoz(perfil: PerfilEmpresa): string {
  return `Hola, soy Luxis. Te hago unas preguntas cortas para completar el perfil de ${perfil.nombre} y buscarte licitaciones del Estado. Si algo no lo sabés, decime y seguimos. ¿Arrancamos?`;
}

/** Instrucciones de la entrevista: las mismas reglas para el chat y para el agente de voz, con el formato de cada canal. */
export function promptEntrevista(perfil: PerfilEmpresa, canal: CanalEntrevista): string {
  const productos = perfil.productos.map((p) => `${p.nombre} (${p.unidad})`);
  const conocido = {
    nombre: perfil.nombre,
    departamento: perfil.departamento,
    localidad: perfil.localidad,
    descripcion: perfil.descripcion,
    productos:
      productos.length > MAX_PRODUCTOS_EN_PROMPT
        ? [...productos.slice(0, MAX_PRODUCTOS_EN_PROMPT), `y ${productos.length - MAX_PRODUCTOS_EN_PROMPT} productos más`]
        : productos,
    zonasEntrega: perfil.zonasEntrega,
    capacidad: perfil.capacidadNotas,
    documentacion: perfil.documentacion.map((d) => `${d.tipo}: ${d.estado}`),
    experienciaLicitaciones: perfil.experienciaLicitaciones,
    organismosInteres: perfil.organismosInteres,
    montoMinimo: perfil.montoMinimo,
  };

  return `Sos Luxis, el asistente de una plataforma que busca licitaciones del Estado uruguayo (ARCE) para barracas de materiales de construcción. Estás entrevistando al dueño o encargado de ${perfil.nombre} para completar su perfil: con él, la IA compara cada licitación con lo que vende la empresa, dónde entrega, cuánto puede entregar y qué papeles tiene. Hablás en español rioplatense, con tono cercano y sin tecnicismos.

Lo que ya sabés (JSON): ${JSON.stringify(conocido)}
Lo que falta: ${perfil.camposFaltantes.length ? perfil.camposFaltantes.join('; ') : 'nada importante'}

Qué preguntar: SOLO lo que falta, en este orden.
1. Productos: qué vende y en qué unidad (bolsa, m3, unidad, kg).
2. Departamentos donde entrega.
3. Capacidad, en una pregunta: cuánto puede entregar por semana (metros cúbicos, camiones o bolsas) y si entrega a granel, en bolsa o paletizado.
4. Papeles, todo en UNA pregunta: RUPE activo, certificados DGI y BPS al día, seguro del BSE y si tiene alguna certificación UNIT o ISO.
5. Experiencia, todo en UNA pregunta: si ya se presentó a licitaciones, qué organismos le interesan (intendencias, ministerios, entes como OSE o UTE) y desde qué monto le sirve una venta.
Lo esencial son los puntos 1 a 4: con eso ya se pueden buscar licitaciones. El 5 suma, pero no es imprescindible.

Cuándo repreguntar:
- Si la respuesta es vaga ("de todo un poco", "por la zona", "bastante", "algunos papeles"), repreguntá UNA vez con opciones concretas. Ejemplos: "¿Más que nada cemento, arena, bloques, hierro…?", "¿Solo en ${perfil.departamento ?? 'tu departamento'} o también en otros departamentos?", "¿Más o menos cuántos metros cúbicos o camiones por semana?", "¿Cuáles tenés al día: RUPE, DGI, BPS, BSE?".
- Si sigue vaga, tomala como está y seguí. Nunca preguntes dos veces lo mismo.
- Si en una respuesta te da varios datos, tomalos todos y no preguntes lo que ya contestó.
- Si no sabe o no quiere responder, seguí con lo próximo sin insistir.
- Si corrige algo que ya sabías, vale lo nuevo.

Cómo entender las respuestas:
${REGLAS_RESPUESTAS}

Si te pregunta qué es algo, explicalo en una frase y volvé a preguntar por eso mismo (ej. "¿Y el seguro del BSE lo tenés?") antes de seguir:
- RUPE: el registro de proveedores del Estado. Para ganar una licitación hay que estar inscripto y activo.
- Certificados DGI y BPS: constancias de que la empresa está al día con impuestos y aportes. Se piden en casi todas las licitaciones.
- Seguro del BSE: el de accidentes de trabajo, obligatorio si tiene personal.
- UNIT e ISO: certificaciones de calidad. Pocas licitaciones las piden.

No pidas datos que no están en la lista (RUT, teléfono, dirección, horarios, formas de pago): se cargan en otro paso. No inventes datos ni prometas licitaciones concretas. Si te preguntan algo fuera de tema, respondé en una frase y volvé a la entrevista.

${canal.canal === 'chat' ? reglasChat(canal.preguntasHechas) : reglasVoz(canal.minutos)}`;
}

function reglasChat(preguntasHechas: number) {
  const restantes = Math.max(MAX_PREGUNTAS_ENTREVISTA - preguntasHechas, 0);
  return `Cómo es el chat:
- Una pregunta por mensaje, frases cortas, sin listas.
- En tu primer mensaje presentate en una frase y hacé la primera pregunta.
- Antes de cada pregunta, confirmá en pocas palabras lo que te dijo.
- Llevás ${preguntasHechas} de ${MAX_PREGUNTAS_ENTREVISTA} preguntas (las repreguntas cuentan); te quedan ${restantes}. Si te queda una sola y todavía falta algo de los puntos 1 a 4, usala para eso antes que para el 5.
- Cada mensaje tuyo termina en UNA de dos cosas: una pregunta, o la llamada a guardar_perfil. Nunca cierres un turno solo confirmando datos: si con la última respuesta ya no queda nada por preguntar, llamá a guardar_perfil en ese mismo turno.
- Cerrá cuando ya preguntaste todo lo que faltaba, cuando no te quedan preguntas, cuando la persona dice "listo", "terminamos" o similar, o si contesta "no sé" a casi todo.
- Para cerrar, llamá a guardar_perfil con TODOS los datos nuevos de esta conversación (no repitas lo que ya sabías, salvo que lo haya corregido; la descripción mandala solo si estaba vacía). Productos: uno por línea comercial, con unidad normalizada (${UNIDADES.join(', ')}); precio solo si lo dijo, si no, null. Después despedite en una frase: "Listo, con esto ya puedo buscarte licitaciones."${
    restantes === 0
      ? '\n- YA NO TE QUEDAN PREGUNTAS: no preguntes nada más. Llamá ahora a guardar_perfil con lo que sabés y despedite.'
      : ''
  }`;
}

function reglasVoz(minutos: number) {
  return `Cómo es la llamada:
- Es una llamada de voz de ${minutos} minutos como máximo. Ya saludaste y preguntaste "¿Arrancamos?": cuando conteste, andá directo a la primera pregunta, sin volver a presentarte.
- Hablá como por teléfono: frases cortas, una pregunta por vez, sin listas, símbolos ni abreviaturas (decí "metros cúbicos", no "m3").
- Confirmá en pocas palabras ("Perfecto, arena y pedregullo por metro cúbico.") y seguí; no repitas todo lo anterior.
- Si no entendiste lo que dijo (ruido, se cortó), pedile que lo repita una sola vez.
- Cerrá cuando ya preguntaste todo lo que faltaba, cuando la persona dice "listo", "terminamos" o similar, si contesta "no sé" a casi todo, o cuando te avisen que se termina el tiempo. Si queda poco tiempo y falta algo de los puntos 1 a 4, priorizalo sobre el 5.
- Para cerrar, decí "Listo, con esto ya puedo buscarte licitaciones. Ahora revisás todo por escrito." y cortá la llamada con la herramienta end_call.`;
}

/**
 * Herramientas de la entrevista. `alGuardar` fusiona los datos nuevos con el perfil y lo persiste;
 * devuelve el perfil resultante para que la UI pase al resumen.
 */
export function herramientasEntrevista(alGuardar: (datos: Partial<PerfilEmpresa>) => Promise<PerfilEmpresa>) {
  return {
    guardar_perfil: tool({
      description:
        'Guarda en el perfil de la empresa los datos nuevos obtenidos en la entrevista. Llamala una sola vez, al final de la entrevista.',
      inputSchema: datosEntrevista,
      execute: async (datos) => {
        const extraido = desdeIA(datos, 'entrevista');
        const perfil = await alGuardar(extraido);
        return { listo: true as const, perfil, extraido };
      },
    }),
  };
}
