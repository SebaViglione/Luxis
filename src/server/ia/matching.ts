import { z } from 'zod';
import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { modeloRapido, nombreModeloRapido } from '@/lib/ia/modelos';
import { generarObjeto, enParalelo } from '@/lib/ia/estructurado';
import { TIPOS_COMPRA } from '@/lib/types';
import { calcularPrecios } from './precio';
import { calcularGapParaMatch } from './gap-documental';

const NIVELES = ['principales', 'relevantes', 'consigue', 'menores', 'ninguno'] as const;
type Nivel = (typeof NIVELES)[number];

// La IA clasifica y el código pone el número: con un puntaje libre, el mismo caso daba de 30 a 72 según la corrida.
const SchemaMatch = z.object({
  items: z.array(z.object({
    nroItem: z.number().int(),
    descripcion: z.string(),
    puedeOfertar: z.boolean(),
    productoEmpresa: z.string().nullable().describe('nombre del producto de la empresa que corresponde, o null si no está en su lista'),
    nota: z.string().describe('muy breve, máximo 12 palabras'),
  })).describe('SOLO los ítems que la empresa puede ofertar (máximo 40); los que no aparecen se entienden como no ofertables'),
  razon: z.string().describe('1-2 frases concretas en español rioplatense, mencionando ítems'),
  nivel: z.enum(NIVELES).describe('qué puede ofertar, según la guía'),
  fueraDeZona: z.boolean().describe('la entrega es fuera de los departamentos donde reparte'),
  volumenExcesivo: z.boolean().describe('lo pedido supera claramente la capacidad declarada'),
});

const SYSTEM = `Sos el analista de licitaciones de una barraca de materiales de construcción en Uruguay. Decidís si una licitación del Estado es una oportunidad REAL para esta empresa.
Contexto clave de las compras públicas uruguayas: casi siempre se puede ofertar y adjudicar POR ÍTEM. La empresa no necesita cubrir todos los ítems: alcanza con que pueda cotizar algunos que valgan la pena. Los ítems que no puede ofertar NO restan.
1. Ítem por ítem, decidí si la empresa lo puede ofertar:
   - Lo vende, o vende uno equivalente (ej. "ARENA TERCIADA" ↔ "Arena terciada m3"; "CEMENTO PORTLAND" ↔ "Portland bolsa 25 kg"; "VARILLA DE HIERRO TORSIONADO" ↔ "Varilla torsionada 8 mm").
   - No está en su lista pero es un material típico de barraca, que consigue con sus proveedores: áridos, cemento y cal, hierro de construcción y perfiles, premoldeados de hormigón (bloques, cordones, columnas, caños), ladrillos, maderas de obra y tableros, yeso y steel frame (placas, perfiles, cielorrasos), chapas y zinguería, caños y accesorios de PVC, membranas e impermeabilizantes, pinturas de obra, alambres y tejidos, clavos y tornillería, herramientas de albañil (baldes, fratachos, cucharas). También es ofertable: productoEmpresa null y en la nota "no está en su lista".
   - No son de barraca: aberturas de aluminio a medida, cerrajería, material eléctrico, grifería y sanitaria fina, herramientas eléctricas, maquinaria, repuestos, muebles.
2. "nivel", según lo que SÍ puede ofertar:
   - principales: vende (está en su lista) los ítems principales, los de más cantidad o valor, o lo que es el objeto de la compra.
   - relevantes: vende algunos ítems que valen la pena, aunque no sean los principales.
   - consigue: los ítems que valen la pena son de barraca pero no están en su lista.
   - menores: solo puede ofertar ítems chicos o de poco valor.
   - ninguno: no puede ofertar nada; o es una obra llave en mano, un servicio (mano de obra, mantenimiento, instalación, colocación), maquinaria, vehículos, medicamentos, mobiliario, electricidad, informática o herramientas, aunque mencione materiales.
3. "fueraDeZona": la entrega es fuera de los departamentos donde reparte (false si no indica zonas). Si es true, mencioná el costo de flete; no la descartes por eso solo.
4. "volumenExcesivo": lo pedido supera claramente la capacidad declarada (false si no la declara). Si es true, mencionalo: puede ofertar parcial o con entregas escalonadas si el pliego lo permite.
5. Si no hay ítems publicados, decidí por el objeto y lo que diga el pliego. Si además no hay pliego leído y el objeto es una compra de materiales de barraca, elegí "relevantes": el detalle se confirma al leer el pliego.
- En "items" devolvé SOLO los ítems que la empresa puede ofertar (máximo 40, los más importantes primero). No listes los que no puede.
- No inventes ítems ni productos. Usá solo los nroItem que aparecen.`;

// "menores" queda debajo de 40 (no se muestra): en la práctica son compras de otro rubro con un ítem suelto de barraca.
const BASE_NIVEL: Record<Nivel, number> = { principales: 88, relevantes: 75, consigue: 60, menores: 35, ninguno: 10 };

/**
 * Confianza 0-100 a partir de la clasificación. Bandas de la UI: alta ≥ 75, media ≥ 50, se muestra desde 40.
 * Hasta +7 por la parte de los ítems que puede ofertar; fuera de zona −15 y nunca "alta"; volumen −10; sin ítems ni pliego, tope 70.
 */
export function calcularConfianza(c: { nivel: Nivel; fueraDeZona: boolean; volumenExcesivo: boolean; ofertables: number; totalItems: number; aCiegas: boolean }) {
  let v = BASE_NIVEL[c.nivel];
  if (c.nivel !== 'ninguno') {
    if (c.totalItems > 0) v += Math.round((7 * Math.min(c.ofertables, c.totalItems)) / c.totalItems);
    if (c.fueraDeZona) v = Math.min(v - 15, 74);
    if (c.volumenExcesivo) v -= 10;
  }
  if (c.aCiegas) v = Math.min(v, 70);
  return Math.max(0, Math.min(100, v));
}

export interface PerfilParaMatch {
  empresaId: string; nombre: string; departamento: string | null; zonas: string[]; capacidad: string | null;
  productos: string[]; perfilActualizadoEn: Date | null;
}

export async function cargarPerfil(empresaId: string): Promise<PerfilParaMatch | null> {
  const [[e], prods] = await Promise.all([
    db.select().from(schema.empresas).where(eq(schema.empresas.id, empresaId)),
    db.select().from(schema.empresaProductos).where(eq(schema.empresaProductos.empresaId, empresaId)),
  ]);
  if (!e) return null;
  return {
    empresaId, nombre: e.nombre, departamento: e.departamento, zonas: e.zonasEntrega ?? [], capacidad: e.capacidadNotas,
    productos: prods.map((p) => `${p.nombre}${p.unidad ? ` (${p.unidad})` : ''}`),
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
  const texto = `${TIPOS_COMPRA[l.tipoCompra] ?? l.tipoCompra} ${l.numCompra ?? ''}/${l.anioCompra ?? ''} · ${l.organismo ?? ''}${l.unidadEjecutora ? ` — ${l.unidadEjecutora}` : ''}
Objeto: ${l.objeto ?? '(sin objeto)'}
Lugar de entrega: ${l.lugarEntrega ?? 'no indicado'}
Cierre de ofertas: ${fecha}
Ítems:
${lineas.join('\n') || '  (sin ítems publicados)'}
Qué piden según el pliego: ${a?.quePiden ?? 'sin pliego leído'}`;
  return { texto, totalItems: items.length, aCiegas: items.length === 0 && !a };
}

// Los papeles no van acá: los evalúa el gap documental y descuentan la confianza al leerla (AJUSTE_DOCUMENTAL).
function textoPerfil(p: PerfilParaMatch) {
  return `${p.nombre} (${p.departamento ?? 'departamento no indicado'})
Vende: ${p.productos.join('; ') || 'sin productos cargados'}
Entrega en: ${p.zonas.join(', ') || 'no indicado'}
Capacidad: ${p.capacidad ?? 'no indicada'}`;
}

/** Evalúa una licitación para una empresa sin guardar nada. */
export async function puntuarLicitacion(perfil: PerfilParaMatch, idCompra: string) {
  const ctx = await contextoLicitacion(idCompra);
  if (!ctx) return null;
  const { objeto } = await generarObjeto({
    modelo: modeloRapido, schema: SchemaMatch, system: SYSTEM,
    prompt: `EMPRESA:\n${textoPerfil(perfil)}\n\nLICITACIÓN:\n${ctx.texto}`, maxOutputTokens: 3000,
  });
  const items = objeto.items.filter((i) => i.puedeOfertar);
  const confianza = calcularConfianza({ ...objeto, ofertables: items.length, totalItems: ctx.totalItems, aCiegas: ctx.aCiegas });
  return { ...objeto, items, confianza, modelo: nombreModeloRapido };
}

/** Evalúa una licitación para una empresa y guarda el match. */
export async function evaluarLicitacion(perfil: PerfilParaMatch, idCompra: string, opts: { sinExtras?: boolean } = {}) {
  const objeto = await puntuarLicitacion(perfil, idCompra);
  if (!objeto) return null;
  const fila = {
    empresaId: perfil.empresaId, idCompra, relevante: objeto.confianza >= 40, confianza: objeto.confianza, razon: objeto.razon,
    itemsOfertables: objeto.items, perfilVersion: perfil.perfilActualizadoEn ?? new Date(), updatedAt: new Date(),
  };
  await db.insert(schema.matches).values(fila).onConflictDoUpdate({
    target: [schema.matches.empresaId, schema.matches.idCompra],
    set: { relevante: fila.relevante, confianza: fila.confianza, razon: fila.razon, itemsOfertables: fila.itemsOfertables, perfilVersion: fila.perfilVersion, updatedAt: fila.updatedAt },
  });
  if (fila.relevante && !opts.sinExtras) {
    await Promise.all([calcularPrecios(idCompra).catch(() => null), calcularGapParaMatch(perfil.empresaId, idCompra).catch(() => null)]);
  }
  return objeto;
}

/** Si otra corrida ya evaluó esta licitación con el perfil actual mientras esta esperaba su turno. */
async function yaEvaluada(perfil: PerfilParaMatch, idCompra: string) {
  const [m] = await db.select({ v: schema.matches.perfilVersion }).from(schema.matches)
    .where(and(eq(schema.matches.empresaId, perfil.empresaId), eq(schema.matches.idCompra, idCompra)));
  return !!m && (perfil.perfilActualizadoEn === null || (!!m.v && m.v >= perfil.perfilActualizadoEn));
}

type OpcionesEvaluacion = { todas?: boolean; idCompras?: string[]; concurrencia?: number };
type ResultadoEvaluacion = { evaluadas: number; relevantes: number; errores: number };
/** Corridas normales en curso en esta instancia, por empresa y versión del perfil: un segundo pedido se suma a la que ya corre. */
const corridas = new Map<string, Promise<ResultadoEvaluacion>>();

/** Recalcula matches de una empresa contra licitaciones abiertas del rubro. Solo nuevas o desactualizadas salvo `todas`. */
export async function evaluarEmpresa(empresaId: string, opts: OpcionesEvaluacion = {}) {
  const perfil = await cargarPerfil(empresaId);
  if (!perfil) throw new Error('Empresa no encontrada');
  if (opts.todas || opts.idCompras?.length) return evaluarConPerfil(perfil, opts);
  const clave = `${empresaId}:${perfil.perfilActualizadoEn?.getTime() ?? 0}`;
  const enCurso = corridas.get(clave);
  if (enCurso) return enCurso;
  const corrida = evaluarConPerfil(perfil, opts).finally(() => corridas.delete(clave));
  corridas.set(clave, corrida);
  return corrida;
}

async function evaluarConPerfil(perfil: PerfilParaMatch, opts: OpcionesEvaluacion): Promise<ResultadoEvaluacion> {
  const empresaId = perfil.empresaId;
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
  const soloPendientes = !opts.todas && !opts.idCompras?.length;
  await enParalelo(candidatas, opts.concurrencia ?? 8, async (id) => {
    try {
      // Otra corrida (otra instancia, u otro pedido) pudo haberla evaluado mientras tanto: no repetir la llamada a la IA.
      if (soloPendientes && (await yaEvaluada(perfil, id))) return;
      const r = await evaluarLicitacion(perfil, id); if (r && r.confianza >= 40) relevantes++;
    }
    catch (e) { errores++; if ((e as Error).name === 'IANoConfigurada') throw e; }
  });
  return { evaluadas: candidatas.length, relevantes, errores };
}
