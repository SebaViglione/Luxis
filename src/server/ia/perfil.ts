// IA del perfil de empresa: extracción desde documentos/web/transcript y entrevista por chat y por voz.
import { tool } from 'ai';
import { z } from 'zod';
import { generarObjeto } from '@/lib/ia/estructurado';
import { modeloFuerte } from '@/lib/ia/modelos';
import type { DocumentoEmpresa, PerfilEmpresa, ProductoEmpresa } from '@/lib/types';
import { DEPARTAMENTOS_UY, MAX_PREGUNTAS_ENTREVISTA, TEMAS_ENTREVISTA, UNIDADES, type TemaEntrevista } from '@/server/onboarding/constantes';
import { agendaEntrevista, fusionarExtraidos, HERRAMIENTA_ANOTAR, resumenConocido, temasDeDatos } from '@/server/onboarding/entrevista';
import { normalizarZonas } from '@/server/onboarding/perfil';
import type { EstadoEntrevista, ResultadoAnotar } from '@/server/onboarding/tipos';

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

/** Datos que junta la entrevista: solo los temas que pregunta (la identidad se carga en otro paso). */
const datosEntrevista = perfilIA
  .omit({ descripcion: true })
  .pick({
    productos: true,
    zonasEntrega: true,
    capacidadNotas: true,
    montoMinimo: true,
    documentacion: true,
    experienciaLicitaciones: true,
    organismosInteres: true,
  })
  .partial()
  .extend({
    descripcion: z
      .string()
      .optional()
      .describe('Solo si el perfil todavía no tiene descripción: 2 o 3 frases con qué vende, dónde y a quién. Si ya tiene, no la mandes.'),
  });

/** Lo que el modelo anota después de cada respuesta. */
const anotacion = datosEntrevista.extend({
  sinDato: z
    .array(z.enum(TEMAS_ENTREVISTA))
    .optional()
    .describe('Temas que preguntaste y la persona no supo o no quiso responder (no se vuelven a preguntar)'),
  cerrar: z.boolean().optional().describe('true si la persona pidió terminar la entrevista'),
});

export type CanalEntrevista =
  | { canal: 'chat'; preguntasHechas: number; tratados: TemaEntrevista[] }
  | { canal: 'voz'; minutos: number };

/** Saludo con el que arranca la llamada; el prompt de voz cuenta con que ya se dijo. */
export function primerMensajeVoz(perfil: PerfilEmpresa): string {
  if (agendaEntrevista(perfil).length === 0) {
    return `Hola, soy Luxis. Ya tengo todo lo que necesito del perfil de ${perfil.nombre}. Si querés corregir o agregar algo, decímelo ahora; si no, decime "listo" y seguimos por escrito.`;
  }
  const yaCargado = perfil.productos.length > 0 ? ' Ya tengo tus productos cargados, así que te pregunto solo lo que falta.' : '';
  return `Hola, soy Luxis. Te hago unas preguntas cortas para completar el perfil de ${perfil.nombre} y buscarte licitaciones del Estado.${yaCargado} Si algo no lo sabés, decime y seguimos. ¿Arrancamos?`;
}

/** Instrucciones de la entrevista: las mismas reglas para el chat y para el agente de voz, con el formato de cada canal. */
export function promptEntrevista(perfil: PerfilEmpresa, canal: CanalEntrevista): string {
  const agenda = agendaEntrevista(perfil, canal.canal === 'chat' ? canal.tratados : []);
  const conocido = resumenConocido(perfil);
  const faltaEsencial = agenda.some((p) => p.esencial);

  return `Sos Luxis, el asistente de una plataforma que busca licitaciones del Estado uruguayo (ARCE) para barracas de materiales de construcción. Estás entrevistando al dueño o encargado de ${perfil.nombre} para completar su perfil: con él, la IA compara cada licitación con lo que vende la empresa, dónde entrega, cuánto puede entregar y qué papeles tiene. Hablás en español rioplatense, con tono cercano y sin tecnicismos.

LO QUE YA SABÉS (salió de sus documentos, su web o de lo que ya contestó). NO lo preguntes ni pidas que lo confirme; usalo solo para que tus preguntas suenen concretas:
${conocido.length ? conocido.map((c) => `- ${c}`).join('\n') : '- Nada todavía: la empresa no cargó documentos.'}

LO QUE FALTA, en este orden. Preguntá SOLO esto, una cosa por vez:
${
  agenda.length
    ? agenda.map((p, i) => `${i + 1}. ${p.pregunta}${p.esencial ? '' : ' (opcional: si quedan pocas preguntas o poco tiempo, se saltea)'}`).join('\n')
    : '(nada: la entrevista ya está completa. Si la persona quiere corregir o agregar algo, tomalo; si no, cerrá.)'
}
${faltaEsencial ? 'Con productos, zonas, capacidad y papeles ya se pueden buscar licitaciones; la experiencia suma pero no es imprescindible.' : 'Lo esencial ya está: lo que queda suma pero no es imprescindible.'}

Cuándo repreguntar:
- Si la respuesta es vaga ("de todo un poco", "por la zona", "bastante", "algunos papeles"), repreguntá UNA vez con opciones concretas. Ejemplos: "¿Más que nada cemento, arena, bloques, hierro…?", "¿Solo en ${perfil.departamento ?? 'tu departamento'} o también en otros departamentos?", "¿Más o menos cuántos metros cúbicos o camiones por semana?", "¿Cuáles tenés al día: RUPE, DGI, BPS, BSE?".
- Si sigue vaga, tomala como está y seguí. Nunca preguntes dos veces lo mismo.
- Una respuesta parcial a una pregunta con varias partes NO es vaga. Si de los papeles nombró solo algunos, repreguntá UNA vez solo por los esenciales que no nombró (RUPE, DGI, BPS, BSE); por UNIT e ISO nunca repreguntes: si no los nombra o nombra uno solo, anotá lo que dijo y seguí.
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

${canal.canal === 'chat' ? reglasChat(canal.preguntasHechas, agenda.length, perfil.productos.length > 0) : reglasVoz(canal.minutos)}`;
}

function reglasChat(preguntasHechas: number, pendientes: number, hayProductos: boolean) {
  const restantes = Math.max(MAX_PREGUNTAS_ENTREVISTA - preguntasHechas, 0);
  const primerMensaje =
    pendientes === 0
      ? `- Es tu primer mensaje y no falta nada: llamá a ${HERRAMIENTA_ANOTAR} con cerrar: true y despedite.`
      : `- En tu primer mensaje presentate en una frase${hayProductos ? ', decile que ya tenés sus productos de los documentos' : ''} y hacé la pregunta 1 de la lista. Sin herramientas en ese mensaje.`;
  return `Cómo es el chat:
- Una pregunta por mensaje, frases cortas, sin listas.${preguntasHechas === 0 ? `\n${primerMensaje}` : ''}
- Cada vez que la persona contesta, PRIMERO llamá a ${HERRAMIENTA_ANOTAR} con lo que dijo: productos uno por línea comercial con unidad normalizada (${UNIDADES.join(', ')}) y precio solo si lo dijo (si no, null); zonas como departamentos; papeles con su estado. Si contestó "no sé" o no quiere responder, llamala con ese tema en sinDato. Si pide terminar ("listo", "con eso alcanza", "terminemos"), llamala con cerrar: true y lo que haya dicho.
- La herramienta te devuelve qué falta y cuál es la siguiente pregunta: confirmá en pocas palabras lo que te dijo y hacé ESA pregunta en el mismo mensaje. Nunca cierres un turno solo confirmando datos. No digas "anotado" ni "guardado" ni menciones la herramienta: la persona solo ve tu confirmación y la pregunta.
- Si la respuesta fue vaga, repreguntá una vez SIN anotar; si sigue vaga, anotá lo que haya.
- Si te pregunta algo o se va de tema, respondé y volvé a la pregunta pendiente, sin anotar nada.
- Llevás ${preguntasHechas} de ${MAX_PREGUNTAS_ENTREVISTA} preguntas (las repreguntas cuentan); te quedan ${restantes}. Si te queda una sola y falta algo esencial, usala para eso y no para lo opcional.
- Cuando la herramienta diga que la entrevista terminó, no preguntes nada más: despedite en una frase: "Listo, con esto ya puedo buscarte licitaciones."${
    restantes === 0 && preguntasHechas > 0
      ? `\n- YA NO TE QUEDAN PREGUNTAS: anotá lo que acaba de contestar con ${HERRAMIENTA_ANOTAR} y despedite.`
      : ''
  }`;
}

function reglasVoz(minutos: number) {
  return `Cómo es la llamada:
- Es una llamada de voz de ${minutos} minutos como máximo. Ya saludaste: cuando conteste, andá directo a la pregunta 1 de la lista, sin volver a presentarte. Si la lista está vacía, ya le dijiste que tenés todo: tomá lo que quiera corregir o agregar y, cuando diga "listo" o no tenga nada más, cerrá.
- Hablá como por teléfono: frases cortas, una pregunta por vez, sin listas, símbolos ni abreviaturas (decí "metros cúbicos", no "m3").
- Confirmá en pocas palabras ("Perfecto, arena y pedregullo por metro cúbico.") y seguí con la siguiente de la lista; no repitas todo lo anterior.
- Si no entendiste lo que dijo (ruido, se cortó), pedile que lo repita una sola vez.
- Llevá la cuenta de la lista: un tema queda resuelto cuando la persona lo contesta o dice que no sabe. No vuelvas sobre un tema resuelto.
- Si queda poco tiempo y falta un tema esencial, priorizalo sobre los opcionales.
- Cerrá cuando todos los temas de la lista estén resueltos, cuando la persona diga "listo", "terminamos" o similar, si contesta "no sé" a casi todo, o cuando te avisen que se termina el tiempo.
- Antes de cerrar, repasá la lista en silencio: si quedó un tema sin preguntar y hay tiempo, preguntalo ahora. No le leas la lista a la persona ni le pidas que repase.
- Para cerrar, decí "Listo, con esto ya puedo buscarte licitaciones. Ahora revisás todo por escrito." y cortá la llamada con la herramienta end_call. La llamada la terminás vos: no esperes a que la persona cuelgue.`;
}

export interface ContextoEntrevista {
  /** Lo que dejó la última anotación (viene en el historial del chat). */
  estado: EstadoEntrevista;
  /** Mensajes del asistente hasta ahora: al llegar al máximo, la próxima anotación cierra. */
  preguntasHechas: number;
  /** Fusiona los datos nuevos con el perfil y lo persiste; devuelve el perfil resultante. */
  alGuardar: (datos: Partial<PerfilEmpresa>) => Promise<PerfilEmpresa>;
}

/**
 * Herramienta de la entrevista por chat: anota cada respuesta en el perfil y decide, con la agenda,
 * qué falta o si la entrevista terminó. El modelo recibe un texto corto; la UI, el estado completo.
 */
export function herramientasEntrevista({ estado, preguntasHechas, alGuardar }: ContextoEntrevista) {
  return {
    [HERRAMIENTA_ANOTAR]: tool({
      description:
        'Anota en el perfil de la empresa lo que la persona acaba de responder y devuelve qué falta preguntar. Llamala cada vez que dé un dato nuevo, cuando diga que no sabe algo (sinDato) o cuando pida terminar (cerrar). Mandá solo los campos con datos nuevos de esta respuesta: no repitas lo que ya sabías ni mandes listas vacías.',
      inputSchema: anotacion,
      execute: async ({ sinDato = [], cerrar = false, ...datos }): Promise<ResultadoAnotar> => {
        const extraido = desdeIA(datos, 'entrevista');
        const perfil = await alGuardar(extraido);
        const tratados = [...new Set([...estado.tratados, ...temasDeDatos(extraido), ...sinDato])];
        const pendientes = agendaEntrevista(perfil, tratados);
        const terminada = cerrar || pendientes.length === 0 || preguntasHechas >= MAX_PREGUNTAS_ENTREVISTA;
        return {
          terminada,
          tratados,
          extraido: fusionarExtraidos(estado.extraido, extraido),
          pendientes: pendientes.map((p) => p.tema),
          siguiente: terminada ? undefined : pendientes[0].pregunta,
          perfil: terminada ? perfil : undefined,
        };
      },
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: output.terminada
          ? 'Perfil actualizado. La entrevista terminó: no preguntes nada más, despedite con la frase de cierre.'
          : `Perfil actualizado. Todavía falta: ${output.pendientes.join(', ')}. Siguiente pregunta: ${output.siguiente}`,
      }),
    }),
  };
}
