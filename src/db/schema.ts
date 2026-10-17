import {
  pgTable, text, uuid, integer, serial, numeric, timestamp, boolean, jsonb, date, char,
  index, uniqueIndex, vector, customType,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });
/** Dimensión de los embeddings (Gemini gemini-embedding-001 con outputDimensionality 768). */
export const DIM_EMBEDDING = 768;
import type {
  PerfilEmpresa, ItemOfertable, GapDocumental, RequisitoDocumental, FechaClave, Condiciones, Competidor,
} from '@/lib/types';

// ---------- Empresa y usuarios ----------

export const empresas = pgTable('empresas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  razonSocial: text('razon_social'),
  rut: text('rut'),
  departamento: text('departamento'),
  localidad: text('localidad'),
  web: text('web'),
  telefono: text('telefono'),
  emailContacto: text('email_contacto'),
  descripcion: text('descripcion'),
  zonasEntrega: text('zonas_entrega').array(),
  capacidadNotas: text('capacidad_notas'),
  montoMinimo: numeric('monto_minimo', { precision: 15, scale: 2 }),
  perfilJson: jsonb('perfil_json').$type<PerfilEmpresa>(),
  estadoOnboarding: text('estado_onboarding').notNull().default('pendiente'), // pendiente | en_progreso | completo
  perfilActualizadoEn: timestamp('perfil_actualizado_en', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const perfilesUsuario = pgTable('perfiles_usuario', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull(),
  nombre: text('nombre'),
  empresaId: uuid('empresa_id').references(() => empresas.id, { onDelete: 'set null' }),
  rol: text('rol').notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const empresaProductos = pgTable('empresa_productos', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  nombreNormalizado: text('nombre_normalizado').notNull(),
  categoria: text('categoria'),
  unidad: text('unidad'),
  precioReferencia: numeric('precio_referencia', { precision: 15, scale: 2 }),
  moneda: text('moneda').notNull().default('UYU'),
  keywords: text('keywords').array(),
  fuente: text('fuente').notNull().default('manual'), // documento | entrevista | manual
}, (t) => [index('empresa_productos_empresa_idx').on(t.empresaId)]);

export const empresaDocumentos = pgTable('empresa_documentos', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(), // RUPE | DGI | BPS | BSE | UNIT | ISO | OTRO
  nombre: text('nombre').notNull(),
  estado: text('estado').notNull().default('desconocido'), // vigente | en_tramite | no_tiene | desconocido | vencido
  vencimiento: date('vencimiento'),
  notas: text('notas'),
}, (t) => [index('empresa_documentos_empresa_idx').on(t.empresaId)]);

export const empresaArchivos = pgTable('empresa_archivos', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  mime: text('mime'),
  tamano: integer('tamano'),
  textoExtraido: text('texto_extraido'),
  resumen: text('resumen'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Licitaciones (ARCE) ----------

export const licitaciones = pgTable('licitaciones', {
  idCompra: text('id_compra').primaryKey(),
  tipoCompra: char('tipo_compra', { length: 2 }).notNull(),
  subtipoCompra: text('subtipo_compra'),
  numCompra: text('num_compra'),
  anioCompra: integer('anio_compra'),
  inciso: integer('inciso'),
  ue: integer('ue'),
  organismo: text('organismo'),
  unidadEjecutora: text('unidad_ejecutora'),
  objeto: text('objeto'),
  estado: integer('estado'),
  fechaPublicacion: timestamp('fecha_publicacion', { withTimezone: true }),
  fechaUltMod: timestamp('fecha_ult_mod', { withTimezone: true }),
  fechaApertura: timestamp('fecha_apertura', { withTimezone: true }),
  fechaTopeOfertas: timestamp('fecha_tope_ofertas', { withTimezone: true }),
  fechaSolAclar: timestamp('fecha_sol_aclar', { withTimezone: true }),
  fechaSolProrr: timestamp('fecha_sol_prorr', { withTimezone: true }),
  fechaTopeEntrega: timestamp('fecha_tope_entrega', { withTimezone: true }),
  lugarApertura: text('lugar_apertura'),
  lugarEntrega: text('lugar_entrega'),
  precioPliego: numeric('precio_pliego', { precision: 15, scale: 2 }),
  monedaPliego: integer('moneda_pliego'),
  nombreContacto: text('nombre_contacto'),
  emailContacto: text('email_contacto'),
  nombrePliego: text('nombre_pliego'),
  urlDetalle: text('url_detalle'),
  aperturaElectronica: boolean('apertura_electronica').default(false),
  fuente: text('fuente').notNull().default('xml'), // xml | scrape
  esRubro: boolean('es_rubro').notNull().default(false),
  archivosProcesados: boolean('archivos_procesados').notNull().default(false),
  raw: jsonb('raw'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('licitaciones_es_rubro_idx').on(t.esRubro),
  index('licitaciones_tope_idx').on(t.fechaTopeOfertas),
  index('licitaciones_rubro_tope_idx').on(t.fechaTopeOfertas).where(sql`es_rubro`),
]);

export const licitacionItems = pgTable('licitacion_items', {
  id: serial('id').primaryKey(),
  idCompra: text('id_compra').notNull().references(() => licitaciones.idCompra, { onDelete: 'cascade' }),
  nroItem: integer('nro_item').notNull(),
  idArticulo: integer('id_articulo').notNull().default(0),
  descArticulo: text('desc_articulo').notNull(),
  descNormalizada: text('desc_normalizada').notNull(),
  cantPedida: numeric('cant_pedida', { precision: 15, scale: 2 }),
  unidad: text('unidad'),
  idMonedaCotiz: integer('id_moneda_cotiz'),
  variante: text('variante'),
  presentacion: text('presentacion'),
  marca: text('marca'),
  atributos: jsonb('atributos'),
}, (t) => [uniqueIndex('licitacion_items_unq').on(t.idCompra, t.nroItem)]);

export const licitacionAclaraciones = pgTable('licitacion_aclaraciones', {
  id: serial('id').primaryKey(),
  idCompra: text('id_compra').notNull().references(() => licitaciones.idCompra, { onDelete: 'cascade' }),
  fecha: timestamp('fecha', { withTimezone: true }),
  texto: text('texto'),
  nomArchivo: text('nom_archivo'),
  url: text('url'),
}, (t) => [index('licitacion_aclaraciones_compra_idx').on(t.idCompra)]);

export const licitacionArchivos = pgTable('licitacion_archivos', {
  id: serial('id').primaryKey(),
  idCompra: text('id_compra').notNull().references(() => licitaciones.idCompra, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  url: text('url'),
  extension: text('extension'),
  tamano: integer('tamano'),
  contenedor: text('contenedor'),
  categoria: text('categoria').notNull().default('otro'),
  relevante: boolean('relevante').notNull().default(false),
  estadoExtraccion: text('estado_extraccion').notNull().default('pendiente'), // pendiente | ok | no_soportado | error
  error: text('error'),
  texto: text('texto'),
  caracteres: integer('caracteres'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('licitacion_archivos_compra_idx').on(t.idCompra)]);

export const adjudicaciones = pgTable('adjudicaciones', {
  id: serial('id').primaryKey(),
  idCompra: text('id_compra').notNull(),
  nroItem: integer('nro_item').notNull(),
  idArticulo: integer('id_articulo').notNull().default(0),
  descArticulo: text('desc_articulo').notNull(),
  descNormalizada: text('desc_normalizada').notNull(),
  nroDocProv: text('nro_doc_prov'),
  nombreComercial: text('nombre_comercial'),
  cantAdj: numeric('cant_adj', { precision: 15, scale: 2 }),
  precioUnit: numeric('precio_unit', { precision: 15, scale: 4 }),
  precioTotal: numeric('precio_total', { precision: 15, scale: 2 }),
  idMoneda: integer('id_moneda').notNull().default(0),
  unidad: text('unidad'),
  fechaPubAdj: timestamp('fecha_pub_adj', { withTimezone: true }),
  tipoCompra: char('tipo_compra', { length: 2 }),
  inciso: integer('inciso'),
  ue: integer('ue'),
  organismo: text('organismo'),
}, (t) => [
  uniqueIndex('adjudicaciones_unq').on(t.idCompra, t.nroItem, t.nroDocProv),
  index('adjudicaciones_articulo_idx').on(t.idArticulo, t.idMoneda),
  index('adjudicaciones_prov_idx').on(t.nroDocProv),
  index('adjudicaciones_fecha_idx').on(t.fechaPubAdj),
  index('adjudicaciones_desc_idx').on(t.descNormalizada),
]);

export const oferentes = pgTable('oferentes', {
  id: serial('id').primaryKey(),
  idCompra: text('id_compra').notNull(),
  nroDocProv: text('nro_doc_prov').notNull(),
  nombreComercial: text('nombre_comercial'),
}, (t) => [uniqueIndex('oferentes_unq').on(t.idCompra, t.nroDocProv), index('oferentes_prov_idx').on(t.nroDocProv, t.idCompra)]);

export const ingestaCorridas = pgTable('ingesta_corridas', {
  id: serial('id').primaryKey(),
  tipo: text('tipo').notNull(), // vigentes | adjudicaciones | refresh | scrape | archivos
  desde: timestamp('desde', { withTimezone: true }),
  hasta: timestamp('hasta', { withTimezone: true }),
  compras: integer('compras').default(0),
  items: integer('items').default(0),
  adjudicaciones: integer('adjudicaciones').default(0),
  duracionMs: integer('duracion_ms'),
  estado: text('estado').notNull().default('ok'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- IA ----------

export const analisisLicitacion = pgTable('analisis_licitacion', {
  idCompra: text('id_compra').primaryKey().references(() => licitaciones.idCompra, { onDelete: 'cascade' }),
  resumen: text('resumen'),
  quePiden: text('que_piden'),
  requisitosDocumentales: jsonb('requisitos_documentales').$type<RequisitoDocumental[]>(),
  fechasClave: jsonb('fechas_clave').$type<FechaClave[]>(),
  condiciones: jsonb('condiciones').$type<Condiciones>(),
  riesgos: text('riesgos').array(),
  confianza: integer('confianza'),
  basadoEn: text('basado_en').notNull().default('metadata'), // pliego | metadata
  modelo: text('modelo'),
  caracteresLeidos: integer('caracteres_leidos'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id, { onDelete: 'cascade' }),
  idCompra: text('id_compra').notNull().references(() => licitaciones.idCompra, { onDelete: 'cascade' }),
  relevante: boolean('relevante').notNull().default(false),
  confianza: integer('confianza').notNull().default(0),
  razon: text('razon'),
  itemsOfertables: jsonb('items_ofertables').$type<ItemOfertable[]>(),
  gapDocumental: jsonb('gap_documental').$type<GapDocumental[]>(),
  estadoDocumental: text('estado_documental').notNull().default('desconocido'), // cumple | alcanzable | dificil | desconocido
  estadoUsuario: text('estado_usuario').notNull().default('nuevo'), // nuevo | guardada | descartada | presentada | ganada | perdida
  perfilVersion: timestamp('perfil_version', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('matches_unq').on(t.empresaId, t.idCompra),
  index('matches_empresa_conf_idx').on(t.empresaId, t.confianza),
]);

export const preciosSugeridos = pgTable('precios_sugeridos', {
  id: serial('id').primaryKey(),
  idCompra: text('id_compra').notNull().references(() => licitaciones.idCompra, { onDelete: 'cascade' }),
  nroItem: integer('nro_item').notNull(),
  idArticulo: integer('id_articulo').notNull().default(0),
  descNormalizada: text('desc_normalizada'),
  idMoneda: integer('id_moneda').notNull().default(0),
  unidad: text('unidad'),
  n: integer('n').notNull().default(0),
  p25: numeric('p25', { precision: 15, scale: 4 }),
  mediana: numeric('mediana', { precision: 15, scale: 4 }),
  p75: numeric('p75', { precision: 15, scale: 4 }),
  minimo: numeric('minimo', { precision: 15, scale: 4 }),
  maximo: numeric('maximo', { precision: 15, scale: 4 }),
  ultimoGanador: text('ultimo_ganador'),
  ultimoPrecio: numeric('ultimo_precio', { precision: 15, scale: 4 }),
  ultimaFecha: timestamp('ultima_fecha', { withTimezone: true }),
  competidores: jsonb('competidores').$type<Competidor[]>(),
  precioSugerido: numeric('precio_sugerido', { precision: 15, scale: 4 }),
  explicacion: text('explicacion'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('precios_sugeridos_unq').on(t.idCompra, t.nroItem)]);

export const notificaciones = pgTable('notificaciones', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(), // nuevo_match | cierre_proximo | visita_proxima | aclaracion | doc_alcanzable | sistema
  titulo: text('titulo').notNull(),
  cuerpo: text('cuerpo'),
  idCompra: text('id_compra'),
  leida: boolean('leida').notNull().default(false),
  claveDedupe: text('clave_dedupe').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('notificaciones_dedupe_unq').on(t.empresaId, t.claveDedupe),
  index('notificaciones_empresa_leida_idx').on(t.empresaId, t.leida),
  index('notificaciones_empresa_fecha_idx').on(t.empresaId, t.createdAt.desc()),
]);

export const chatMensajes = pgTable('chat_mensajes', {
  id: serial('id').primaryKey(),
  empresaId: uuid('empresa_id').notNull().references(() => empresas.id, { onDelete: 'cascade' }),
  idCompra: text('id_compra').notNull(),
  rol: text('rol').notNull(), // user | assistant
  contenido: text('contenido').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('chat_mensajes_idx').on(t.empresaId, t.idCompra, t.createdAt)]);

// ---------- Búsqueda vectorial ----------

/** Pliegos partidos en párrafos (la numeración coincide con las citas [archivo, pN] del chat). */
export const licitacionParrafos = pgTable('licitacion_parrafos', {
  id: serial('id').primaryKey(),
  archivoId: integer('archivo_id').notNull().references(() => licitacionArchivos.id, { onDelete: 'cascade' }),
  idCompra: text('id_compra').notNull(),
  archivoNombre: text('archivo_nombre').notNull(),
  categoria: text('categoria').notNull(),
  nroParrafo: integer('nro_parrafo').notNull(),
  texto: text('texto').notNull(),
  tsv: tsvector('tsv').generatedAlwaysAs(sql`to_tsvector('spanish', texto)`),
  embedding: vector('embedding', { dimensions: DIM_EMBEDDING }),
}, (t) => [
  index('parrafos_compra_idx').on(t.idCompra),
  uniqueIndex('parrafos_unq').on(t.archivoId, t.nroParrafo),
  index('parrafos_tsv_idx').using('gin', t.tsv),
  index('parrafos_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
]);

/** Embedding de cada descripción de artículo distinta (adjudicaciones + ítems) para comparar productos. */
export const articulosVec = pgTable('articulos_vec', {
  descNormalizada: text('desc_normalizada').primaryKey(),
  embedding: vector('embedding', { dimensions: DIM_EMBEDDING }).notNull(),
}, (t) => [index('articulos_vec_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops'))]);
