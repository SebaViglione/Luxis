# rafa → seba y maxi · hallazgos menores que se ven en pantalla (en main)

El usuario pidió arreglar lo que se ve en pantalla. **Toqué archivos de ustedes:**

**seba**
- **Conflicto de una línea con `feat/ui-intuitiva`** en `src/components/guia/guia-inicial.tsx`. Cambié el texto del paso Calendario a "Cierres, consultas y visitas de tus licitaciones, ordenados por fecha." y vos cambiaste la línea de arriba ("Buscar novedades"). Al mergear quedate con las dos. Es el único conflicto: lo probé con `git merge-tree`.
- `api/ingesta/refresh`: `analizarRelevantes()` va después de `procesarPendientes()`, tanto en segundo plano como en el cron. Analiza hasta 6 pliegos ya leídos, sin análisis, de licitaciones con match de 40 o más, y recalcula el gap de esos matches. Así la confianza no "salta" cuando el usuario toca Analizar. Hoy no hay ninguna pendiente.
- `api/licitaciones/analizar-url`: si `archivos_procesados` y el análisis existente es `basadoEn: 'pliego'`, reutiliza (no descarga ni fuerza). Antes pisaba un análisis del modelo fuerte con uno del rápido. Una ya analizada tarda unos 8 s.
- `config/plazos-documentales.ts`: `DATOS (DE LA EMPRESA|DEL OFERENTE|IDENTIFICATORIOS)` e `IDENTIFICACION DEL OFERENTE` van a la regla "Lo prepara Luxis". Está en la línea de arriba de la tuya, así que entra sin conflicto.
- **Base:** NO recalculé gaps en masa, porque tus gaps guardados usan las reglas de tu rama (ej. "oferta cotizada"). Solo pasé a "Lo prepara Luxis" los ítems de datos identificatorios en 10 matches de 1379507 (`alcanzable` → `cumple`) y no toqué el resto del gap.
- `scripts/seed-demo.ts`: `perfilJson.datosPostulacion` con domicilio, representante, CI, cargo y mail ficticios (Av. Artigas 1520, Aurelio Fernández, 1.234.567-2). Antes el seed los borraba. Ya los cargué en la empresa de demo@luxis.test: los formularios de Postulación salen completos.

**maxi**
- `layout/boton-actualizar.tsx`: si la ruta da 504, dice "Tardó más de lo esperado: ya ves lo procesado…" y hace `router.refresh()`. Si se corta la red, avisa que revisen la conexión. Ya no culpa a ARCE (cuando ARCE no responde, la ruta igual contesta bien con un aviso). Con `feat/ui-intuitiva` entra sin conflicto.

**Míos:** el checklist de Postulación marca como riesgo lo que el gap dice que no llega (RUPE, DGI/BPS/BSE). Ya no dice "Te falta 1 cosa" al lado de "baja 25 puntos". Verificado en los 38 matches de la demo: 0 incoherentes.

Lint, tsc y build verdes.

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Lo borra el segundo que lo marque como recibido.
