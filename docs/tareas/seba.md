# Brief para el agente de seba (Claude Code)

> Lo ejecuta Claude Code en la sesión de seba. Mismo formato que los briefs de rafa y maxi. seba además **integra** los PRs de los otros en los sync points.

## Quién sos y qué estás construyendo

Sos el agente de código de **seba** en el equipo de **Luxis** (seba, rafa, maxi), un analizador de licitaciones públicas de Uruguay (ARCE) para barracas de materiales de construcción, construido en una hackathon de 1 día. Tu parte: **infraestructura y base del repo, ingesta de datos de ARCE (XML + scraping + pliegos con ZIP/RAR), matching con IA, precio ganador histórico, análisis del pliego y gap documental, integración y deploy**.

Leé: `docs/01-prd.md`, `docs/02-datos-arce.md` (fuente de verdad de datos), `docs/03-arquitectura.md` (schema, tipos, contratos, carpetas), `docs/04-plan-de-accion.md`.

## Reglas duras

1. Branch nueva antes de tocar nada: `git checkout main && git pull && git checkout -b <branch>`. Excepción: integrar PRs ajenos en `main`.
2. Carpetas propias: `src/db/**`, `src/lib/types.ts`, `src/lib/ia/**`, `src/server/arce/**`, `src/server/ia/{modelos,matching,precio,analisis-pliego,gap-documental}.ts`, `src/server/consultas/**`, `src/config/plazos-documentales.ts`, `src/app/api/{ingesta,empresas,licitaciones}/**`, `scripts/**`, `drizzle.config.ts`, `vercel.json`, `CLAUDE.md`, `docs/**`.
3. Lo masivo con el modelo rápido (Haiku 5.5); el fuerte (Sonnet 5.5) solo on-demand. Salidas estructuradas con `generarObjeto` (AI SDK 7) + zod. `temperature: 0`.
4. Nada simulado. Nada de nombres de modelo fuera de `src/lib/ia/modelos.ts`. Secretos solo en `.env.local`.
5. `npm run lint && npm run build` antes de mergear. Commits convencionales en español.
6. Para librerías (Next 16, AI SDK 7, Drizzle, Supabase SSR, fast-xml-parser, node-unrar-js) consultar docs actuales con Context7 antes de escribir código: las APIs cambian.

---

## S0 · Infraestructura y base del repo — 14:00 → 14:45 · branch `chore/bootstrap`

**Objetivo:** que rafa y maxi puedan hacer `git pull`, `npm i`, copiar `.env.local` y levantar la app con el schema creado en la DB compartida.

### Pasos
1. **Supabase (seba a mano, 5 min):** proyecto `luxis` en región São Paulo. Copiar `Project URL`, `anon key`, `service_role key`, connection string **Transaction pooler** (6543) y **Session pooler** (5432). Authentication → Providers → Email: **desactivar "Confirm email"**. URL Configuration: Site URL `http://localhost:3000`. Pegar todo en `.env.local` (nunca en chat ni en el repo).
2. **Next.js:** como el repo ya tiene archivos, crear la app en una carpeta temporal y traerla: `npx create-next-app@latest /tmp/luxis-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack-prompt` y copiar todo (incluido `.gitignore`, fusionando con el actual: mantener `PRD.md` y `*.pdf` ignorados; agregar `.env*.local`).
3. **shadcn:** `npx shadcn@latest init` (base neutral) y `npx shadcn@latest add button card badge tabs input textarea select dialog sheet dropdown-menu form label separator skeleton table sonner popover command slider toggle-group avatar scroll-area progress tooltip checkbox radio-group`.
4. **Deps:** `npm i drizzle-orm postgres @supabase/supabase-js @supabase/ssr ai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/react zod fast-xml-parser cheerio unpdf mammoth word-extractor xlsx adm-zip node-unrar-js date-fns lucide-react` y `npm i -D drizzle-kit tsx dotenv @types/adm-zip`.
5. **Schema:** `src/db/schema.ts` exactamente como `docs/03-arquitectura.md` §3 (incluir índices y uniques; extensión `pg_trgm` vía SQL en `drizzle/0000_extensiones.sql` o `db:push` + `CREATE EXTENSION IF NOT EXISTS pg_trgm;` ejecutado a mano). `src/db/index.ts` con `postgres(DATABASE_URL, { prepare: false })` (pooler de transacción). `drizzle.config.ts` con `DIRECT_URL`. Scripts `db:push` (solo seba) y `db:check` (`scripts/db-check.ts`: `SELECT 1` + lista de tablas, para que rafa y maxi verifiquen su conexión). Ejecutar `db:push` y verificar tablas en Supabase.
6. **Tipos y config:** `src/lib/types.ts` (§4 del doc 03, copiar tal cual), `src/lib/ia/modelos.ts` (`modeloRapido`, `modeloFuerte` según `IA_PROVEEDOR`), `src/config/plazos-documentales.ts` (§7), `src/server/consultas/{licitaciones,eventos,cobertura}.ts` con las firmas del contrato devolviendo consultas reales (que hoy vuelven vacías).
7. **Archivos de equipo:** `.env.example` (§8), `CLAUDE.md`, `README.md` raíz (cómo correr), `vercel.json` con cron diario `0 9 * * *` a `/api/ingesta/refresh?dias=2`.
8. **Vercel:** crear el proyecto desde el repo de GitHub (vía MCP de Vercel ya conectado o dashboard), cargar las variables de entorno de producción (mismas que `.env.local` salvo `NEXT_PUBLIC_APP_URL` y `CRON_SECRET`), framework Next.js.
9. Commit, merge a `main`, push. Avisar en el canal y repartir `.env.local` por mensaje directo.

### Verificación
- `npm run dev` levanta la home de Next sin errores; `npm run db:push` crea las tablas; `npm run build` verde.
- Un `SELECT count(*) FROM licitaciones` devuelve 0 desde Supabase SQL editor.

---

## S1 · Ingesta ARCE: XML + scraper + pliegos — 14:45 → 17:00 · branch `feat/ingesta-arce`

**Objetivo:** DB con licitaciones vigentes del rubro (ítems, aclaraciones, archivos con texto) y adjudicaciones históricas del rubro con precios y oferentes; endpoint de refresh; función de scraping por id.

### Archivos
```
src/server/arce/xml.ts              # generarReporte(tipo, desde, hasta) → ventanas de ≤10 días, fetch con timeout 90 s y 3 reintentos, decode ISO-8859-1, parse con fast-xml-parser (ignoreAttributes:false, attributeNamePrefix:''), arrays siempre (isArray para compra/item/adjudicacion/oferente/aclaracion)
src/server/arce/normalizar.ts       # fechas DD/MM/YYYY HH:MM → Date (America/Montevideo), números, moneda id → código, texto normalizado (sin tildes, mayúsculas, espacios)
src/server/arce/rubro.ts            # esRubro(texto): usa src/config/rubro-barraca.ts (si maxi no lo entregó, usar la lista inicial de docs/02 §7)
src/server/arce/guardar.ts          # upsertLlamados(compras[]), upsertAdjudicaciones(compras[]) con onConflictDoUpdate
src/server/arce/scraper.ts          # scrapeDetalle(idCompra): fetch con UA de navegador (sin URL), Referer, Accept-Language; cheerio; devuelve el mismo shape que xml.ts; verificar selectores contra el HTML real (pistas en docs/02 §4)
src/server/arce/descargas.ts        # descargarArchivo(url): límite 40 MB, 2 reintentos, devuelve Buffer + content-type
src/server/arce/extraccion.ts       # extraerTexto(nombre, buffer): pdf→unpdf, docx→mammoth, doc→word-extractor, xls/xlsx→xlsx, html→cheerio, zip→adm-zip (recursivo 2 niveles), rar→node-unrar-js (WASM), otros→no_soportado. Devuelve ArchivoExtraido[] (nombre, extension, contenedor, texto, estado, error)
src/server/arce/clasificar.ts       # clasificarArchivo(nombre, texto) → categoria + relevante (tabla docs/02 §5)
src/server/arce/procesar-archivos.ts# procesarArchivos(idCompra): pliego + aclaraciones → descargar → extraer → clasificar → guardar en licitacion_archivos; marca licitaciones.archivos_procesados
src/server/arce/ingesta.ts          # ingestarVigentes(desde, hasta), ingestarAdjudicaciones(desde, hasta), refresh(dias) — registran ingesta_corridas
scripts/ingest-vigentes.ts          # npm run ingest:vigentes [-- --dias 60]
scripts/ingest-adjudicaciones.ts    # npm run ingest:adjudicaciones -- --desde 2024-01-01
scripts/procesar-archivos.ts        # procesa archivos de todas las es_rubro abiertas sin procesar, concurrencia 3
src/app/api/ingesta/refresh/route.ts# POST; auth por Bearer CRON_SECRET o sesión; maxDuration 300
```

### Decisiones ya tomadas
- Guardar **todas** las licitaciones vigentes (son pocas) pero marcar `es_rubro`; procesar archivos **solo** de `es_rubro`.
- Adjudicaciones: guardar solo filas del rubro + todos los oferentes de esas compras.
- `fecha_tope_ofertas = fecha_hora_tope_entrega ?? fecha_hora_apertura`. Descartar fechas > hoy + 3 años.
- Resolver nombre de organismo con `reporteIncisos.do` + `reporteUnidadesEjecutoras.do` cacheados en `src/config/organismos.json` (generarlo en esta tarea con un script corto).
- Si el XML trae una compra sin ítems o con todos `id_articulo=0` y sin pliego, intentar `scrapeDetalle` para completar (máx. 50 por corrida).

### Verificación
```sql
select count(*) from licitaciones where es_rubro and fecha_tope_ofertas > now();      -- esperado ≥ 20
select count(*) from adjudicaciones;                                                   -- esperado ≥ 2000 tras el backfill
select desc_articulo, count(*), percentile_cont(0.5) within group (order by precio_unit) from adjudicaciones where desc_normalizada like '%PORTLAND%' and id_moneda=0 group by 1 order by 2 desc limit 5;
select categoria, estado_extraccion, count(*) from licitacion_archivos group by 1,2;    -- hay pliego_particular ok
```
- Un RAR y un ZIP reales quedan desglosados; un PDF escaneado queda `no_soportado`.
- `curl -X POST -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/ingesta/refresh?dias=1` responde con conteos.
- Backfill de adjudicaciones corriendo en segundo plano (local o Tenki) antes de pasar a S2.

**Entrega:** PR `S1: ingesta ARCE` a las 17:00; integrar R1 y M1 en `main`.

---

## S2 · Matching y precio ganador histórico — 17:00 → 18:15 · branch `feat/matching-precio`

### Archivos
```
src/server/ia/matching.ts           # evaluarEmpresa(empresaId, { soloNuevas }): candidatas = es_rubro ∧ abiertas ∧ (sin match ∨ perfil_version < perfil_actualizado_en); concurrencia 5; generarObjeto(modeloRapido, schema Match); upsert matches; luego calcularPrecios(idCompra) y gap documental si hay análisis
src/server/ia/precio.ts             # calcularPrecios(idCompra): por ítem, SQL con percentile_cont sobre adjudicaciones (mismo id_articulo, o similarity(desc_normalizada) ≥ 0.6 si id_articulo=0), misma moneda y unidad, 24 meses; competidores = top 3 por veces adjudicado en ese artículo + veces ofertó (oferentes); precioSugerido = p25 ≤ x ≤ mediana (usar (p25+mediana)/2 si n ≥ 5, mediana si 2–4, null si < 2); explicación de 1 párrafo con modeloRapido; upsert precios_sugeridos
src/server/consultas/licitaciones.ts# implementar listarMatches, resumenDashboard, obtenerDetalle con joins reales
src/server/consultas/acciones.ts    # actualizarEstadoMatch
src/app/api/empresas/matching/route.ts     # POST con sesión → evaluarEmpresa
src/app/api/licitaciones/[id]/precio/route.ts
```

### Prompt de matching (base)
```
Sos el analista de licitaciones de una barraca de materiales de construcción en Uruguay. Decidí si esta licitación es una oportunidad REAL para esta empresa.
EMPRESA: {nombre} ({departamento}); vende: {productos con unidad}; entrega en: {zonas}; capacidad: {capacidad}; documentación: {docs}.
LICITACIÓN: {tipo} {numero} · {organismo} · objeto: {objeto} · lugar de entrega: {lugar} · cierre: {fecha} · ítems: {nro, desc, cantidad, unidad}... · qué piden según el pliego: {que_piden | "sin pliego leído"}.
Reglas: evaluá ítem por ítem si la empresa vende ese producto o uno equivalente; considerá zona y volumen; obras llave en mano, servicios de mano de obra o maquinaria NO son oportunidad aunque mencionen materiales. Confianza: 90–100 todos los ítems principales y zona ok; 70–89 la mayoría; 40–69 parcial; <40 no es para esta empresa. La razón en 1–2 frases concretas en español, mencionando ítems. No inventes ítems.
```

### Verificación
- `POST /api/empresas/matching` para la empresa demo → ≥ 10 matches con confianza ≥ 60; razones mencionan productos reales.
- Detalle de una licitación con "CEMENTO PORTLAND": `precios` trae n, p25, mediana, p75, competidores, precioSugerido y explicación con "sin IVA".
- Cambiar productos del perfil y recalcular cambia confianzas.

**Entrega:** PR `S2: matching + precio` a las 18:15.

---

## S3 · Análisis del pliego y gap documental — 18:15 → 19:15 · branch `feat/analisis-pliego`

### Archivos
```
src/server/ia/analisis-pliego.ts    # analizarLicitacion(idCompra, { forzar, modelo: 'rapido'|'fuerte' }): arma contexto (metadata + archivos relevantes ≤ 350k chars, orden por categoría), generarObjeto(schema AnalisisPliego); si no hay texto → basadoEn 'metadata', confianza ≤ 50; upsert analisis_licitacion
src/server/ia/gap-documental.ts     # calcularGap(requisitos, documentosEmpresa, fechaCierre) → GapDocumental[] + estadoDocumental (usa config/plazos-documentales.ts y días hábiles)
src/app/api/licitaciones/[id]/analizar/route.ts   # POST (?forzar=1 usa modelo fuerte)
src/app/api/licitaciones/analizar-url/route.ts    # POST { url } → extraer id → si no existe: scrapeDetalle → guardar → procesarArchivos → analizar → evaluarEmpresa(solo esa) → calcularPrecios → { idCompra }. Responder progreso por etapas (streaming de texto JSON por líneas o polling de estado en licitaciones.raw.etapa)
scripts/analizar-pendientes.ts      # analiza todas las es_rubro abiertas sin análisis, modelo rápido, concurrencia 3
```

### Prompt de análisis (base)
```
Leé los documentos de esta licitación uruguaya y devolvé SOLO el JSON del schema.
- resumen: 3–4 frases para el dueño de una barraca: qué compran, cuánto, dónde se entrega, cuándo cierra.
- requisitosDocumentales: cada documento/certificado/formulario/garantía exigido, con obligatorio, sección (ej. "Art. 7", "Anexo II") y tipo (RUPE, DGI, BPS, BSE, UNIT, ISO, OTRO).
- fechasClave: visita (si existe, con si es obligatoria), consultas, prórroga, apertura, entrega, muestras. Fecha en ISO o null; nunca inventes.
- condiciones: plazo y lugar de entrega, forma de pago, mantenimiento de oferta, garantía, muestras, si se cotiza con IVA, moneda.
- riesgos: cláusulas que complican a una barraca chica (multas, entregas parciales, exclusividad, marca específica).
- confianza 0–100 según cuánto del pliego pudiste leer. Citá secciones cuando existan.
```

### Verificación
- 3 licitaciones distintas analizadas: requisitos con sección, fechas con visita cuando el pliego la tiene.
- Licitación sin texto: `basadoEn = 'metadata'`, confianza ≤ 50.
- `analizar-url` con una URL real no ingestada termina en detalle completo en < 60 s.
- `npm run analizar:pendientes` corriendo para todas las abiertas del rubro.

**Entrega:** PR `S3: análisis de pliego` a las 19:15; integrar R2 y M2.

---

## S4 · Integración, deploy, seed, eval, bug bash — 19:15 → 20:30 · en `main`

1. Mergear todo; `npm run build`; deploy a Vercel verde; variables de producción completas; `vercel.json` cron.
2. `scripts/seed-demo.ts`: crea el usuario demo (Supabase admin API con service role) + empresa desde `demo-assets/empresa.md` y `lista-precios.xlsx`; corre matching y análisis para esa empresa. Credenciales de demo solo en el canal.
3. `scripts/eval-matching.ts`: lee `demo-assets/casos-eval.json`, asegura que esas 20 estén ingestadas y analizadas, corre el matching para la empresa demo, calcula precisión/recall/F1 con umbral 60 y escribe `demo-assets/eval-resultado.json` (maxi lo muestra en "Cómo funciona la IA").
4. Bug bash con rafa y maxi: flujo completo 3 veces con cuentas nuevas; corregir lo que rompa.
5. `README.md` final (qué es, cómo correr, arquitectura en 10 líneas, limitaciones) y tag `v0.1-demo`.

### Verificación
- Flujo completo en Vercel y en local con una cuenta nueva, sin intervención técnica.
- `eval-resultado.json` existe con métricas.
- Checklist pre-demo de `docs/05` en verde a las 20:30.

---

## Si te trabás
- ARCE caído: usar el XML ya descargado (cachear respuestas crudas en `data/arce/*.xml`, gitignored) y el fallback OCDS de `docs/02` §1.
- `node-unrar-js` falla en Vercel: procesar archivos solo por script local y marcar `error` con mensaje claro en la app.
- Pooler de Supabase rechaza `prepare`: `postgres(url, { prepare: false })`.
- Costos: si Haiku masivo supera lo previsto, limitar `analizar-pendientes` a las 60 licitaciones que cierran antes.
