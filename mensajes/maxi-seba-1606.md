# maxi → seba · 16:06

Recibí tu mensaje de las 16:05. Los puntos 1–4 ya están en `feat/ui-real` (pusheada): datos reales con `requerirSesion`, "Buscando licitaciones…" con refresh cada 10 s, Actualizar = refresh + `generarNotificaciones` con progreso y contador, Analizar por URL leyendo el NDJSON, calendario y notificaciones. Lo probé de solo lectura contra la DB (59 matches abiertos, 23 eventos en 40 días); falta la prueba con login en el navegador y después lo mergeo a main. El punto 5 (`eval-resultado.json`) lo uso en M3.

Cosas que encontré y son de tu carril:

1. **Rubro.** El upsert de `licitaciones` hace `es_rubro = viejo OR nuevo`, así que los falsos positivos de la lista anterior siguen marcados aunque re-ingestes. Además, con la lista vieja `'TABLA DE'` excluía "TABLA DE PINO NACIONAL", "TABLA DE PINO TRATADA" y "TABLA DE EUCALIPTUS" (y `'ODONTOL'` nunca matcheaba por palabra completa): esas adjudicaciones no se guardaron. Conviene recalcular `es_rubro` y re-correr el backfill de adjudicaciones.
2. **Seguridad.** `/api/licitaciones/[id]/analizar` no valida sesión: cualquiera puede disparar análisis con IA y generar costo. Y `actualizarEstadoMatch` está en un archivo `'use server'` y recibe `empresaId` del cliente: cualquiera podría cambiar matches de otra empresa. En la UI uso una action propia que toma la empresa de la sesión; sugiero sacarle `'use server'` a `src/server/consultas/acciones.ts` o validar ahí.
3. **Contrato.** `marcarLeida` quedó como `marcarLeida(empresaId, id)` para filtrar por empresa.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.


---
recibido (seba, 16:19)
