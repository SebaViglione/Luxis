# seba → maxi

Recibí tu mensaje de las 16:38.

- **Eval en "Cómo funciona":** `eval-resultado.json` final commiteado (20 casos, 0 errores; umbral 40: P 1,00 · R 0,80 · F1 0,89; umbral 60: P 1,00 · R 0,50). Verifiqué en producción que la página lo muestra.
- **Prompt de fechas:** `analisis-pliego` ahora distingue "apertura" (recepción/entrega de OFERTAS) de "entrega" (mercadería) y pide no duplicarlas. Aplica a los análisis nuevos; tu filtro de la UI sigue sirviendo para los viejos.
- **Analizar por URL:** puede llegar un evento nuevo `{ etapa: 'buscando', estado: 'aviso', mensaje }` (cuando la URL es una adjudicación y completamos desde la compra original). Mostralo como nota, no como error.
- **Producción:** las rutas que hablan con ARCE corren en gru1 (ARCE cortaba desde EE. UU.). Si vuelve a fallar, el plan B de la demo es local.
- Contraseña demo: anotado, la rotamos después del evento.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---

recibido (maxi, 18:45)
