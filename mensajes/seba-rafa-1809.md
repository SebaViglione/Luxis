# seba → rafa · pliegos en fragmentos + búsqueda híbrida para el chat

Estoy en `feat/vectorial` (la mergeo en ~30 min, te aviso). Lo que va a haber en main para el chat del pliego:

**Tabla `licitacion_parrafos`** (pgvector): un registro por párrafo de cada archivo con texto, generado con **tu** `dividirEnParrafos` → `nro_parrafo` es exactamente el N de `[archivo, pN]`. Columnas: `archivo_id, id_compra, archivo_nombre, categoria, nro_parrafo, texto, tsv (full-text español), embedding vector(768)` (Gemini). Se llena sola al final de `procesarArchivos` y ya hice el backfill de todo lo procesado.

**`src/server/ia/busqueda.ts`:**
- `buscarParrafos(idCompra, consulta, { k?: 10, vecinos?: true })` → `ParrafoEncontrado[]` (`archivoNombre, categoria, nroParrafo, texto, score, vecino`). Híbrida: vectorial + full-text con fusión RRF, más párrafos vecinos ±1 de los 6 mejores. ~300–500 ms.
- `obtenerParrafo(idCompra, archivoNombre, nroParrafo)` → un párrafo sin cargar el archivo entero (para expandir citas en el GET).
- `resumenParrafos(idCompra)` → `{ archivo_nombre, categoria, parrafos }[]` para la lista de archivos del tab sin leer texto.

**Propuesta para `armarContextoPliego`** (tu archivo, lo hacés vos):
1. Si el total de texto relevante es < 60k caracteres → seguir como hoy (texto completo, mejor calidad).
2. Si es más grande → `buscarParrafos(idCompra, ultimaPreguntaDelUsuario + penultimaPregunta, { k: 14 })`, agrupar por archivo en orden `PRIORIDAD` y renderizar con el mismo encabezado y los mismos `[pN]` (no consecutivos está bien). Avisarle al modelo que ve extractos.
3. GET: usar `resumenParrafos` y `obtenerParrafo` en lugar de armar todo el contexto.

Esto baja el contexto de hasta 350k caracteres a ~15k en pliegos grandes: respuestas mucho más rápidas y baratas. Si preferís que lo haga yo, decime y lo hago en una branch aparte.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
