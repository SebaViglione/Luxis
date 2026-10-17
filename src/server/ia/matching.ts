import { z } from 'zod';
import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { modeloRapido, nombreModeloRapido } from '@/lib/ia/modelos';
import { generarObjeto, enParalelo } from '@/lib/ia/estructurado';
import { TIPOS_COMPRA } from '@/lib/types';
import { calcularPrecios } from './precio';
import { calcularGapParaMatch } from './gap-documental';

const SchemaMatch = z.object({
  confianza: z.number().int().min(0).max(100).describe('0-100 según la guía de calibración'),
  razon: z.string().describe('1-2 frases concretas en español rioplatense, mencionando ítems'),
  items: z.array(z.object({
    nroItem: z.number().int(),
    descripcion: z.string(),
    puedeOfertar: z.boolean(),
    productoEmpresa: z.string().nullable().describe('nombre del producto de la empresa que corresponde, o null'),
    nota: z.string().describe('muy breve, máximo 12 palabras'),
  })).describe('SOLO los ítems que la empresa puede ofertar (máximo 40); los que no aparecen se entienden como no ofertables'),
});

const SYSTEM = `Sos el analista de licitaciones de una barraca de materiales de construcción en Uruguay. Decidís si una licitación del Estado es una oportunidad REAL para esta empresa.
Contexto clave de las compras públicas uruguayas: casi siempre se puede ofertar y adjudicar POR ÍTEM. La empresa no necesita cubrir todos los ítems: alcanza con que pueda cotizar algunos que valgan la pena.
Reglas:
- Evaluá ítem por ítem si la empresa vende ese producto o uno equivalente (ej. "ARENA TERCIADA" ↔ "Arena terciada m3"; "CEMENTO PORTLAND" ↔ "Portland bolsa 25 kg"; "VARILLA DE HIERRO TORSIONADO" ↔ "Varilla torsionada 8 mm").
- La oportunidad se mide por los ítems que SÍ puede ofertar (cantidad e importancia), no por los que no puede.
- Zona: si la entrega es fuera de los departamentos donde reparte, bajá la confianza 10 a 20 puntos y mencioná el costo de flete; no la descartes por eso solo.
- Volumen muy superior a su capacidad: bajá 10 a 20 puntos y mencionalo (puede ofertar parcial o con entregas escalonadas si el pliego lo permite).
- Obras llave en mano, servicios de mano de obra, mantenimiento, maquinaria, medicamentos, mobiliario, electricidad o herramientas NO son oportunidad aunque mencionen materiales.
- Si no hay ítems publicados, decidí por el objeto y lo que diga el pliego; tope de confianza 70.
- Calibración: 85-100 la mayoría de los ítems (o los principales) son productos que vende y la zona es alcanzable; 65-84 puede ofertar ítems relevantes con algún reparo (zona, volumen, ítems ajenos); 40-64 solo pocos ítems menores o reparos fuertes; menos de 40 no es para esta empresa.
- En "items" devolvé SOLO los ítems que la empresa puede ofertar (máximo 40, los más importantes primero). No listes los que no puede.
- No inventes ítems ni productos. Usá solo los nroItem que aparecen.`;

export interface PerfilParaMatch {
  empresaId: string; nombre: string; departamento: string | null; zonas: string[]; capacidad: string | null;
  productos: string[]; documentos: string[]; perfilActualizadoEn: Date | null;
}

export async function cargarPerfil(empresaId: string): Promise<PerfilParaMatch | null> {
  const [[e], prods, docs] = await Promise.all([
    db.select().from(schema.empresas).where(eq(schema.empresas.id, empresaId)),
    db.select().from(schema.empresaProductos).where(eq(schema.empresaProductos.empresaId, empresaId)),
    db.select().from(schema.empresaDocumentos).where(eq(schema.empresaDocumentos.empresaId, empresaId)),
  ]);
  if (!e) return null;
  return {
    empresaId, nombre: e.nombre, departamento: e.departamento, zonas: e.zonasEntrega ?? [], capacidad: e.capacidadNotas,
    productos: prods.map((p) => `${p.nombre}${p.unidad ? ` (${p.unidad})` : ''}`),
    documentos: docs.map((d) => `${d.tipo} ${d.nombre}: ${d.estado}`),
    perfilActualizadoEn: e.perfilActualizadoEn,
  };
}

async function contextoLicitacion(idCompra: string) {
  const L = schema.licitaciones;
  const [[l], items, [a]] = await Promise.all([
    db.select({ tipoCompra: L.tipoCompra, numCompra: L.numCompra, anioCompra: L.anioCompra, organismo: L.organismo, unidadEjecutora: L.unidadEjecutora,
      objeto: L.objeto, lugarEntrega: L.lugarEntrega, fechaTopeOfertas: L.fechaTopeOfertas }).from(L).where(eq(L.idCompra, idCompra)),
    db.select().from(schema.licitacionItems).where(eq(schema.licitacionItems.idCompra, idCompra)).orderBy(schema.licitacionItems.nroItem),
    db.select({ quePiden: schema.analisisLicitacion.quePiden }).from(schema.analisisLicitacion).where(eq(schema.analisisLicitacion.idCompra, idCompra)),
  ]);
  if (!l) return null;
  const fecha = l.fechaTopeOfertas?.toLocaleString('es-UY', { timeZone: 'America/Montevideo' }) ?? 'sin fecha';
  const lineas = items.slice(0, 80).map((i) => `  ${i.nroItem}. ${i.descArticulo} — ${i.cantPedida ?? '?'} ${i.unidad ?? ''}`.trimEnd());
  if (items.length > 80) lineas.push(`  … y ${items.length - 80} ítems más`);
  return `${TIPOS_COMPRA[l.tipoCompra] ?? l.tipoCompra} ${l.numCompra ?? ''}/${l.anioCompra ?? ''} · ${l.organismo ?? ''}${l.unidadEjecutora ? ` — ${l.unidadEjecutora}` : ''}
Objeto: ${l.objeto ?? '(sin objeto)'}
Lugar de entrega: ${l.lugarEntrega ?? 'no indicado'}
Cierre de ofertas: ${fecha}
Ítems:
${lineas.join('\n') || '  (sin ítems publicados)'}
Qué piden según el pliego: ${a?.quePiden ?? 'sin pliego leído'}`;
}

function textoPerfil(p: PerfilParaMatch) {
  return `${p.nombre} (${p.departamento ?? 'departamento no indicado'})
Vende: ${p.productos.join('; ') || 'sin productos cargados'}
Entrega en: ${p.zonas.join(', ') || 'no indicado'}
Capacidad: ${p.capacidad ?? 'no indicada'}
Documentación: ${p.documentos.join('; ') || 'no indicada'}`;
}

/** Evalúa una licitación para una empresa y guarda el match. */
export async function evaluarLicitacion(perfil: PerfilParaMatch, idCompra: string, opts: { sinExtras?: boolean } = {}) {
  const ctx = await contextoLicitacion(idCompra);
  if (!ctx) return null;
  const { objeto } = await generarObjeto({
    modelo: modeloRapido, schema: SchemaMatch, system: SYSTEM,
    prompt: `EMPRESA:\n${textoPerfil(perfil)}\n\nLICITACIÓN:\n${ctx}`, maxOutputTokens: 3000,
  });
  const fila = {
    empresaId: perfil.empresaId, idCompra, relevante: objeto.confianza >= 40, confianza: objeto.confianza, razon: objeto.razon,
    itemsOfertables: objeto.items.filter((i) => i.puedeOfertar), perfilVersion: perfil.perfilActualizadoEn ?? new Date(), updatedAt: new Date(),
  };
  await db.insert(schema.matches).values(fila).onConflictDoUpdate({
    target: [schema.matches.empresaId, schema.matches.idCompra],
    set: { relevante: fila.relevante, confianza: fila.confianza, razon: fila.razon, itemsOfertables: fila.itemsOfertables, perfilVersion: fila.perfilVersion, updatedAt: fila.updatedAt },
  });
  if (fila.relevante && !opts.sinExtras) {
    await Promise.all([calcularPrecios(idCompra).catch(() => null), calcularGapParaMatch(perfil.empresaId, idCompra).catch(() => null)]);
  }
  return { ...objeto, modelo: nombreModeloRapido };
}

/** Recalcula matches de una empresa contra licitaciones abiertas del rubro. Solo nuevas o desactualizadas salvo `todas`. */
export async function evaluarEmpresa(empresaId: string, opts: { todas?: boolean; idCompras?: string[]; concurrencia?: number } = {}) {
  const perfil = await cargarPerfil(empresaId);
  if (!perfil) throw new Error('Empresa no encontrada');
  const abiertas = await db.select({ idCompra: schema.licitaciones.idCompra }).from(schema.licitaciones)
    .where(and(eq(schema.licitaciones.esRubro, true), gt(schema.licitaciones.fechaTopeOfertas, new Date()),
      opts.idCompras?.length ? inArray(schema.licitaciones.idCompra, opts.idCompras) : sql`true`));
  let candidatas = abiertas.map((a) => a.idCompra);
  if (!opts.todas && !opts.idCompras?.length) {
    const existentes = await db.select({ idCompra: schema.matches.idCompra, v: schema.matches.perfilVersion }).from(schema.matches).where(eq(schema.matches.empresaId, empresaId));
    const vigentes = new Set(existentes.filter((m) => perfil.perfilActualizadoEn === null || (m.v && m.v >= perfil.perfilActualizadoEn)).map((m) => m.idCompra));
    candidatas = candidatas.filter((id) => !vigentes.has(id));
  }
  let relevantes = 0; let errores = 0;
  await enParalelo(candidatas, opts.concurrencia ?? 8, async (id) => {
    try { const r = await evaluarLicitacion(perfil, id); if (r && r.confianza >= 40) relevantes++; }
    catch (e) { errores++; if ((e as Error).name === 'IANoConfigurada') throw e; }
  });
  return { evaluadas: candidatas.length, relevantes, errores };
}
