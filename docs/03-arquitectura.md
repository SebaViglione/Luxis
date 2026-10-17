# Arquitectura, schema de datos y contratos entre módulos

> Si cambia algo acá, cambia para los 3. Dueño del documento: seba. Pedidos de cambio por el canal del equipo.

## 1. Stack (fijo para hoy)

| Capa | Elección | Versión |
|---|---|---|
| Framework | Next.js App Router, Server Components + Server Actions, TypeScript estricto | next 16.4 · react 19 · TS 5 |
| UI | Tailwind 4 + shadcn/ui (CLI 4.22) + lucide-react + reactbits (3 usos puntuales) + date-fns 4 (`es`) | — |
| DB | Supabase Free (Postgres 17) vía **Drizzle ORM** + driver `postgres` (postgres-js) | drizzle-orm 0.45 |
| Auth | Supabase Auth (email + contraseña) con `@supabase/ssr` | — |
| IA | Vercel AI SDK `ai` 7 + `@ai-sdk/anthropic` 4 (+ `@ai-sdk/google` como fallback) + `@ai-sdk/react` | — |
| Modelos | `claude-haiku-5-5` = **rápido** (matching, extracción estructurada masiva, explicaciones cortas) · `claude-sonnet-5-5` = **fuerte** (chat con el pliego, entrevista, resumen final) | ids en `src/lib/ia/modelos.ts` |
| Datos | `fast-xml-parser` 5 · `cheerio` · `unpdf` · `mammoth` · `word-extractor` · `xlsx` · `adm-zip` · `node-unrar-js` | — |
| Voz | `@elevenlabs/react` 1.18 (stretch) | — |
| Hosting | Vercel Hobby (deploy por GitHub) + cron diario. Demo primaria local. | — |
| Scripts | `tsx` para `scripts/*.ts` (ingesta, seed, eval) | — |

Presupuesto de IA: análisis masivo siempre con el modelo rápido; el fuerte solo en interacción directa (chat, entrevista). Con eso todo el día cuesta < USD 5.

## 2. Estructura de carpetas y propiedad

```
src/
  app/
    page.tsx                                   maxi   landing
    (auth)/login|registro|recuperar/           rafa
    (auth)/actions.ts                          rafa
    (onboarding)/onboarding/                   rafa
    (app)/layout.tsx                           maxi   sidebar + topbar + campanita
    (app)/dashboard/                           maxi
    (app)/licitaciones/[id]/                   maxi   (el tab Chat lo llena rafa)
    (app)/calendario/                          maxi
    (app)/notificaciones/                      maxi
    (app)/como-funciona/                       maxi
    (app)/cuenta/                              rafa
    api/ingesta/refresh/                       seba
    api/empresas/matching/                     seba
    api/licitaciones/[id]/analizar/            seba
    api/licitaciones/[id]/precio/              seba
    api/licitaciones/analizar-url/             seba
    api/onboarding/extraer|entrevista/         rafa
    api/chat/pliego/                           rafa
    api/voz/token/                             rafa
  components/
    ui/                                        shadcn (cualquiera agrega con `npx shadcn add`)
    layout/ licitaciones/ calendario/ notificaciones/ marca/ reactbits/   maxi
    onboarding/ chat/ voz/                     rafa
  server/
    arce/      xml.ts scraper.ts descargas.ts extraccion.ts clasificar.ts rubro.ts guardar.ts procesar-archivos.ts   seba
    ia/        modelos.ts matching.ts precio.ts analisis-pliego.ts gap-documental.ts   seba
    ia/        perfil.ts chat-pliego.ts                                                  rafa
    consultas/ licitaciones.ts eventos.ts cobertura.ts  (LECTURA para la UI)            seba
    auth/      sesion.ts  (obtenerSesion / requerirSesion)                               rafa
    onboarding/                                                                          rafa
    notificaciones/ generar.ts consultas.ts                                              maxi
  db/        schema.ts index.ts                                                          seba
  lib/       types.ts (seba) · utils.ts · supabase/ (rafa) · mocks/ (maxi) · ia/ (seba)
  config/    rubro-barraca.ts (maxi) · plazos-documentales.ts (seba)
  proxy.ts                                                                               rafa
scripts/     ingest-vigentes.ts ingest-adjudicaciones.ts analizar-pendientes.ts seed-demo.ts eval-matching.ts   seba
demo-assets/                                                                             maxi
docs/
```

Regla: tocás solo lo tuyo. Si necesitás algo de otra carpeta, lo pedís; mientras tanto, mockeás en la tuya.

## 3. Schema de base de datos (Drizzle, `src/db/schema.ts`)

Convención: tablas y columnas en `snake_case` español; ids de ARCE como texto; fechas `timestamptz`; dinero `numeric(15,2)`; JSON tipado en `jsonb`.

### Empresa y usuarios
- **`perfiles_usuario`** — `id uuid PK` (= `auth.users.id`), `email`, `nombre`, `empresa_id uuid FK`, `rol text default 'admin'`, `created_at`.
- **`empresas`** — `id uuid PK`, `nombre`, `razon_social`, `rut text`, `departamento`, `localidad`, `web`, `telefono`, `email_contacto`, `descripcion text`, `zonas_entrega text[]`, `capacidad_notas text`, `monto_minimo numeric`, `perfil_json jsonb` (PerfilEmpresa completo), `estado_onboarding text` (`pendiente|en_progreso|completo`), `perfil_actualizado_en timestamptz`, `created_at`, `updated_at`.
- **`empresa_productos`** — `id serial`, `empresa_id`, `nombre`, `nombre_normalizado`, `categoria`, `unidad`, `precio_referencia numeric`, `moneda text default 'UYU'`, `keywords text[]`, `fuente text` (`documento|entrevista|manual`).
- **`empresa_documentos`** — `id serial`, `empresa_id`, `tipo text` (`RUPE|DGI|BPS|BSE|UNIT|ISO|OTRO`), `nombre`, `estado text` (`vigente|en_tramite|no_tiene|desconocido|vencido`), `vencimiento date`, `notas`.
- **`empresa_archivos`** — `id serial`, `empresa_id`, `nombre`, `mime`, `tamano int`, `texto_extraido text`, `resumen text`, `created_at`.

### Licitaciones (ARCE)
- **`licitaciones`** — `id_compra text PK`, `tipo_compra char(2)`, `subtipo_compra`, `num_compra`, `anio_compra int`, `inciso int`, `ue int`, `organismo text` (nombre resuelto), `unidad_ejecutora text`, `objeto text`, `estado int`, `fecha_publicacion`, `fecha_ult_mod`, `fecha_apertura` (acto de apertura), `fecha_tope_ofertas` (recepción de ofertas; si falta, = apertura), `fecha_sol_aclar`, `fecha_sol_prorr`, `fecha_tope_entrega`, `lugar_apertura`, `lugar_entrega`, `precio_pliego numeric`, `moneda_pliego int`, `nombre_contacto`, `email_contacto`, `nombre_pliego`, `url_detalle`, `apertura_electronica bool`, `fuente text` (`xml|scrape`), `es_rubro bool`, `archivos_procesados bool default false`, `raw jsonb`, `created_at`, `updated_at`. Índices: `es_rubro`, `fecha_tope_ofertas`.
- **`licitacion_items`** — `id serial`, `id_compra FK`, `nro_item int`, `id_articulo int`, `desc_articulo`, `desc_normalizada`, `cant_pedida numeric`, `unidad`, `id_moneda_cotiz int`, `variante`, `presentacion`, `marca`, `atributos jsonb`. Unique `(id_compra, nro_item)`.
- **`licitacion_aclaraciones`** — `id serial`, `id_compra`, `fecha`, `texto`, `nom_archivo`, `url`.
- **`licitacion_archivos`** — `id serial`, `id_compra`, `nombre`, `url`, `extension`, `tamano int`, `contenedor text` (zip/rar de origen), `categoria text` (`pliego_particular|pliego_general|memoria|aclaracion|formulario|planilla|plano|otro`), `relevante bool`, `estado_extraccion text` (`pendiente|ok|no_soportado|error`), `error text`, `texto text`, `caracteres int`, `created_at`.
- **`adjudicaciones`** — `id serial`, `id_compra`, `nro_item int`, `id_articulo int`, `desc_articulo`, `desc_normalizada`, `nro_doc_prov`, `nombre_comercial`, `cant_adj numeric`, `precio_unit numeric(15,4)`, `precio_total numeric`, `id_moneda int`, `unidad`, `fecha_pub_adj`, `tipo_compra`, `inciso int`, `ue int`, `organismo`. Índices: `(id_articulo, id_moneda)`, `desc_normalizada` (gin trgm), `nro_doc_prov`.
- **`oferentes`** — `id serial`, `id_compra`, `nro_doc_prov`, `nombre_comercial`. Unique `(id_compra, nro_doc_prov)`.
- **`ingesta_corridas`** — `id serial`, `tipo` (`vigentes|adjudicaciones|refresh|scrape`), `desde`, `hasta`, `compras int`, `items int`, `adjudicaciones int`, `duracion_ms int`, `estado`, `error`, `created_at`.

### IA por empresa
- **`analisis_licitacion`** — `id_compra text PK`, `resumen text`, `que_piden text`, `requisitos_documentales jsonb` (RequisitoDocumental[]), `fechas_clave jsonb` (FechaClave[]), `condiciones jsonb` (Condiciones), `riesgos text[]`, `confianza int`, `basado_en text` (`pliego|metadata`), `modelo text`, `caracteres_leidos int`, `created_at`, `updated_at`.
- **`matches`** — `id serial`, `empresa_id`, `id_compra`, `relevante bool`, `confianza int`, `razon text`, `items_ofertables jsonb` (ItemOfertable[]), `gap_documental jsonb` (GapDocumental[]), `estado_documental text` (`cumple|alcanzable|dificil|desconocido`), `estado_usuario text` (`nuevo|guardada|descartada|presentada|ganada|perdida`), `perfil_version timestamptz`, `created_at`, `updated_at`. Unique `(empresa_id, id_compra)`.
- **`precios_sugeridos`** — `id serial`, `id_compra`, `nro_item int`, `id_articulo int`, `desc_normalizada`, `id_moneda int`, `unidad`, `n int`, `p25 numeric`, `mediana numeric`, `p75 numeric`, `minimo numeric`, `maximo numeric`, `ultimo_ganador text`, `ultimo_precio numeric`, `ultima_fecha`, `competidores jsonb` (Competidor[]), `precio_sugerido numeric`, `explicacion text`, `created_at`. Unique `(id_compra, nro_item)`. (No depende de la empresa: el histórico es el mismo para todos.)
- **`notificaciones`** — `id serial`, `empresa_id`, `tipo text` (`nuevo_match|cierre_proximo|visita_proxima|aclaracion|doc_alcanzable|sistema`), `titulo`, `cuerpo`, `id_compra text null`, `leida bool default false`, `clave_dedupe text` (`tipo:id_compra:yyyy-mm-dd`), `created_at`. Unique `(empresa_id, clave_dedupe)`.
- **`chat_mensajes`** — `id serial`, `empresa_id`, `id_compra`, `rol text`, `contenido text`, `created_at`.

### Vistas
- `v_eventos_calendario` (seba): une fechas de `licitaciones` (tope de ofertas, consultas, prórroga, entrega) y `analisis_licitacion.fechas_clave` (visita y otras) con `matches` no descartados por empresa.

## 4. Tipos compartidos (`src/lib/types.ts`, dueño seba)

```ts
export type Moneda = 'UYU' | 'USD' | 'UI' | 'UR' | 'OTRA';
export type EstadoDoc = 'vigente' | 'en_tramite' | 'no_tiene' | 'desconocido' | 'vencido';
export type TipoDoc = 'RUPE' | 'DGI' | 'BPS' | 'BSE' | 'UNIT' | 'ISO' | 'OTRO';

export interface ProductoEmpresa { nombre: string; categoria: string; unidad: string; precioReferencia: number | null; moneda: Moneda; keywords: string[]; fuente: 'documento' | 'entrevista' | 'manual'; }
export interface DocumentoEmpresa { tipo: TipoDoc; nombre: string; estado: EstadoDoc; vencimiento: string | null; notas?: string; }
export interface PerfilEmpresa {
  nombre: string; razonSocial?: string; rut?: string; departamento?: string; localidad?: string; web?: string; telefono?: string; emailContacto?: string;
  descripcion: string; productos: ProductoEmpresa[]; zonasEntrega: string[]; capacidadNotas?: string; montoMinimo?: number | null;
  documentacion: DocumentoEmpresa[]; experienciaLicitaciones?: string; organismosInteres?: string[]; camposFaltantes: string[];
}

export interface ItemLicitacion { nroItem: number; idArticulo: number; descripcion: string; cantidad: number; unidad: string; moneda: Moneda; variante?: string; presentacion?: string; marca?: string; }
export interface ArchivoLicitacion { id: number; nombre: string; url: string; extension: string; tamano: number | null; contenedor: string | null; categoria: 'pliego_particular'|'pliego_general'|'memoria'|'aclaracion'|'formulario'|'planilla'|'plano'|'otro'; relevante: boolean; estadoExtraccion: 'pendiente'|'ok'|'no_soportado'|'error'; error?: string | null; caracteres: number | null; }
export interface ItemOfertable { nroItem: number; descripcion: string; puedeOfertar: boolean; productoEmpresa: string | null; nota: string; }
export interface RequisitoDocumental { documento: string; tipo: TipoDoc | 'OTRO'; obligatorio: boolean; seccion: string | null; detalle: string; }
export interface FechaClave { tipo: 'visita'|'consultas'|'prorroga'|'apertura'|'entrega'|'muestras'|'otro'; fecha: string | null; descripcion: string; obligatoria: boolean; fuente: string | null; }
export interface Condiciones { plazoEntrega?: string; lugarEntrega?: string; formaPago?: string; mantenimientoOferta?: string; garantia?: string; muestras?: string; cotizarConIva?: boolean | null; moneda?: string; }
export interface GapDocumental { documento: string; tipo: TipoDoc | 'OTRO'; obligatorio: boolean; tiene: boolean; estadoEmpresa: EstadoDoc; diasEstimados: number | null; alcanzableAntesCierre: boolean | null; nota: string; }
export interface Competidor { nombre: string; nroDoc: string; vecesAdjudicado: number; vecesOferto: number; }
export interface PrecioHistorico { nroItem: number; idArticulo: number; descripcion: string; moneda: Moneda; unidad: string; n: number; p25: number | null; mediana: number | null; p75: number | null; minimo: number | null; maximo: number | null; ultimoGanador: string | null; ultimoPrecio: number | null; ultimaFecha: string | null; competidores: Competidor[]; precioSugerido: number | null; explicacion: string | null; }
export interface AnalisisPliego { resumen: string; quePiden: string; requisitosDocumentales: RequisitoDocumental[]; fechasClave: FechaClave[]; condiciones: Condiciones; riesgos: string[]; confianza: number; basadoEn: 'pliego' | 'metadata'; }

export type EstadoUsuarioMatch = 'nuevo'|'guardada'|'descartada'|'presentada'|'ganada'|'perdida';
export type EstadoDocumental = 'cumple'|'alcanzable'|'dificil'|'desconocido';

export interface LicitacionCard {
  idCompra: string; objeto: string; organismo: string; tipoCompra: string; tipoCompraNombre: string; numero: string;
  fechaTopeOfertas: string | null; diasParaCierre: number | null; fechaPublicacion: string;
  confianza: number; razon: string; resumen: string | null; itemsOfertables: ItemOfertable[];
  estadoDocumental: EstadoDocumental; estadoUsuario: EstadoUsuarioMatch; tieneVisita: boolean; montoEstimado: number | null; moneda: Moneda;
}
export interface DetalleLicitacion {
  licitacion: { idCompra: string; objeto: string; organismo: string; unidadEjecutora: string | null; tipoCompra: string; tipoCompraNombre: string; numero: string; estado: string; fechaPublicacion: string; fechaTopeOfertas: string | null; fechaApertura: string | null; fechaSolAclar: string | null; fechaSolProrr: string | null; fechaTopeEntrega: string | null; lugarApertura: string | null; lugarEntrega: string | null; precioPliego: number | null; contacto: { nombre: string | null; email: string | null }; urlDetalle: string; urlOfertar: string; };
  items: ItemLicitacion[]; archivos: ArchivoLicitacion[]; aclaraciones: { fecha: string; texto: string; url: string | null }[];
  analisis: AnalisisPliego | null; match: { confianza: number; razon: string; itemsOfertables: ItemOfertable[]; gapDocumental: GapDocumental[]; estadoDocumental: EstadoDocumental; estadoUsuario: EstadoUsuarioMatch } | null;
  precios: PrecioHistorico[];
}
export interface EventoCalendario { id: string; idCompra: string; tipo: 'apertura'|'consultas'|'prorroga'|'visita'|'entrega'|'otro'; fecha: string; titulo: string; descripcion: string | null; obligatoria: boolean; }
export interface Notificacion { id: number; tipo: 'nuevo_match'|'cierre_proximo'|'visita_proxima'|'aclaracion'|'doc_alcanzable'|'sistema'; titulo: string; cuerpo: string; idCompra: string | null; leida: boolean; createdAt: string; }
export interface FiltrosDashboard { confianzaMin?: number; tipos?: string[]; organismo?: string; cierreDias?: number; estado?: 'nuevas'|'guardadas'|'descartadas'|'todas'; orden?: 'cierre'|'confianza'|'monto'; }
```

## 5. Contratos entre módulos

### Lectura para la UI (seba → maxi/rafa) — `src/server/consultas/*`
| Función | Devuelve |
|---|---|
| `listarMatches(empresaId, filtros: FiltrosDashboard)` | `LicitacionCard[]` (por defecto: `relevante` o confianza ≥ 40, no descartadas, abiertas, orden por cierre) |
| `resumenDashboard(empresaId)` | `{ total: number; cierranSemana: number; nuevas24h: number }` |
| `obtenerDetalle(empresaId, idCompra)` | `DetalleLicitacion \| null` |
| `listarEventos(empresaId, desde: Date, hasta: Date)` | `EventoCalendario[]` |
| `coberturaDatos()` | `{ licitacionesRubro: number; adjudicaciones: number; articulosConHistorial: number; pliegosLeidos: number; ultimaIngesta: string \| null }` |

Hasta que existan, maxi implementa las **mismas firmas** en `src/lib/mocks/consultas.ts`.

### Acciones (seba) — server actions en `src/server/consultas/acciones.ts` + rutas
| Qué | Firma / ruta |
|---|---|
| Cambiar estado de un match | `actualizarEstadoMatch(empresaId, idCompra, estado: EstadoUsuarioMatch)` |
| Recalcular matches de la empresa actual | `POST /api/empresas/matching` → `{ evaluadas, relevantes }` (usa la sesión) |
| Refresh de datos | `POST /api/ingesta/refresh?dias=2` (header `Authorization: Bearer CRON_SECRET` o sesión) → `{ compras, items, adjudicaciones }`; al final llama `generarNotificaciones` de cada empresa |
| Analizar una licitación ya ingestada | `POST /api/licitaciones/{idCompra}/analizar` → `AnalisisPliego` (idempotente; `?forzar=1` recalcula) |
| Analizar por URL o id nuevo | `POST /api/licitaciones/analizar-url` body `{ url }` → `{ idCompra }` (scrapea, guarda, procesa archivos, analiza, matchea para la empresa actual, calcula precios). Puede tardar 20–60 s: la UI muestra etapas. |
| Precio de un ítem | `GET /api/licitaciones/{idCompra}/precio` → `PrecioHistorico[]` (se calcula en matching; esta ruta solo lee/recalcula) |

### Sesión (rafa → todos) — `src/server/auth/sesion.ts`
- `obtenerSesion(): Promise<{ usuarioId: string; email: string; empresaId: string; estadoOnboarding: string } | null>`
- `requerirSesion()`: igual pero redirige a `/login` si no hay sesión, y a `/onboarding` si el onboarding no está completo (salvo en rutas de onboarding).

### Onboarding (rafa) — `src/server/onboarding/guardar-perfil.ts`
- `guardarPerfil(empresaId, perfil: PerfilEmpresa, { completo: boolean })`: upsert en `empresas`, reemplaza `empresa_productos` y `empresa_documentos`, actualiza `perfil_actualizado_en`. Si `completo`, dispara `POST /api/empresas/matching` (fire-and-forget) y redirige al dashboard.

### Notificaciones (maxi) — `src/server/notificaciones/*`
- `generarNotificaciones(empresaId): Promise<number>` (idempotente por `clave_dedupe`), `contarNoLeidas(empresaId)`, `listarNotificaciones(empresaId, { soloNoLeidas?, limite? })`, `marcarLeida(id)`, `marcarTodasLeidas(empresaId)`.

### Chat (rafa) — `POST /api/chat/pliego` body `{ idCompra, messages }` → stream UI del AI SDK. Componente `<ChatPliego idCompra />`.

## 6. Pipeline de IA por componente

| # | Componente | Modelo | Entrada | Salida (schema zod) | Dueño |
|---|---|---|---|---|---|
| 1 | Perfil de empresa | fuerte | textos de archivos/web (≤ 150k chars) o transcript | `PerfilEmpresa` | rafa |
| 2 | Entrevista | fuerte, `streamText` + tool `guardar_perfil` | perfil parcial + faltantes + mensajes | texto + llamada a tool | rafa |
| 3 | Matching | rápido, `generateObject`, concurrencia 5 | perfil resumido (productos, zonas, capacidad, documentación) + licitación (objeto, organismo, tipo, fechas, lugar de entrega, ítems con cantidades, `que_piden` del análisis si existe) | `{ relevante, confianza 0–100, razon, items: ItemOfertable[] }` | seba |
| 4 | Análisis de pliego | rápido (masivo) / fuerte (`?forzar=1` desde el detalle) | metadata + archivos relevantes (≤ 350k chars) | `AnalisisPliego` | seba |
| 5 | Gap documental | sin LLM: `requisitosDocumentales` × `empresa_documentos` × `config/plazos-documentales.ts` × días al cierre | `GapDocumental[]`, `estadoDocumental` | seba |
| 6 | Precio histórico | SQL (`percentile_cont`) + rápido para 1 párrafo de explicación | adjudicaciones mismo `id_articulo` (o `desc_normalizada` similar ≥ 0.6 trgm), misma moneda y unidad, 24 meses | `PrecioHistorico` | seba |
| 7 | Chat con el pliego | fuerte, `streamText`, prompt caching | metadata + archivos relevantes + historial | texto con citas `[archivo, pN]` | rafa |

Reglas comunes: `temperature 0` en extracción; siempre `generateObject` con zod para salidas estructuradas; nunca inventar (el prompt lo dice y el schema permite `null`); guardar `modelo` usado; loguear tokens.

Calibración de **confianza** (matching): 90–100 todos los ítems principales son productos que la empresa vende y la zona es alcanzable; 70–89 la mayoría de los ítems; 40–69 parcial o dudas de zona/capacidad; < 40 no es para esta empresa. `relevante = confianza ≥ 40`.

## 7. Heurística de plazos documentales (`src/config/plazos-documentales.ts`)

| Documento | Cómo se obtiene | Días hábiles estimados |
|---|---|---|
| RUPE (inscripción/activo) | Trámite en línea + validación presencial de documentación | 1–5 (10 si falta documentación) |
| Certificado único DGI | En línea, inmediato si está al día | 0 |
| Certificado BPS | En línea, inmediato si está al día | 0 |
| Certificado BSE (accidentes de trabajo) | Contratación/renovación de póliza | 1–3 |
| Formulario de identificación del oferente / declaraciones juradas | Se completan | 0 |
| Garantía de mantenimiento de oferta | Banco/aseguradora | 1–3 |
| Antecedentes / referencias comerciales | Cartas de clientes | 1–3 |
| Fichas técnicas / certificados de marca | Proveedor/fabricante | 1–5 |
| Muestras | Logística | 1–3 |
| Certificación UNIT / ISO | Proceso de certificación | 60+ (no alcanzable) |
| Visita obligatoria | Fecha fija del pliego | depende de la fecha |

`alcanzableAntesCierre = diasHabilesHastaCierre >= diasEstimados + 1`.

## 8. Variables de entorno (`.env.example`)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # solo servidor (seed demo, borrar cuenta)
DATABASE_URL=                         # Transaction pooler (6543) para la app
DIRECT_URL=                           # Session pooler / directa (5432) para drizzle-kit
# IA
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=         # fallback opcional
IA_PROVEEDOR=anthropic                # anthropic | google
# Voz (stretch)
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

## 9. Scripts npm

`dev`, `build`, `lint`, `db:push` (drizzle-kit push con `DIRECT_URL`), `db:studio`, `ingest:vigentes`, `ingest:adjudicaciones -- --desde 2024-01-01`, `analizar:pendientes`, `seed:demo`, `eval:matching`.

## 10. Decisiones y descartes

- Sin RLS en Postgres: toda lectura/escritura pasa por el servidor y filtra por `empresa_id` (declarado como limitación).
- Sin storage de archivos: se guarda texto extraído; el original se linkea a ARCE.
- Sin embeddings/pgvector: el chat mete el pliego completo en contexto (cabe en 1M tokens) y el matching usa prefiltro por keywords + LLM. Si un pliego supera 350k chars, se recorta por prioridad de archivos.
- Sin cola de trabajos: el análisis masivo corre por script desde la máquina de seba (o Tenki); en la app, análisis on-demand por licitación con progreso visible.
- Monedas: no se convierten; las estadísticas se agrupan por moneda y unidad.
