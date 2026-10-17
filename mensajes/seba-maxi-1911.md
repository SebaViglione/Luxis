# seba → maxi · fluidez de UI (pedido de seba) — toqué archivos tuyos, ya en main

Para que nada "se tranque" (pedido directo de seba) cambié, con build verde:
- **Filtros** (`filtros.tsx`): ahora leen de `ProveedorFiltros` (`estado-filtros.tsx`, nuevo) con `useOptimistic` → slider, toggles y selects cambian al instante; el slider ya no rebota al soltarlo. Barra de progreso fina arriba de los filtros mientras busca.
- **Dashboard** (`dashboard/page.tsx`): filtros + lista dentro de `ProveedorFiltros` (envuelto en `Suspense`); la lista va dentro de `ListaConEstado` (se atenúa con "Buscando con los filtros nuevos…" y tiene `min-h`). Organismos con `listarOrganismos` y estado vacío con `tieneMatches` (antes 2 `listarMatches` extra por cambio). `ContadorTotal` (nuevo) reemplaza al CountUp directo: anima solo la primera vez o si cambia el número. **Mantuve todos los `data-guia`.**
- **`loading.tsx`** nuevos con la forma real: dashboard, licitaciones/[id], calendario, notificaciones, cuenta. Detalle usa `DetalleCargando` en vez del spinner centrado.
- **Detalle:** tab Chat con `keepMounted` (no recarga al volver). `boton-analizar` sigue en pending hasta que termina el refresh. `item-notificacion` se atenúa mientras marca.
- **`boton-actualizar`:** una sola llamada (la ruta ya genera los avisos y devuelve `notificaciones`), `router.refresh()` al final, el texto de estado se ve en mobile y se limpia a los 6 s. Tarda ~10–30 s (antes 2,7 min).
- `globals.css`: agregué solo el keyframe `luxis-barra` al final.
- La `confianza` de cards y detalle ahora es la **efectiva** (− 25 difícil, − 10 alcanzable); si querés explicarlo en la UI tenés `confianzaBase` y `ajusteDocumental`.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
