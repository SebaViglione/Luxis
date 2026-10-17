# Brief para el agente de maxi (Claude Code o Kiro)

> Sirve para Claude Code y para Kiro. Para cada tarea, abrí una conversación nueva con el agente y pedile que ejecute **solo esa tarea** siguiendo este archivo. Una tarea por conversación.

## Quién sos y qué estás construyendo

Sos el agente de código (Claude Code o Kiro) de **maxi**, integrante de un equipo de 3 (seba, rafa, maxi) que construye **Luxis** en una hackathon de 1 día: un analizador de licitaciones públicas de Uruguay (portal ARCE) para **barracas de materiales de construcción**. La IA perfila a la empresa, encuentra licitaciones donde puede vender, lee el pliego, calcula el precio ganador histórico y responde preguntas sobre el pliego.

Tu parte: **la identidad visual y toda la interfaz de la app** (dashboard, detalle de licitación, calendario, notificaciones in-app, landing, página "Cómo funciona la IA"), más los **datos de la empresa de demo** y el **guion del pitch**.

Leé antes de empezar: `docs/01-prd.md`, `docs/03-arquitectura.md` (tipos compartidos, contratos de datos, carpetas que te pertenecen), `.kiro/steering/luxis.md`. Infraestructura (Supabase, Vercel) la maneja seba: vos solo necesitás el `.env.local` que él reparte.

## Paso 0 · Conectarte al proyecto de seba (antes de cualquier tarea)

El proyecto de Supabase, la base de datos y Vercel ya existen: los creó seba. Vos **no creás nada en Supabase ni en Vercel**, solo te conectás con las claves que seba te manda por mensaje privado.

```bash
git clone git@github.com:SebaViglione/Luxis.git && cd Luxis
npm install
cp .env.example .env.local        # pegá los valores que te mandó seba (Supabase URL y anon key, DATABASE_URL, DIRECT_URL, ANTHROPIC_API_KEY, y los de ElevenLabs si te tocan)
npm run db:check                  # hace SELECT 1 contra la DB compartida y lista las tablas; si falla, revisá DATABASE_URL
npm run dev                       # http://localhost:3000
```

- Trabajás **contra la misma base de datos** que seba y el resto: todo lo que insertes lo ven todos. No borres datos de otros.
- **Nunca corras `npm run db:push`** ni edites `src/db/schema.ts`: el schema lo cambia solo seba. Si necesitás una columna o tabla, pedísela.
- Usuarios de prueba: creá los tuyos desde `/registro` con un email tipo `rafa+1@example.com` (la confirmación de email está desactivada en Supabase).
- Si usás **Claude Code**: abrí el repo y decile "leé `docs/tareas/<tu nombre>.md` y ejecutá la tarea X siguiendo las reglas". `CLAUDE.md` ya tiene el contexto. Si usás **Kiro**: `.kiro/steering/luxis.md` carga el contexto solo; pegá el bloque de la tarea.

---

## Reglas duras

1. **Antes de tocar cualquier archivo**, creá la branch de la tarea:
   ```bash
   git checkout main && git pull && git checkout -b <branch de la tarea>
   ```
2. Solo editás tus carpetas: `src/app/page.tsx` (landing), `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/**`, `src/app/(app)/licitaciones/**`, `src/app/(app)/calendario/**`, `src/app/(app)/notificaciones/**`, `src/app/(app)/como-funciona/**`, `src/components/{layout,licitaciones,calendario,notificaciones,marca,reactbits,ui}/**`, `src/server/notificaciones/**`, `src/lib/mocks/**`, `src/config/rubro-barraca.ts` (solo este archivo de config), `demo-assets/**`, `docs/05-rubrica-demo-pitch.md`. El tab "Chat" del detalle lo llena rafa con `src/components/chat/chat-pliego.tsx`: vos dejás el hueco.
3. Stack fijo: Next.js 16 (App Router, Server Components), TypeScript estricto, Tailwind 4, **shadcn/ui** para todos los componentes base, **reactbits** solo donde se indica, `lucide-react` para íconos, `date-fns` con locale `es` para fechas.
4. **Diseño — regla anti "AI slop"**: Luxis es una herramienta de trabajo para alguien que vende portland y ladrillos. Sobria, densa en datos, rápida de leer.
   - **Base**: componentes shadcn tal cual, radios chicos (`rounded-md`), bordes finos, sombras mínimas, mucho espacio en blanco vertical, tablas con números tabulares (`tabular-nums`).
   - **Tipografía**: `Geist` para texto y `Geist Mono` para números, códigos de licitación y precios (ambas vienen con `next/font`). Títulos en peso 600, nunca 800.
   - **Paleta** (definir como tokens en `globals.css`): fondo `#F7F6F2` (papel), superficie `#FFFFFF`, tinta `#1B1B1B`, tinta secundaria `#5C5955`, borde `#E6E3DC`, **acento único ladrillo `#C4502B`** (botones primarios, links, logo), éxito `#2F6B45` (match alto, "cumple"), alerta `#B7791F` (cierra pronto, "alcanzable"), error `#A3312B`. Sin modo oscuro.
   - **Marca**: wordmark "Luxis" en Geist 600 con tracking ajustado y un cuadrado ladrillo como punto de la i o a la izquierda. Nada de íconos de robot, chispas, cerebros.
   - **reactbits, solo acá**: (1) `SplitText` o `BlurText` en el titular de la landing, (2) `CountUp` en "N licitaciones encontradas" al terminar el onboarding y en el header del dashboard, (3) opcional `ShinyText` en el CTA de la landing. En ningún otro lugar. Sin partículas, sin fondos animados, sin tilt cards.
   - **Prohibido**: gradientes violeta/azul, glassmorphism, blobs, emojis como íconos, sombras enormes, "Powered by AI", skeletons brillantes que ocupan toda la pantalla, hero de 3 columnas con íconos genéricos.
   - Cada pantalla tiene: estado vacío con una acción, estado de carga con mensaje de progreso real ("Analizando pliego…", "Buscando precios históricos…"), estado de error con reintentar.
5. UI en **español rioplatense**. Fechas `dd/MM/yyyy HH:mm`, montos `$ 1.234,56` (UYU) o `US$ 1.234,56`.
6. Nunca simules IA ni muestres datos hardcodeados en `main`: los mocks viven en `src/lib/mocks/**` y se usan solo hasta que existan los datos reales (M2 los elimina).
7. Antes del PR: `npm run lint && npm run build` en verde. Commits convencionales: `feat(ui): ...`. PR con título `M<n>: <nombre>` + mensaje en el canal. seba integra en los sync points (14:45, 17:00, 19:00, 20:30).
8. Si una decisión no está en los docs, elegí la opción más simple que funcione hoy y anotala en el PR.

---

## M0 · Empresa de demo, keywords del rubro y casos de prueba — 14:00 → 15:00

**Branch:** `feat/demo-data` · **Depende de:** nada. **Las keywords se entregan a seba a las 14:45 como máximo** (las necesita para filtrar la ingesta).

**Objetivo:** tener una barraca ficticia creíble con documentos reales para el onboarding, la lista de palabras clave que define "licitación del rubro", y 20 licitaciones reales etiquetadas a mano para medir la IA.

### Archivos a crear
```
src/config/rubro-barraca.ts           # keywords incluir/excluir (ver formato abajo)
demo-assets/empresa.md                 # ficha de la barraca ficticia
demo-assets/lista-precios.xlsx         # 30–40 productos: nombre, unidad, precio UYU sin IVA, stock, marca
demo-assets/carta-presentacion.pdf     # 1 página: quiénes somos, zona, productos, documentación vigente
demo-assets/web/index.html             # mini web (1 página, html plano) con secciones Nosotros / Productos / Contacto
demo-assets/casos-eval.json            # 20 licitaciones reales etiquetadas
demo-assets/guion-pitch-v1.md          # guion de 3 minutos, versión 1
```

### Cómo hacerlo
1. **Barraca ficticia** (no usar nombres de empresas reales): nombre tipo "Barraca Don Aurelio S.R.L.", RUT ficticio de 12 dígitos que empiece con 21, localidad Las Piedras (Canelones), entrega en Canelones, Montevideo, San José y Florida; capacidad 4 camiones/semana; vende cemento portland (bolsa 25 kg y granel), cal, arena fina y terciada (m3), pedregullo y balasto (m3), ladrillo de campo y ticholo (unidad/millar), bloques de hormigón, hierro en varillas (6/8/10/12 mm), malla electrosoldada, alambre, chapas galvanizadas, caños PVC, maderas (tirantes, tablas), yeso y placas, membranas, adhesivos y pastinas, cerámicas básicas. Documentación: RUPE **activo**, DGI y BPS **al día**, BSE **vigente**, UNIT **no tiene**, ISO **no tiene**, se presentó a 2 licitaciones en 2025 (una ganada). Precios de referencia realistas para Uruguay 2026 (buscá precios de barracas en la web para no inventar cifras absurdas).
2. **xlsx** con `exceljs` o `xlsx` (script en `demo-assets/scripts/` o a mano). **pdf** desde un html con `print to PDF` del navegador, prolijo, con logo tipográfico. **web** en html plano con estilos inline simples.
3. **Keywords del rubro** en `src/config/rubro-barraca.ts`, formato:
   ```ts
   export const RUBRO_BARRACA = {
     incluir: [ /* regex sin tildes, mayúsculas; coincidencia por palabra completa */ ],
     excluir: [ /* contextos que no son barraca */ ],
   };
   ```
   Partí de la lista inicial de `docs/02-datos-arce.md` (sección "Filtro de rubro") y **validala contra ARCE**: entrá a https://www.comprasestatales.gub.uy/consultas/buscar/tipo-pub/llamado, buscá por "portland", "ladrillo", "arena", "hierro" y revisá qué descripciones de ítems aparecen y cuáles son falsos positivos (ej. "HIERRO" en medicamentos, "CEMENTO" en odontología, "ARENA" para gatos). Agregá exclusiones. Entregá el archivo a seba por el canal a las 14:45.
4. **Casos de evaluación**: elegí 20 llamados vigentes reales de ARCE (URL de detalle + id): 10 que una barraca claramente puede ofertar, 10 que no (incluí 3 "tramposos": construcción de obra llave en mano, servicios de albañilería, compra de maquinaria). Formato:
   ```json
   [{ "idCompra": "1379023", "url": "https://www.comprasestatales.gub.uy/consultas/detalle/mostrar-llamado/1/id/1379023", "relevante": true, "motivo": "pide 200 bolsas de portland y arena" }]
   ```
5. **Guion v1**: estructura en `docs/05-rubrica-demo-pitch.md` (sección "Guion"). Escribilo en primera persona, con tiempos por bloque.

### Verificación
- Los 3 archivos de la barraca abren bien y cuentan la misma historia (mismos productos, misma documentación).
- `src/config/rubro-barraca.ts` compila y tiene ≥ 40 términos de inclusión y ≥ 15 de exclusión.
- `casos-eval.json` tiene 20 entradas con URLs que abren.

**Entrega:** PR `M0: demo data` a las 15:00 (keywords antes, a las 14:45).

---

## M1 · Identidad, layout, dashboard y detalle (con mocks) — 15:00 → 17:00

**Branch:** `feat/ui-dashboard` · **Depende de:** S0 en `main` (tipos en `src/lib/types.ts`, shadcn inicializado). Si S0 se atrasa, arrancá igual con los tipos de `docs/03-arquitectura.md` copiados en `src/lib/mocks/tipos-temporales.ts` y migrá después.

**Objetivo:** app navegable completa con datos mock que respetan los tipos compartidos: landing, layout con sidebar, dashboard de licitaciones, detalle con tabs, y páginas vacías de calendario y notificaciones.

### Archivos a crear
```
src/app/globals.css                         # tokens de color y tipografía (ver reglas de diseño)
src/app/page.tsx                             # landing: titular, 3 líneas de valor, CTA "Crear cuenta" / "Ingresar"
src/app/(app)/layout.tsx                     # sidebar (Dashboard, Calendario, Notificaciones, Cómo funciona, Cuenta) + topbar con nombre de empresa, campanita y "Actualizar"
src/app/(app)/dashboard/page.tsx             # lista de matches
src/app/(app)/licitaciones/[id]/page.tsx     # detalle con tabs
src/app/(app)/calendario/page.tsx            # placeholder "próximamente" hasta M2
src/app/(app)/notificaciones/page.tsx        # placeholder hasta M2
src/components/marca/logo.tsx
src/components/layout/{sidebar,topbar,campanita}.tsx
src/components/licitaciones/{card-licitacion,filtros,badge-confianza,badge-documentacion,tabla-items,panel-precio,panel-documentacion,panel-fechas,lista-archivos,resumen-ia}.tsx
src/components/ui/estado-vacio.tsx, estado-error.tsx, cargando.tsx
src/lib/mocks/{licitaciones,matches,analisis,precios}.ts   # 8 licitaciones realistas del rubro (usá ejemplos reales de ARCE: "CEMENTO PORTLAND", "ARENA TERCIADA", "LADRILLO DE CAMPO", "VARILLA DE HIERRO")
```

### Cómo hacerlo
1. **Dashboard**: header con `CountUp` "N licitaciones para vos" + sub-línea "M cierran esta semana". Filtros (shadcn `Select`/`ToggleGroup`): confianza mínima (slider 0–100, default 60), tipo de compra (LA/LP/CR/CD/CE), organismo (combobox), cierre (7/15/30 días), estado (nuevas / guardadas / descartadas / todas). Orden: por cierre más próximo, por confianza, por monto estimado. Lista de **cards** (no tabla): título = objeto, línea 2 = organismo · tipo y número · "cierra en 4 días (22/10 10:00)", resumen IA de 2 líneas, chips de ítems ofertables (máx 4 + "+3"), `badge-confianza` (número grande con color por rango: ≥75 verde, 50–74 ámbar, <50 gris) y `badge-documentacion` (Cumple / Falta algo alcanzable / Falta algo difícil). Acciones: Guardar, Descartar, Ver detalle.
2. **Detalle**: encabezado (objeto, organismo, tipo/número, estado, fechas clave en línea, botones Guardar/Descartar/"Marcar presentada"). Tabs:
   - **Resumen IA**: `resumen-ia` (resumen, por qué matchea, confianza con explicación, riesgos, aviso "basado solo en metadata" si corresponde).
   - **Ítems y precio**: `tabla-items` (nro, descripción, cantidad, unidad, "lo vendés" ✓/✗, producto tuyo asociado) + `panel-precio` por ítem con historial: n adjudicaciones, p25 / mediana / p75, **precio sugerido** destacado en Geist Mono, último ganador y fecha, competencia frecuente (3 nombres con veces), nota "precios sin IVA, últimos 24 meses, misma unidad y moneda". Si no hay historial: "Sin historial para este artículo" + sugerencia de usar precio de lista.
   - **Documentación**: `panel-documentacion` checklist: documento requerido, obligatorio, sección del pliego, tu estado (tenés / no tenés), "¿llegás antes del cierre?" (sí / justo / no, con días estimados).
   - **Fechas**: `panel-fechas` lista cronológica (publicación, consultas hasta, prórroga hasta, visita, apertura/recepción de ofertas, entrega) con íconos y "faltan N días".
   - **Chat**: contenedor vacío con `// rafa monta aquí <ChatPliego idCompra={id} />`.
   - **Archivos**: `lista-archivos` con nombre, tipo (pliego particular / general / formulario / planilla / plano / otro), tamaño, estado de extracción (ok / no soportado / error) y link al original en ARCE.
3. **Landing** (`/`): titular (reactbits `SplitText`): "Vendele al Estado sin leer 80 páginas de pliego." Sub: "Luxis encuentra las licitaciones donde tu barraca puede ganar, te dice a qué precio y qué papeles te faltan." CTA primario "Crear cuenta", secundario "Ingresar". Debajo, 3 bloques de texto corto (Encontrá · Cotizá · Presentate) sin íconos decorativos. Footer con "Datos: ARCE, datos abiertos de Uruguay".
4. Todo con Server Components leyendo de `src/lib/mocks/**` a través de las mismas funciones que después expone seba (`listarMatches`, `obtenerDetalle`): creá `src/lib/mocks/consultas.ts` con esas firmas exactas (ver `docs/03-arquitectura.md` → Contratos) para que en M2 solo cambie el import.

### Verificación
- Navegación completa sin errores de consola; `npm run build` verde; se ve bien a 1280 px y a 390 px (sidebar colapsa a menú).
- Un tercero entiende en 10 segundos qué licitación conviene y por qué (confianza + precio + documentación visibles sin scroll en la card).

**Entrega:** PR `M1: UI dashboard y detalle` a las 17:00.

---

## M2 · Conectar datos reales, notificaciones, calendario, "Analizar por URL" — 17:00 → 19:00

**Branch:** `feat/ui-real` · **Depende de:** S1 (datos en DB), S2 (matches y precios) y S3 (análisis) en `main`. Trabajá en este orden y si algo no está, seguí con lo siguiente.

### Archivos
```
src/app/(app)/dashboard/page.tsx, licitaciones/[id]/page.tsx   # reemplazar import de mocks por src/server/consultas/*
src/server/notificaciones/generar.ts     # generarNotificaciones(empresaId): inserta en `notificaciones` (sin duplicar: unique por empresa+tipo+id_compra+dia)
src/server/notificaciones/consultas.ts   # listar, marcar leída, contar no leídas
src/components/layout/campanita.tsx       # badge con no leídas, popover con las 5 últimas
src/app/(app)/notificaciones/page.tsx     # lista completa con filtros por tipo, marcar todas leídas
src/app/(app)/calendario/page.tsx         # vista mensual (grilla simple propia con date-fns, sin librería de calendario) + lista lateral "próximos 14 días"
src/components/calendario/{grilla-mes,lista-eventos}.tsx
src/components/licitaciones/analizar-url.tsx   # input "Pegá una URL o ID de ARCE" → POST /api/licitaciones/analizar-url (stream NDJSON, ver docs/03 §5) → muestra cada etapa (Buscando en ARCE → Leyendo el pliego → Analizando con IA → Comparando con tus productos → Precios históricos) y al recibir { listo, idCompra } redirige al detalle
src/lib/mocks/**                          # ELIMINAR al final de M2
```

### Reglas de notificaciones (todas in-app, nada de email)
| tipo | cuándo | título |
|---|---|---|
| `nuevo_match` | match con confianza ≥ 70 creado en las últimas 24 h | "Nueva licitación para vos: {objeto corto}" |
| `cierre_proximo` | recepción de ofertas en ≤ 48 h y match ≥ 50 no descartado | "Cierra en {n} h: {objeto corto}" |
| `visita_proxima` | fecha de visita en ≤ 72 h | "Visita obligatoria el {fecha}: {objeto corto}" |
| `aclaracion` | nueva aclaración publicada en una licitación guardada | "Nueva aclaración en {objeto corto}" |
| `doc_alcanzable` | gap documental con `alcanzable_antes_cierre = true` en match ≥ 70 | "Te falta {documento}, pero llegás: cierra el {fecha}" |

`generarNotificaciones` la llama seba al final de cada refresh y del matching; también exponé un botón "Actualizar" en la topbar que llame a `POST /api/ingesta/refresh` y después a la generación.

### Calendario
Eventos desde `listarEventos(empresaId, desde, hasta)` (contrato en `docs/03`): tipos `apertura` (cierre de ofertas), `consultas`, `prorroga`, `visita`, `entrega`. Colores: apertura ladrillo, visita ámbar, consultas gris, entrega verde. Click → detalle. Solo licitaciones con match no descartado.

### Verificación
- Dashboard y detalle muestran datos reales de la empresa demo (nada de mocks en `main`).
- "Actualizar" genera notificaciones y la campanita muestra el número.
- Calendario muestra los cierres de las próximas 2 semanas.
- Pegar una URL nueva de ARCE en "Analizar por URL" termina en un detalle con análisis.

**Entrega:** PR `M2: UI con datos reales` a las 19:00.

---

## M3 · "Cómo funciona la IA", pulido, guion final y video de respaldo — 19:00 → 20:30

**Branch:** `feat/ui-pulido`

1. **`/app/como-funciona`**: página de texto claro con 5 bloques: qué hace cada componente de IA (perfil, matching, lectura del pliego, precio histórico, chat), qué datos usa (ARCE XML + web + pliegos), **limitaciones declaradas** (precios sin IVA; no hay ofertas perdedoras, por eso es "precio ganador histórico" y no probabilidad; pliegos escaneados no se leen; Compras Directas sin llamado publicado no aparecen; la IA puede equivocarse: por eso nunca descarta sola), y **cobertura** con números reales leídos de la DB (licitaciones vigentes del rubro, adjudicaciones históricas, artículos con historial de precio, pliegos leídos). Si seba entrega el resultado de `casos-eval.json`, agregá precisión/recall.
2. **Pulido**: revisar todos los estados vacíos/carga/error, textos, foco de teclado, contraste. Pasar `npm run lint`.
3. **Guion final** en `docs/05-rubrica-demo-pitch.md` con tiempos y quién habla; ensayarlo con cronómetro.
4. **Video de respaldo**: grabar la demo completa (OBS o grabador del navegador), 2:30 min, sin audio o con voz en off. Guardarlo fuera del repo y subirlo al canal del equipo.

**Entrega:** PR `M3: cómo funciona + pulido` a las 20:30. Después, freeze.

---

## Si te trabás

- shadcn: `npx shadcn@latest add <componente>`; componentes en `src/components/ui/` (ya inicializado por seba en S0).
- reactbits: copiá el componente desde reactbits.dev (versión TS + Tailwind) a `src/components/reactbits/<nombre>.tsx`; si pide `gsap` o `motion`, instalalo (`npm i motion`).
- Tipos y contratos: `src/lib/types.ts` y `docs/03-arquitectura.md`. Si necesitás un campo que no existe, pedíselo a seba; no lo inventes en el tipo.
- Datos reales no aparecen: verificá que `.env.local` apunte a la DB compartida y que seba haya corrido el backfill; mientras tanto seguí con el siguiente bloque.
