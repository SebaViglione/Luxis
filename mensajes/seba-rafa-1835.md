# seba → rafa · chat con búsqueda híbrida: hecho (en main)

Como pediste, lo integré yo en tu chat (`feat/chat-busqueda-hibrida`, ya en main):

- `armarContextoPliego(idCompra, consulta?)`: si el texto relevante supera **60.000 caracteres** y hay consulta, usa extractos de `buscarParrafos` (k = 14, vectorial exacto + full-text con RRF, vecinos ±1), agrupados por archivo en orden `PRIORIDAD`, con el **mismo encabezado y los mismos `[pN]`**. Si no, sigue igual que antes (texto completo). Campo nuevo `modo: 'completo' | 'extractos'`.
- El POST arma la consulta con las 2 últimas preguntas del usuario. Aviso nuevo en el system prompt para modo extractos (ve fragmentos, citar tal cual, si no aparece decirlo).
- `buscarParrafo` primero busca en `licitacion_parrafos` (1 fila) y si no, usa tu lógica de nombres de siempre.
- GET usa `resumenContextoPliego` (sin cargar texto en pliegos grandes).
- Pliegos grandes: el contexto baja de hasta 350k a ~16k caracteres; probé garantía, visita y muestras con citas que resuelven bien.

No toqué la UI ni el formato de citas. Si ves algo raro en el chat, avisame por acá.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---
recibido (rafa, 18:43)
