// IA del perfil de empresa: extracción desde documentos/web/transcript y entrevista por chat.
import { generateText, Output, tool } from 'ai';
import { z } from 'zod';
import { modeloFuerte } from '@/lib/ia/modelos';
import type { DocumentoEmpresa, PerfilEmpresa, ProductoEmpresa } from '@/lib/types';
import { DEPARTAMENTOS_UY, MAX_PREGUNTAS_ENTREVISTA, UNIDADES } from '@/server/onboarding/constantes';
import { normalizarZonas } from '@/server/onboarding/perfil';

const MAX_CARACTERES_FUENTES = 150_000;

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

const PROMPT_EXTRAER = `Sos un analista que arma el perfil comercial de una barraca de materiales de construcción de Uruguay a partir de documentos y/o su web.
Devolvé SOLO el objeto JSON del schema. Reglas:
- productos: uno por línea comercial real (ej. "Cemento Portland bolsa 25 kg", "Ladrillo de campo", "Arena terciada m3"). Normalizá unidad (bolsa, unidad, m3, kg, tonelada, m2, metro, rollo, litro). Si hay precio, copialo con su moneda; si no, null.
- Si una planilla trae muchas variantes (medidas, marcas), mantené cada variante que tenga precio propio como producto separado.
- documentacion: marcá vigente solo si el texto lo afirma; si no se menciona, estado "desconocido". "Al día" o "activo" cuenta como vigente; "en trámite" como en_tramite; "no tenemos" como no_tiene.
- zonas_entrega: departamentos de Uruguay mencionados.
- campos_faltantes: lista de campos que NO pudiste completar con evidencia.
- No inventes. Si dudás, dejá null y agregalo a campos_faltantes.
- Escribí todo en español rioplatense.`;

/**
 * Arma un perfil de empresa desde textos de documentos, páginas web o transcripts.
 * `perfilActual` se pasa como contexto para no repetir preguntas ni pisar datos con menos evidencia.
 */
export async function extraerPerfil(
  fuentes: FuenteTexto[],
  perfilActual: PerfilEmpresa,
  fuenteProductos: ProductoEmpresa['fuente'] = 'documento',
): Promise<{ perfil: Partial<PerfilEmpresa>; faltantes: string[] }> {
  const { output } = await generateText({
    model: modeloFuerte,
    temperature: 0,
    instructions: PROMPT_EXTRAER,
    prompt: [
      `Datos que ya cargó el usuario (no los contradigas salvo evidencia clara):\n${JSON.stringify(resumenParaContexto(perfilActual))}`,
      `FUENTES:\n${unirFuentes(fuentes)}`,
    ].join('\n\n'),
    output: Output.object({ schema: perfilIA }),
  });

  return { perfil: desdeIA(output, fuenteProductos), faltantes: output.camposFaltantes };
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
    productosYaCargados: perfil.productos.map((p) => `${p.nombre} (${p.unidad})`),
    zonasEntrega: perfil.zonasEntrega,
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
// Entrevista por chat

/** Datos nuevos que junta la entrevista. Todo opcional: solo se manda lo que se aprendió. */
const datosEntrevista = perfilIA.omit({ camposFaltantes: true }).partial();

export function promptEntrevista(perfil: PerfilEmpresa, preguntasHechas: number): string {
  const conocido = {
    nombre: perfil.nombre,
    departamento: perfil.departamento,
    descripcion: perfil.descripcion,
    productos: perfil.productos.map((p) => `${p.nombre} (${p.unidad})`),
    zonasEntrega: perfil.zonasEntrega,
    capacidad: perfil.capacidadNotas,
    documentacion: perfil.documentacion.map((d) => `${d.tipo}: ${d.estado}`),
    experienciaLicitaciones: perfil.experienciaLicitaciones,
    organismosInteres: perfil.organismosInteres,
    montoMinimo: perfil.montoMinimo,
  };
  const restantes = Math.max(MAX_PREGUNTAS_ENTREVISTA - preguntasHechas, 0);

  return `Sos Luxis, asistente que entrevista en español rioplatense al dueño o encargado de una barraca de materiales de construcción en Uruguay para armar su perfil y buscarle licitaciones del Estado. Tono cercano y breve: una pregunta por turno, frases cortas, sin tecnicismos.

Ya sabés (JSON): ${JSON.stringify(conocido)}
Falta: ${perfil.camposFaltantes.length ? perfil.camposFaltantes.join('; ') : 'nada importante'}

Reglas:
- Preguntá SOLO lo que falta, en este orden de prioridad: productos que vende y en qué unidad (bolsa, m3, unidad, kg), si entrega a granel, por bolsa o paletizado, departamentos donde entrega, capacidad de entrega semanal aproximada, si tiene RUPE activo, certificados DGI y BPS al día, seguro BSE, certificaciones UNIT o ISO, si ya se presentó a licitaciones, tipos de organismos que le interesan y monto mínimo que le vale la pena.
- Podés juntar en una misma pregunta datos de sí/no muy relacionados (ej. "¿Tenés DGI y BPS al día?").
- Antes de la siguiente pregunta, confirmá en una frase corta lo que te dijo.
- Si la persona no sabe o no quiere responder, seguí con lo próximo sin insistir.
- Llevás ${preguntasHechas} de ${MAX_PREGUNTAS_ENTREVISTA} preguntas; te quedan ${restantes}.
- Cuando tengas lo esencial, cuando no te queden preguntas, o si la persona dice "listo", "terminamos" o similar: llamá a la herramienta guardar_perfil con TODOS los datos nuevos que aprendiste en esta conversación (no repitas lo que ya sabías, salvo que lo haya corregido). Después despedite con una frase: "Listo, con esto ya puedo buscarte licitaciones."
- Productos: uno por línea comercial, con unidad normalizada (${UNIDADES.join(', ')}). Precio solo si lo dijo; si no, null.
- Documentación: vigente solo si lo afirma; "lo estoy tramitando" es en_tramite; "no tengo" es no_tiene; "no sé" es desconocido.
- No inventes datos. Si te preguntan algo fuera de tema, respondé en una frase y volvé a la entrevista.`;
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
        const perfil = await alGuardar(desdeIA(datos, 'entrevista'));
        return { listo: true as const, perfil };
      },
    }),
  };
}
