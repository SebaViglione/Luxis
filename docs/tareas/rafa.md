# Brief para el agente de rafa (Claude Code o Kiro)

> Sirve para Claude Code y para Kiro. Para cada tarea, abrí una conversación nueva con el agente y pedile que ejecute **solo esa tarea** siguiendo este archivo. Una tarea por conversación.

## Quién sos y qué estás construyendo

Sos el agente de código (Claude Code o Kiro) de **rafa**, integrante de un equipo de 3 (seba, rafa, maxi) que construye **Luxis** en una hackathon de 1 día: un analizador de licitaciones públicas de Uruguay (portal ARCE) para **barracas de materiales de construcción**. La IA es el centro del producto: perfila a la empresa, encuentra licitaciones donde puede vender, lee el pliego, calcula el precio ganador histórico y responde preguntas sobre el pliego.

Tu parte: **autenticación y registro, onboarding de la empresa (perfil por documentos o entrevista por chat), chat con el pliego y, si da el tiempo, la entrevista por voz**.

Leé antes de empezar: `docs/01-prd.md` (qué se construye), `docs/03-arquitectura.md` (stack, schema de DB, contratos entre módulos, carpetas que te pertenecen), `.kiro/steering/luxis.md` (convenciones).

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
- Usuarios de prueba: creá los tuyos desde `/registro` con un email tipo `rafa+1@luxis.test` (la confirmación de email está desactivada en Supabase).
- Si usás **Claude Code**: abrí el repo y decile "leé `docs/tareas/<tu nombre>.md` y ejecutá la tarea X siguiendo las reglas". `CLAUDE.md` ya tiene el contexto. Si usás **Kiro**: `.kiro/steering/luxis.md` carga el contexto solo; pegá el bloque de la tarea.

---

## Reglas duras

1. **Antes de tocar cualquier archivo**, creá la branch de la tarea:
   ```bash
   git checkout main && git pull && git checkout -b <branch de la tarea>
   ```
2. Solo editás tus carpetas (ver "Propiedad de carpetas" en `docs/03-arquitectura.md`): `src/lib/supabase/**`, `src/app/(auth)/**`, `src/app/(onboarding)/**`, `src/app/(app)/cuenta/**`, `src/server/onboarding/**`, `src/server/ia/chat-pliego.ts`, `src/server/ia/perfil.ts`, `src/app/api/onboarding/**`, `src/app/api/chat/**`, `src/components/chat/**`, `src/components/onboarding/**`, `src/components/voz/**`, `src/proxy.ts`. Si necesitás una columna nueva en la DB o un tipo compartido, **no lo agregues**: pedíselo a seba por el canal del equipo.
3. Stack fijo: Next.js 16 (App Router, Server Actions), TypeScript estricto, Tailwind 4, shadcn/ui, Drizzle ORM, Supabase Auth (`@supabase/ssr`), Vercel AI SDK (`ai` + `@ai-sdk/anthropic`). No agregues otros frameworks de UI ni ORMs.
4. Toda la UI en **español rioplatense**, textos claros, mensajes de progreso y de error visibles. Diseño: componentes shadcn/ui, sin gradientes genéricos ni emojis como íconos (usar `lucide-react`).
5. Nunca simules IA: nada de respuestas hardcodeadas. Si algo falla, mostrá el error y una acción para reintentar.
6. Secretos solo en `.env.local` (nunca en el código ni en commits). Variables: ver `docs/03-arquitectura.md`.
7. Antes de abrir el PR: `npm run lint && npm run build` en verde. Commits convencionales: `feat(auth): ...`, `fix(onboarding): ...`.
8. Entrega = PR a `main` con título `R<n>: <nombre>` + mensaje en el canal del equipo. seba integra en los sync points (14:45, 17:00, 19:00, 20:30).
9. Si una decisión no está en los docs, elegí la opción más simple que funcione hoy y anotala en el PR. No bloquees esperando respuesta.

---

## R0 · Claves de IA y agente de voz (sin código) — 14:00 → 14:30

**Objetivo:** tener las claves de los servicios de IA. **Supabase y Vercel los configura seba (tarea S0)**: no crees proyectos ahí.

**Pasos (los hace rafa a mano, Kiro no interviene):**
1. **Anthropic**: crear API key en console.anthropic.com y cargar USD 5–10. Si nadie tiene tarjeta: crear key gratuita de Google AI Studio (Gemini) y avisar a seba para activar el fallback.
2. **ElevenLabs**: activar plan Starter. En *Agents* crear el agente "Entrevistadora Luxis" con el prompt de la tarea R3 (más abajo), idioma español, voz femenina neutra rioplatense si existe, LLM el más barato disponible (Haiku o Flash). Copiar `AGENT_ID` y la `API key`.
3. Pasar a seba las claves por canal privado (nunca por el repo). seba arma el `.env.local` completo (incluye Supabase) y lo reparte.

**Verificación:** una llamada de prueba con `curl` a la API de Anthropic responde 200; el agente de ElevenLabs contesta en el playground del dashboard (máx. 1 minuto de prueba).

---

## R1 · Auth, registro, cuenta y onboarding por chat — 14:45 → 17:00

**Branch:** `feat/auth-onboarding` · **Depende de:** S0 mergeado en `main` (schema, tipos, proyecto de Supabase creado por seba y `.env.local` repartido). Si S0 no está, empezá por la UI de login/registro con los formularios y conectá después.

**Objetivo:** un usuario nuevo se registra, crea su empresa, carga documentos/URL o responde una entrevista por chat, y termina con un **perfil estructurado** guardado en DB (`empresas.perfil_json`, `empresa_productos`, `empresa_documentos`). Luego puede editar todo en "Tu perfil" y sus datos de usuario en "Cuenta".

### Archivos a crear
```
src/lib/supabase/client.ts        # createBrowserClient
src/lib/supabase/server.ts        # createServerClient con cookies (Next 16: await cookies())
src/proxy.ts                      # refresca sesión y protege /app/** y /onboarding/** (Next 16 usa proxy.ts en lugar de middleware.ts)
src/app/(auth)/login/page.tsx
src/app/(auth)/registro/page.tsx
src/app/(auth)/recuperar/page.tsx
src/app/(auth)/actions.ts         # signIn, signUp, signOut, resetPassword (server actions)
src/app/(app)/cuenta/page.tsx     # editar nombre, email, contraseña; editar datos de empresa; cerrar sesión; eliminar cuenta (soft)
src/app/(onboarding)/onboarding/page.tsx          # wizard con 3 pasos
src/components/onboarding/paso-empresa.tsx         # nombre, RUT, departamento, web, teléfono
src/components/onboarding/paso-fuentes.tsx         # subir archivos (pdf/docx/xlsx/html/txt, máx 10 MB c/u) y/o URL de la web
src/components/onboarding/paso-entrevista.tsx      # chat con la IA (useChat del AI SDK)
src/components/onboarding/resumen-perfil.tsx       # muestra el perfil extraído, editable, botón "Confirmar"
src/server/onboarding/extraer-texto.ts             # pdf→unpdf, docx→mammoth, xlsx→xlsx, html→cheerio (texto), txt
src/server/onboarding/fetch-web.ts                 # descarga la URL (UA de navegador), extrae texto visible, sigue hasta 3 links internos (/productos, /nosotros, /catalogo)
src/server/ia/perfil.ts                            # extraerPerfil(textos[]) y entrevista (system prompt + tool guardar_perfil)
src/app/api/onboarding/extraer/route.ts            # POST multipart → textos → extraerPerfil → guarda perfil parcial
src/app/api/onboarding/entrevista/route.ts         # POST { messages } → streamText con tools
src/server/onboarding/guardar-perfil.ts            # upsert en empresas / empresa_productos / empresa_documentos
```

### Cómo hacerlo
1. **Auth**: seguir la guía oficial de `@supabase/ssr` para Next.js App Router (cliente de navegador, cliente de servidor, `proxy.ts`). Al registrarse: `signUp` → crear fila en `perfiles_usuario` y `empresas` (estado_onboarding = `pendiente`) → redirigir a `/onboarding`. Al loguearse: si `estado_onboarding != 'completo'` → `/onboarding`, si no → `/app/dashboard`. Rutas protegidas: todo bajo `/app` y `/onboarding`.
2. **Formularios** con shadcn `Form` + `zod`. Mensajes de error en español ("El email ya está registrado", "Contraseña mínima 8 caracteres").
3. **Paso fuentes**: el usuario puede subir archivos, pegar URL, ambos o ninguno ("No tengo documentos, prefiero responder preguntas"). Al enviar: mostrar progreso "Leyendo documentos… / Extrayendo productos…". Llamar a `extraerPerfil` (Claude Sonnet 5.5, `generateObject` con el schema `PerfilEmpresa` de `src/lib/types.ts`). El resultado es un **perfil parcial** con `campos_faltantes[]`.
4. **Paso entrevista**: chat con `useChat` contra `/api/onboarding/entrevista`. El system prompt recibe el perfil parcial y la lista de faltantes y **solo pregunta lo que falta**, de a una pregunta, en tono cercano. Expone una tool `guardar_perfil(perfil)` que el modelo llama cuando tiene todo; el backend persiste y responde con `{ listo: true }` para que la UI pase al resumen. Máximo 8 preguntas; si el usuario dice "listo" o "no sé", cerrar con lo que hay.
   - Preguntas que debe cubrir si no están en los documentos: qué vende (lista de productos con unidad), si vende a granel/por bolsa/pallet, zonas donde entrega (departamentos), capacidad de entrega semanal aproximada, si tiene RUPE activo, certificado DGI y BPS al día, BSE, certificaciones UNIT/ISO, si ya se presentó a licitaciones, tipos de organismos que le interesan, monto mínimo que le vale la pena.
5. **Resumen perfil**: tabla editable de productos (nombre, categoría, unidad, precio referencia, moneda), chips de zonas, checklist de documentación (RUPE/DGI/BPS/BSE/UNIT/ISO/otros con estado vigente / en trámite / no tiene), descripción corta generada. Botón "Confirmar y buscar licitaciones" → marca `estado_onboarding = 'completo'`, llama a `POST /api/empresas/matching` (lo expone seba en S2; si aún no existe, redirigí igual al dashboard) y redirige a `/app/dashboard`.
6. **Cuenta** (`/app/cuenta`): tabs "Usuario" (nombre, email, cambiar contraseña, cerrar sesión) y "Empresa" (mismos campos del perfil, reutilizar `resumen-perfil.tsx` en modo edición). Guardar con server actions.

### Prompt base para `extraerPerfil` (ajustalo, no lo recortes)
```
Sos un analista que arma el perfil comercial de una barraca de materiales de construcción de Uruguay a partir de documentos y/o su web.
Devolvé SOLO el objeto JSON del schema. Reglas:
- productos: uno por línea comercial real (ej. "Cemento Portland bolsa 25 kg", "Ladrillo de campo", "Arena terciada m3"). Normalizá unidad (bolsa, unidad, m3, kg, tonelada, m2, metro, rollo, litro). Si hay precio, copialo con su moneda; si no, null.
- documentacion: marcá vigente solo si el texto lo afirma; si no se menciona, estado "desconocido".
- zonas_entrega: departamentos de Uruguay mencionados.
- campos_faltantes: lista de campos que NO pudiste completar con evidencia.
- No inventes. Si dudás, dejá null y agregalo a campos_faltantes.
```

### Verificación
- Registro nuevo → onboarding → subir `demo-assets/lista-precios.xlsx` + `carta-presentacion.pdf` → el perfil muestra ≥ 20 productos con unidad y la documentación detectada; confirmar → dashboard.
- Registro nuevo sin documentos → la entrevista llega a un perfil con ≥ 8 productos en ≤ 8 preguntas.
- Cerrar sesión, loguear de nuevo → entra directo al dashboard. `/app/dashboard` sin sesión → redirige a `/login`.
- `npm run build` verde.

**Entrega:** PR `R1: auth + onboarding` antes de las 17:00.

---

## R2 · Chat con el pliego — 17:00 → 19:00

**Branch:** `feat/chat-pliego` · **Depende de:** S1 (texto de pliegos en `licitacion_archivos.texto`) y M1 (tab "Chat" en el detalle). Si M1 no está, montá el componente en una página temporal `/app/licitaciones/[id]/chat`.

**Objetivo:** en el detalle de una licitación, un chat que responde preguntas sobre el pliego **citando la sección/archivo** de donde sale la respuesta, y que dice "no está en el pliego" cuando no está.

### Archivos
```
src/server/ia/chat-pliego.ts          # arma el contexto y el system prompt
src/app/api/chat/pliego/route.ts      # POST { idCompra, messages } → streamText (Sonnet 5.5)
src/components/chat/chat-pliego.tsx   # UI: lista de mensajes, input, sugerencias iniciales, estado "pensando", citas plegables
```

### Cómo hacerlo
1. Contexto = metadata de la licitación (objeto, organismo, fechas, ítems) + texto de los archivos con `relevante = true`, cada uno precedido por `=== ARCHIVO: <nombre> ===` y con los párrafos numerados `[p12]` para poder citar. Límite total 350.000 caracteres; si se pasa, priorizar pliego particular → aclaraciones → formularios → resto, y truncar avisando en el system prompt.
2. System prompt: "Respondés solo con información del pliego y los datos de la licitación. Cada afirmación lleva cita `[archivo, pN]`. Si no está, decilo y sugerí a quién consultar (email de contacto si existe). Respondé en español, conciso, en viñetas cuando enumeres requisitos. Nunca inventes fechas ni montos."
3. Activar prompt caching del proveedor para el bloque del pliego (ver docs del AI SDK para `providerOptions.anthropic.cacheControl`), así las repreguntas salen baratas.
4. Sugerencias iniciales (chips): "¿Qué documentación tengo que presentar?", "¿Hay visita obligatoria?", "¿Cuál es el plazo de entrega?", "¿Piden muestras o garantía?", "¿Cómo se cotiza, con o sin IVA?".
5. Guardar mensajes en `chat_mensajes` (empresa_id, id_compra) para que al volver se vea el historial.
6. Entrada por voz opcional en el input (Web Speech API, solo Chrome): botón micrófono que dicta al textarea. No consume ElevenLabs.

### Verificación
- En 3 licitaciones distintas con pliego extraído, las 5 sugerencias devuelven respuestas con citas y sin inventar.
- En una licitación con `basado_en = 'metadata'` (sin pliego), el chat avisa que no tiene el pliego y responde solo con metadata.
- `npm run build` verde. PR `R2: chat con el pliego` antes de las 19:00.

---

## R3 · Entrevista por voz con ElevenLabs — 19:00 → 20:15 (stretch, timebox estricto)

**Branch:** `feat/voz` · **Depende de:** R1 mergeado. **Si a las 20:15 no funciona de punta a punta, se cierra el PR sin mergear y se usa el chat.**

**Objetivo:** en el paso entrevista, botón "Hablar con Luxis" que abre una conversación de voz con el agente de ElevenLabs; al terminar, el transcript se manda a `/api/onboarding/extraer` (modo texto) y se obtiene el mismo perfil que con el chat.

### Cómo hacerlo
1. `npm i @elevenlabs/react@^1.18`. Usar `useConversation` con **conversation token** (agente privado): crear `src/app/api/voz/token/route.ts` que pide el token a `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=...` con `xi-api-key` del servidor. Nunca exponer la key al cliente.
2. Pasar `dynamicVariables` con lo que ya se sabe del perfil (nombre de empresa, productos detectados, campos faltantes) para que el agente no pregunte lo que ya tiene.
3. Acumular `onMessage` (transcripciones de usuario y agente) en estado; al `endSession`, POST del transcript a `/api/onboarding/extraer` (campo `texto`) → perfil → pantalla resumen.
4. UI: estado de conexión, indicador de que escucha/habla, botón terminar, **contador de duración visible** y corte automático a los 4 minutos (cuidar los 75 minutos del plan).
5. Fallback: si falla el token o el micrófono, mostrar "Voz no disponible, seguimos por chat" y volver al chat.

### Prompt del agente (cargarlo en el dashboard de ElevenLabs en R0)
```
Sos Luxis, asistente que entrevista en español rioplatense al dueño o encargado de una barraca de materiales de construcción en Uruguay para armar su perfil y buscarle licitaciones del Estado. Tono cercano y breve: una pregunta por turno, frases cortas, sin tecnicismos.
Ya sabés: {{perfil_conocido}}. Falta: {{campos_faltantes}}. Preguntá SOLO lo que falta, en este orden de prioridad: productos que vende y en qué unidad (bolsa, m3, unidad, kg), si entrega a granel o paletizado, departamentos donde entrega, capacidad semanal aproximada, si tiene RUPE activo, certificados DGI y BPS al día, seguro BSE, certificaciones UNIT o ISO, si ya se presentó a licitaciones, y monto mínimo que le vale la pena.
Confirmá cada dato repitiéndolo en una frase corta. Si la persona no sabe, seguí. Cuando tengas lo esencial o pasen 6 preguntas, cerrá: "Listo, con esto ya puedo buscarte licitaciones" y despedite.
```

### Verificación
- Una entrevista de 2 minutos produce un perfil con productos y documentación; el contador corta a los 4 min.
- Con la key quitada del `.env.local`, el botón muestra el fallback y el chat sigue funcionando.

---

## Si te trabás

- **Supabase cookies en Next 16**: `cookies()` es async; seguir el snippet oficial de `@supabase/ssr` para App Router. Protección de rutas en `src/proxy.ts` (equivalente a middleware).
- **AI SDK v7**: `useChat` viene de `@ai-sdk/react`; la ruta devuelve `result.toUIMessageStreamResponse()`. Tools con `tool({ inputSchema: z.object(...) })`.
- **Archivos grandes**: limitar a 10 MB y 5 archivos; mostrar error claro.
- **Modelo**: ids en `src/lib/ia/modelos.ts` (seba). No hardcodees nombres de modelo en tus archivos.
- Cualquier cambio de schema o tipo compartido → pedir a seba. Cualquier duda de UI → preguntar a maxi (dueño del diseño).
