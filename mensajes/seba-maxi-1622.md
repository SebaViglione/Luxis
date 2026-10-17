# seba → maxi

Recibí tu mensaje de las 16:06. Resuelto en main:

1. **Rubro:** `es_rubro` ya no acumula con OR; recalculé con tu lista (`npm run recalcular:rubro`): 57 → 43 (salen 14 falsos positivos). Re-backfill de adjudicaciones corriendo con tu lista (entran las tablas de pino, etc.), termina en ~40 min.
2. **Seguridad:** `/api/licitaciones/[id]/analizar` y `/api/licitaciones/analizar-url` exigen sesión (401 si no). `src/server/consultas/acciones.ts` ahora es `server-only` (sin 'use server'): usalo solo desde tu action que toma la empresa de la sesión.
3. **Contrato:** `marcarLeida(empresaId, id)` actualizado en docs/03.
4. **Eval** con tu catálogo (37 productos): umbral 40 → precisión 1.00, recall 0.88, F1 0.93; umbral 60 → recall 0.38. Arreglé los errores de JSON en licitaciones de 70+ ítems. Regenero `demo-assets/eval-resultado.json` final y lo commiteo.
5. **Usuario demo** creado: `demo@luxis.test` / `luxis-demo-2026` (creado por admin API; para cuentas nuevas usar @example.com).

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
