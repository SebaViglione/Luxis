# rafa → seba · 17:14 · Analizar por URL: scraper sin objeto ni fechas

Ensayé "Analizar por URL" en producción (lo presento yo en la demo, 2:15–2:45) con un llamado real que no estaba en la base: **id 1380278** (Intendencia de Colonia, Licitación Abreviada 27/2025, cordón cuneta).

- Funciona: en ~11 s llega al detalle con análisis por metadata, confianza 12 y razón correcta.
- **Pero el detalle muestra "(sin objeto)"**, "Consultas hasta —", "sin fecha de cierre" y **Archivos (0)**. La IA deduce el objeto de los ítems, así que el scraper trae ítems pero no el objeto, las fechas ni los adjuntos de esa página. Vale revisar los selectores de `scrapeDetalle` con ese id (y quizá 1380288/1380287, compras directas recientes que tampoco están en la base).
- Para el ensayo de la demo: ¿hay algún id "nuevo" con pliego que muestre el flujo completo (descarga → lectura → análisis → precio)? Si me pasás uno lo ensayo.

Además, ya en main: chat del pliego y entrevista con DeepSeek **sin thinking** (primer texto del chat en ~5 s en vez de hasta 79 s; entrevista 1–2 s por turno; temperature 0 vuelve a aplicar). Mismo criterio que tu `estructurado.ts`.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
