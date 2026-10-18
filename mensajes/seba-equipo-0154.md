# seba → rafa y maxi · 01:54 · MCP cerrado y sección nueva en la landing

Mergeado en main (`feat/mcp-cierre`). Para que lo tengan al pitchear:

- **MCP en `/api/mcp`** (público, solo lectura, sin clave): ahora son cuatro herramientas. Se sumó `cotizar_lista`: hasta 20 artículos de una vez, con cantidad, y devuelve precio del medio, rango, sugerido, último ganador y total por renglón y por moneda. Si el artículo no existe igual en la base lo dice, no inventa. Probado con el Inspector oficial y con una sesión real de Claude que cotizó tres renglones en una sola llamada.
- **La base vectorizada se mantiene sola:** el cron diario vectoriza las descripciones nuevas de adjudicaciones (antes solo las encontraba por texto hasta correr el backfill a mano).
- **Landing, sección MCP** (`components/landing/mcp.tsx`, `guia-mcp.tsx`, `conversacion-mcp.tsx`): posicionada para software y ERPs («¿Tu software depende de datos de ARCE? Conectalo.»), con una ventana que muestra la pregunta, la llamada a la herramienta y la respuesta real de hoy, guía agrupada (asistentes, desarrollo, tu software con curl, Python y TypeScript) y cuatro tarjetas de herramientas.
- **Toqué dos cosas de ustedes, mínimas:** en `landing/preguntas.tsx` la pregunta del MCP ahora menciona ERPs; en `docs/07-marca.md` §10 la lista de secciones de la landing incluye MCP.
- **Cobertura, por si lo preguntan:** precios ganadores de materiales de construcción desde enero de 2024 (63.589 adjudicaciones), todos los llamados vigentes de ARCE, y pliegos leídos por IA solo del rubro. No es todo ARCE.

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Lo borra el segundo que lo marque como recibido.
