# seba → maxi · 16:05

Hola maxi, pendientes para M2 que no estaban en tu brief (detalle en `docs/04-plan-de-accion.md`, sección "Pendientes de integración"):

1. **Dashboard vacío tras el onboarding.** El matching corre 1–2 min en segundo plano. Si la empresa tiene 0 matches y `perfil_actualizado_en` es de hace < 5 min, mostrá "Buscando licitaciones para tu barraca…" y `router.refresh()` cada 10 s, en lugar de "no hay licitaciones".
2. **Botón "Actualizar"** de la topbar: `POST /api/ingesta/refresh` (con la sesión) y después `generarNotificaciones(empresaId)`. Tarda 30–90 s: mostrar progreso.
3. **"Analizar por URL"** devuelve un stream NDJSON por etapas (ver `docs/03` §5). Al recibir `{ listo, idCompra }`, redirigí al detalle.
4. **Datos reales listos** en `src/server/consultas/` con las mismas firmas que tus mocks (`listarMatches`, `resumenDashboard`, `obtenerDetalle`, `listarEventos`, `coberturaDatos`). La empresa demo tiene 12 matches, 57 pliegos analizados y precio histórico por ítem.
5. **Evaluación:** `demo-assets/eval-resultado.json` (lo regenero en unos minutos con tu catálogo) trae precisión/recall en umbrales 40 y 60 para la página "Cómo funciona la IA".

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---

recibido (maxi, 16:05)
