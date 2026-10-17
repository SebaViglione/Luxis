# seba → rafa y maxi · identidad de marca en main y adiós a "Cómo funciona"

Ya está en main (merge `7eaad06`) el rediseño visual de todo el sitio. Fueron **solo cambios visuales y de markup**: no cambió ninguna lógica, contrato, server action, `types.ts` ni `schema.ts`. Si estabas tocando alguno de estos archivos, hacé `git pull` antes de seguir para evitar conflictos.

**Guía de marca: `docs/07-marca.md`** (también enlazada en `CLAUDE.md`). Tiene el logo, la paleta, la tipografía, la voz, los íconos, el movimiento, los componentes para reusar (§9) y la estructura del sitio (§10). Cualquier pantalla nueva tiene que seguirla.

**"Cómo funciona la IA" (`/como-funciona`) se eliminó.** Sin el ítem del menú, sin el paso de la guía y sin la entrada en `next.config.ts` ni en `PREFIJOS_PROTEGIDOS`; la ruta da 404. No la vuelvan a crear ni a enlazar. Ojo: el "Cómo funciona" de la **landing** es otra cosa (la sección de los 3 pasos, `#como-funciona`) y sigue. La evaluación sigue en `demo-assets/eval-resultado.json` y `npm run eval:matching`. Detalle en `docs/07-marca.md` §10.

**rafa, tus archivos (cambios visuales):**
- `src/components/voz/entrevista-voz.tsx`: vista a pantalla completa con `BolaVoz`, la esfera que reacciona a `getInputVolume`/`getOutputVolume`, subtítulo con la última frase y botón "Cancelar". La lógica de la sesión no cambió. **Probala con micrófono real**: yo no pude.
- `src/components/onboarding/paso-entrevista.tsx`: burbujas con avatar, puntos de "escribiendo" y caja de respuesta compuesta. La lógica de `useChat` y el cierre por transcript no cambiaron.
- `src/components/onboarding/asistente-onboarding.tsx` (barra de pasos), `src/components/onboarding/marca.tsx` (logo nuevo), `src/app/(auth)/layout.tsx` (pantalla partida con panel de marca) y `src/app/(onboarding)/layout.tsx`.
- `src/server/auth/rutas.ts`: solo se sacó `'/como-funciona'` de los prefijos protegidos.

**maxi, tus archivos (cambios visuales):**
- `src/components/marca/logo.tsx`: logo nuevo (L de ladrillos), con `variante` `'color' | 'claro'` y `LogoMarca`. La API de `<Logo />` es la misma.
- `src/app/(app)/layout.tsx`: monta `<GuiaInicial />` (guía de la primera visita, `src/components/guia/`) y "Ver la guía" al pie del sidebar.
- `src/app/(app)/dashboard/page.tsx`: wrappers con `data-guia="resumen|analizar-url|filtros|lista"` (son las anclas de la guía, **no los saques**) y fallbacks con esqueletos (`ListaCargando`).
- `src/components/layout/sidebar.tsx` (barrita ladrillo en el ítem activo, sin "Cómo funciona"), `src/app/(app)/calendario/page.tsx` y `src/components/calendario/lista-eventos.tsx` ("Próximos 14 días" con scroll propio: antes estiraba la página sin fin), `src/components/licitaciones/buscando-licitaciones.tsx`.
- `src/components/ui/cargando.tsx`, `estado-vacio.tsx` y `estado-error.tsx`: misma API, estética nueva. Se aplican solos en todas las pantallas.
- `src/app/page.tsx` + `src/components/landing/*`: landing nueva.

Desde ahora el diseño lo hago yo en `feat/marca-app`. Si necesitás un cambio visual, pedímelo por acá; si es urgente y lo hacés vos, seguí `docs/07-marca.md`.

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Como es para los dos, **lo borra el segundo** que lo marque como recibido.

---
recibido (rafa, 18:43)

---

recibido (maxi, 18:45)
