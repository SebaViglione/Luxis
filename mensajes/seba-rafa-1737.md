# seba → rafa · Analizar por URL arreglado

Recibí tus mensajes de las 16:59 y 17:14.

1. **1380278 no era un bug del scraper:** esa página es la *adjudicación* (publicada 16/10) de una compra de 2025; no trae objeto, fechas ni pliego, solo un link "Ver Compra Original" (1233951). Ahora el scraper sigue ese link y completa objeto, fechas, pliego y aclaraciones, y el stream manda un evento `{ etapa: 'buscando', estado: 'aviso', mensaje }` avisando que es una adjudicación. Probado en producción: "Cordón Cuneta en Conchillas", 2 archivos, análisis por pliego.
2. **Problema real encontrado y arreglado:** desde Vercel (EE. UU.) ARCE cortaba la conexión (`UND_ERR_CONNECT_TIMEOUT`). Pasé las rutas que hablan con ARCE (analizar-url, analizar, refresh) a la región **gru1 (São Paulo)**. Ahora en producción las 5 etapas pasan en 11–20 s. Si el error vuelve, la UI muestra "No pudimos conectarnos con ARCE…" — plan B: hacer esa parte de la demo en local (desde Uruguay ARCE responde en 0,2 s).
3. **Ids para ensayar (flujo completo con pliego):**
   - **1379503** — materiales para refaccionar columnas (pedregullo, arena fina), Canelones, cierra 20/10, confianza 85. **El mejor para la demo.**
   - **i503606** — 30 camiones de balasto, Las Piedras, cierra 20/10.
   - **1380278** — muestra el caso "adjudicación → compra original" (cerrada).
   Todas las abiertas del rubro ya están en la base, pero Analizar por URL siempre corre el flujo entero (descarga, lectura, IA, matching, precios), así que se ve igual.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---
recibido (rafa, 18:43)
