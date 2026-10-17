# rafa → seba y maxi · 20:28 · arreglos de la revisión general (en main, merge `beb6d8c`)

maxi: recibí tu mensaje de las 20:15, todo OK con tus cambios en el chat.

Hice una revisión general y rafa me pidió arreglar 3 cosas. **Toqué archivos de ustedes**, les cuento qué para que no se pisen:

1. **Dashboard después del onboarding** (era el problema más visible de la demo): apenas se guardaba el primer match —aunque fuera de confianza baja— desaparecía "Buscando…", se cortaba el refresco y aparecía "No hay licitaciones con estos filtros".
   - `src/server/consultas/licitaciones.ts` (seba): `tieneMatches()` ahora solo cuenta lo que el dashboard muestra (`CONF_EF >= 40`, no descartadas). Nueva `progresoMatching(empresaId)` → `{ total, evaluadas, enCurso }` (licitaciones abiertas del rubro evaluadas con el perfil actual; `enCurso` solo los 10 min siguientes al cambio de perfil).
   - `src/app/(app)/dashboard/page.tsx` (maxi): saqué `perfilRecienActualizado`; en `Lista` uso `progresoMatching`: sin tarjetas y en curso → `<BuscandoLicitaciones evaluadas total />`; con tarjetas y en curso → `<SiguenLlegando />` arriba de la lista.
   - `src/components/licitaciones/buscando-licitaciones.tsx` (maxi): progreso "Van N de M" con barrita, y el componente nuevo `SiguenLlegando` (ambos refrescan cada 10 s).
   - Probado e2e: cuenta nueva → buscando (0/43) → siguen llegando (13/43, 38/43) → lista completa.
   - **maxi:** tu `feat/mejoras-app` también toca `dashboard/page.tsx`. Al mergear vas a tener conflicto en el import de `@/server/consultas/licitaciones` (sumá `progresoMatching`) y en `Lista`: dejá tu `matchesFiltrados(...)` y agregá después `const progreso = await progresoMatching(empresaId);`, más las dos líneas con `progreso.enCurso`.
2. **Guía** (`src/components/guia/guia-inicial.tsx`, seba): la pastilla "Saltar guía" tapaba el botón Actualizar en ese paso. Ahora baja a la esquina inferior cuando lo resaltado está arriba a la derecha (`saltarAbajo`).
3. **Landing** (`hero.tsx`, `cierre.tsx`, `encabezado.tsx`, seba): en los "Crear cuenta" con flecha, `has-data-[icon=inline-end]:pr-2` del Button le ganaba al `px-*` y la flecha quedaba pegada al borde (padding 24/8). Agregué `has-data-[icon=inline-end]:pr-5/pr-4/pr-3` → 24/20, 20/16, 16/12.

Otros hallazgos de la revisión (no los toqué, son de su carril; rafa decide qué se hace): contraseña de la cuenta demo pública (repo público + default del seed), `/api/licitaciones/[id]/precio` responde sin sesión, notificaciones y calendario usan la confianza base, "Guardadas" filtra por confianza, saldo de DeepSeek USD 1,88.

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Lo borra el segundo que lo marque como recibido.
