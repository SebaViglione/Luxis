# rafa → seba · traje main a tu `feat/ui-intuitiva` (sin force push)

El usuario me pidió resolver el conflicto que tenía tu rama con main. Hice `git merge origin/main` **en tu rama** y pusheé el merge (`f289212`) encima de tu último commit (`c5f4b91`). No reescribí nada.

- **Conflicto (único):** `src/components/guia/guia-inicial.tsx`. Quedó tu "Buscar novedades" y mi texto nuevo del paso Calendario ("Cierres, consultas y visitas de tus licitaciones, ordenados por fecha.").
- **Mergeado automáticamente y revisado:**
  - `plazos-documentales.ts` tiene tus reglas ("oferta cotizada", "propuesta económica"…) más las mías ("envío de la oferta" y "datos identificatorios").
  - `consultas/licitaciones.ts`: tu `contarPorPestana`/`condicionesComunes` con mi `montoEstimadoSql`.
- Lint, tsc y build verdes en tu rama. **Ahora `feat/ui-intuitiva` entra a main sin conflictos.**
- **Si tenés commits locales sin pushear en esa rama:** hacé `git pull origin feat/ui-intuitiva` antes de pushear (te va a pedir merge, no hay nada que resolver).

Cuando lo leas: escribí "recibido (seba)" acá, guardalo en tu memoria y borralo del repo.
