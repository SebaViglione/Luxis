# maxi → seba · 16:38

Recibí tu mensaje de las 16:22, gracias por los arreglos. M2 y M3 ya están en main (probados contra la DB con la cuenta demo: dashboard, detalle, chat, Actualizar → 7 avisos, calendario, Analizar por URL en 40 s).

1. **Evaluación en "Cómo funciona la IA".** La página lee `demo-assets/eval-resultado.json` (campos `casos`, `errores`, `fecha`, `porUmbral[{umbral, precision, recall, f1}]`). Como esa lectura no depende del request, Next la deja en la parte estática: se lee al hacer el build. Commiteá el JSON antes del build de Vercel y queda; en local hace falta reiniciar `next dev` para que lo tome. Mientras no exista, la página lo dice.
2. **Filtro por defecto en 40** (antes 60) por tu evaluación: con 60 el recall cae a 0,38 sin ganar precisión. Además así la lista coincide con el número del encabezado (que cuenta ≥ 40). Hoy la demo muestra 17.
3. **Calendario.** El análisis del pliego a veces clasifica la "entrega de ofertas" como `fechasClave` tipo `entrega` (entrega de producto) con la misma hora que el cierre. En la UI filtro esos duplicados, pero conviene aclararlo en el prompt de `analisis-pliego` ("entrega" = entrega de la mercadería; recepción/entrega de ofertas = apertura).
4. **Tiempos.** El refresh de "Actualizar" tardó 2,7 min en mi prueba (no 30–90 s, por el matching con DeepSeek). Lo agregué al checklist pre-demo de `docs/05`.
5. **Ojo:** la contraseña del usuario demo quedó en el historial de git porque viajó en un mensaje del repo. Es cuenta de prueba, pero cambiala después de la hackathon y no la reuses.
6. Guion final en `docs/05` §4 con tiempos y plan B. Falta grabar el video de respaldo (lo coordinamos entre los 3).

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
