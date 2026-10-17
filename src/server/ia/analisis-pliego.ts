import { z } from 'zod';
import { and, eq, isNotNull } from 'drizzle-orm';
import { db, schema } from '@/db';
import { modeloRapido, modeloFuerte, nombreModeloRapido, nombreModeloFuerte } from '@/lib/ia/modelos';
import { generarObjeto } from '@/lib/ia/estructurado';
import { TIPOS_COMPRA, type AnalisisPliego, type CategoriaArchivo } from '@/lib/types';
import { PRIORIDAD } from '@/server/arce/clasificar';

const MAX_CHARS = 350_000;
const TIPOS_DOC = ['RUPE', 'DGI', 'BPS', 'BSE', 'UNIT', 'ISO', 'OTRO'] as const;

const SchemaAnalisis = z.object({
  resumen: z.string().describe('3-4 frases para el dueño de una barraca: qué compran, cuánto, dónde se entrega, cuándo cierra'),
  quePiden: z.string().describe('lista breve de productos/cantidades que piden'),
  requisitosDocumentales: z.array(z.object({
    documento: z.string(), tipo: z.enum(TIPOS_DOC), obligatorio: z.boolean(),
    seccion: z.string().nullable().describe('ej. "Art. 7", "Anexo II"; null si no se identifica'), detalle: z.string(),
  })),
  fechasClave: z.array(z.object({
    tipo: z.enum(['visita', 'consultas', 'prorroga', 'apertura', 'entrega', 'muestras', 'otro']),
    fecha: z.string().nullable().describe('ISO 8601 con hora si existe (zona America/Montevideo, -03:00); null si no hay fecha concreta'),
    descripcion: z.string(), obligatoria: z.boolean(), fuente: z.string().nullable().describe('archivo y sección de donde sale'),
  })),
  condiciones: z.object({
    plazoEntrega: z.string().nullable(), lugarEntrega: z.string().nullable(), formaPago: z.string().nullable(),
    mantenimientoOferta: z.string().nullable(), garantia: z.string().nullable(), muestras: z.string().nullable(),
    cotizarConIva: z.boolean().nullable(), moneda: z.string().nullable(),
  }),
  riesgos: z.array(z.string()).describe('cláusulas que complican a una barraca chica: multas, entregas parciales, marca específica, etc.'),
  confianza: z.number().int().min(0).max(100).describe('cuánto del pliego pudiste leer y entender'),
});

const SYSTEM = `Leés pliegos de licitaciones del Estado uruguayo para el dueño de una barraca de materiales de construcción.
Devolvés solo el objeto del schema, en español rioplatense, claro y concreto.
- requisitosDocumentales: cada documento, certificado, formulario, garantía o inscripción exigida (RUPE, certificados DGI/BPS, BSE, UNIT, ISO, formularios, declaraciones juradas, garantías, muestras, fichas técnicas). Indicá si es obligatorio y la sección del pliego.
- fechasClave: visita (y si es obligatoria), plazo de consultas, prórroga, apertura, entrega, muestras. "apertura" = recepción/entrega de OFERTAS y acto de apertura; "entrega" = entrega de la MERCADERÍA (plazo o fecha de suministro). No dupliques la apertura como entrega. Nunca inventes fechas: si no hay fecha concreta, fecha = null.
- condiciones: lo que diga el pliego; null si no lo dice.
- Si solo tenés la metadata (sin texto del pliego), decilo en el resumen y bajá la confianza a 50 o menos.
- No inventes nada que no esté en el texto.`;

async function armarContexto(idCompra: string) {
  const [l] = await db.select().from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, idCompra));
  if (!l) throw new Error(`Licitación ${idCompra} no encontrada`);
  const items = await db.select().from(schema.licitacionItems).where(eq(schema.licitacionItems.idCompra, idCompra)).orderBy(schema.licitacionItems.nroItem);
  const archivos = (await db.select({ nombre: schema.licitacionArchivos.nombre, categoria: schema.licitacionArchivos.categoria, texto: schema.licitacionArchivos.texto })
    .from(schema.licitacionArchivos)
    .where(and(eq(schema.licitacionArchivos.idCompra, idCompra), eq(schema.licitacionArchivos.relevante, true), isNotNull(schema.licitacionArchivos.texto))))
    .sort((a, b) => PRIORIDAD[a.categoria as CategoriaArchivo] - PRIORIDAD[b.categoria as CategoriaArchivo]);
  const f = (d: Date | null) => d?.toLocaleString('es-UY', { timeZone: 'America/Montevideo' }) ?? 'no indicada';
  const meta = `LICITACIÓN ${TIPOS_COMPRA[l.tipoCompra] ?? l.tipoCompra} ${l.numCompra}/${l.anioCompra} — ${l.organismo ?? ''} ${l.unidadEjecutora ? `(${l.unidadEjecutora})` : ''}
Objeto: ${l.objeto ?? ''}
Recepción de ofertas hasta: ${f(l.fechaTopeOfertas)} · Apertura: ${f(l.fechaApertura)} · Consultas hasta: ${f(l.fechaSolAclar)} · Prórroga hasta: ${f(l.fechaSolProrr)}
Lugar de entrega de ofertas: ${l.lugarEntrega ?? 'no indicado'} · Contacto: ${l.emailContacto ?? 'no indicado'}
Ítems:
${items.map((i) => `  ${i.nroItem}. ${i.descArticulo} — ${i.cantPedida ?? '?'} ${i.unidad ?? ''}${i.atributos ? ` · ${(i.atributos as { propiedad?: string; valor?: unknown }[]).map((a) => `${a.propiedad}: ${a.valor}`).join(', ')}` : ''}`).join('\n') || '  (sin ítems)'}`;
  let restante = MAX_CHARS - meta.length;
  const bloques: string[] = []; let leidos = 0;
  for (const a of archivos) {
    if (restante <= 2000) break;
    const t = a.texto!.slice(0, restante);
    bloques.push(`=== ARCHIVO: ${a.nombre} (${a.categoria}) ===\n${t}`);
    restante -= t.length; leidos += t.length;
  }
  return { meta, bloques, leidos, hayTexto: bloques.length > 0 };
}

/** Analiza el pliego de una licitación y guarda el resultado. Idempotente salvo `forzar`. */
export async function analizarLicitacion(idCompra: string, opts: { forzar?: boolean; modelo?: 'rapido' | 'fuerte' } = {}): Promise<AnalisisPliego> {
  if (!opts.forzar) {
    const [prev] = await db.select().from(schema.analisisLicitacion).where(eq(schema.analisisLicitacion.idCompra, idCompra));
    if (prev) return {
      resumen: prev.resumen ?? '', quePiden: prev.quePiden ?? '', requisitosDocumentales: prev.requisitosDocumentales ?? [], fechasClave: prev.fechasClave ?? [],
      condiciones: prev.condiciones ?? {}, riesgos: prev.riesgos ?? [], confianza: prev.confianza ?? 0, basadoEn: prev.basadoEn as 'pliego' | 'metadata',
    };
  }
  const ctx = await armarContexto(idCompra);
  const fuerte = opts.modelo === 'fuerte';
  const { objeto } = await generarObjeto({
    modelo: fuerte ? modeloFuerte : modeloRapido, schema: SchemaAnalisis, system: SYSTEM, maxOutputTokens: 6000,
    prompt: `${ctx.meta}\n\n${ctx.hayTexto ? ctx.bloques.join('\n\n') : 'No se pudo leer el texto del pliego: analizá solo con la metadata de arriba.'}`,
  });
  const basadoEn: 'pliego' | 'metadata' = ctx.hayTexto ? 'pliego' : 'metadata';
  const confianza = basadoEn === 'metadata' ? Math.min(objeto.confianza, 50) : objeto.confianza;
  const condiciones = Object.fromEntries(Object.entries(objeto.condiciones).filter(([, v]) => v !== null));
  const fila = {
    idCompra, resumen: objeto.resumen, quePiden: objeto.quePiden, requisitosDocumentales: objeto.requisitosDocumentales,
    fechasClave: objeto.fechasClave, condiciones, riesgos: objeto.riesgos, confianza, basadoEn,
    modelo: fuerte ? nombreModeloFuerte : nombreModeloRapido, caracteresLeidos: ctx.leidos, updatedAt: new Date(),
  };
  await db.insert(schema.analisisLicitacion).values(fila).onConflictDoUpdate({ target: schema.analisisLicitacion.idCompra, set: fila });
  return { ...objeto, condiciones, confianza, basadoEn };
}
