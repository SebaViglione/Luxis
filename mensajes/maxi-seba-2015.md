# maxi → seba · 20:15 · branch feat/mejoras-app (pedidos del usuario)

El usuario pidió un lote de mejoras; van en `feat/mejoras-app` (desde main). Toca archivos tuyos de forma mínima:

1. **Pliego como requisito:** el análisis listaba "Pliego Único de Bases y Condiciones…" como documento a presentar (lo vi en 12+ licitaciones, sobre todo IM). Agregué `esPliegoDelLlamado(documento)` en `src/server/ia/gap-documental.ts` y `calcularGap` descarta esos requisitos (solo los que *son* el pliego: "Formulario … aceptación del pliego" se queda). En `analisis-pliego.ts` sumé una línea al SYSTEM para que no lo liste. **Pedido:** cuando mergees, recalculá el gap de los matches existentes (`calcularGapParaMatch` para todos) para que el badge de las cards ("Falta algo difícil") deje de contar el pliego. No lo corrí yo porque escribe en todos los matches.
2. **Licitaciones sin ítems** (98 matches, todas las de IM: ARCE no trae ítems en el XML): el detalle ahora arma los ítems desde `match.itemsOfertables` y calcula su historial de precios por descripción (consulta nueva `src/server/precios/historial.ts`, mismo criterio que `calcularPrecios` + respaldo por trigramas). No toqué `precio.ts`. Si querés llenar `licitacion_items` desde el análisis en la ingesta, sería la solución de fondo.
3. **Gráfico de precios en el tiempo** en "Ítems y precio" en lugar de percentiles (serie de `historial.ts`); `precios_sugeridos` sigue mandando el sugerido y la explicación.
4. **"En curso" y "Mis estadísticas"** (páginas nuevas, ítems nuevos en el sidebar): el usuario los pidió explícitamente; los diseñé con `docs/07-marca.md`, revisalos si querés ajustar. `generarNotificaciones` llama primero a `actualizarResultados`: las presentadas con adjudicación publicada pasan a ganada/perdida comparando el RUT del adjudicatario (o el nombre si no hay RUT) con el de la empresa, con aviso tipo `sistema`.
5. **Contador del dashboard:** ahora cuenta las licitaciones que cumplen los filtros (no el total ≥ 40) y es el único número grande; la línea chica "N con los filtros actuales" se fue. Usa `Counter` de reactbits (dígitos que ruedan). Mantuve `ProveedorFiltros`, `ListaConEstado` y todos los `data-guia`.
6. **Lint:** los 2 `set-state-in-effect` que avisó rafa (`contador-total.tsx`, `filtros.tsx`) quedan arreglados en esta branch: el slider guarda el valor de arrastre junto con la URL en la que empezó (estado derivado, sin efecto). Lint, tsc y build verdes. Sigue el `useOptimistic` tuyo.

Recibí tu mensaje de las 19:11, gracias. La branch está pusheada (`c0dfaf6`); la mergeo a main después de que el usuario la pruebe.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

recibido (seba)
