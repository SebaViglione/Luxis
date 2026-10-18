# rafa → seba y maxi · arreglos de la revisión (altos y medios), en main

El usuario pidió aplicar los altos (menos el saldo de DeepSeek: van a cambiar de cuenta) y los medios. **Toqué archivos de ustedes**, les cuento qué:

**seba**
- `api/licitaciones/[id]/precio`: ahora pide sesión. `?recalcular=1`, `matching?todas=1` y `analizar?forzar=1` solo funcionan con `Authorization: Bearer CRON_SECRET` (helper nuevo `esPedidoAdmin(req)` en `src/server/auth/admin.ts`). La app no los usaba.
- `api/ingesta/refresh`: `after(trabajoEnSegundoPlano)` solo si `refreshRapido` de verdad consultó ARCE (no `omitido`). Repetir el botón ya no apila descargas. El cron usa `esPedidoAdmin`.
- `lib/ia/estructurado.ts`: `generarObjeto` acepta `timeoutMs` (por defecto 120 s por intento, con `timeout` del AI SDK). `analisis-pliego` usa 180 s.
- `ia/matching.ts`: `evaluarEmpresa` comparte la corrida en curso por empresa y versión del perfil (dos pedidos a la vez no duplican), y antes de cada llamada a la IA chequea si otra corrida ya la evaluó (`yaEvaluada`). Ahora `evaluarEmpresa` carga el perfil y llama a `evaluarConPerfil`.
- `ia/analisis-pliego.ts`: `fechasLegibles()` pasa a null las fechas que no son ISO, al guardar y al leer el detalle (`obtenerDetalle`).
- `consultas/licitaciones.ts` y `estadisticas/consultas.ts`: el monto estimado sale de `montoEstimadoSql()` / `leerMontoEstimado()` (están junto a `numero`), en la moneda de los precios. Si hay monedas mezcladas no se suma. Hoy son todos UYU. **Probé el merge con `feat/ui-intuitiva`: entra sin conflictos.**
- `arce/procesar-archivos.ts` y `arce/guardar.ts`: borrar e insertar archivos y aclaraciones va en una transacción con `pg_advisory_xact_lock` (sin duplicados en carreras).
- `config/plazos-documentales.ts`: "Presentación de la oferta / oferta en línea / por correo" (sin formulario ni carta) es una regla nueva antes de la de "Lo prepara Luxis". Sigue contando como que se tiene, pero la nota dice que la oferta la carga la empresa. Los gaps guardados tienen la nota vieja: si recalculás gaps, se actualiza.

**maxi**
- `analizar-url.tsx`: si el stream termina sin `listo` (corte de red o tiempo máximo), muestra "Se cortó la conexión…" y frena las etapas que giraban.
- `panel-documentacion.tsx`: si no hay gap pero el pliego tiene requisitos, muestra "Papeles que piden" con la lista (antes decía "Todavía no sabemos qué papeles piden"). En "Los prepara Luxis" se ve la nota cuando no es la genérica.

**Míos:** `guardarPerfil` solo mueve `perfil_actualizado_en` si cambió algo que lee el matching (nombre, departamento, productos, zonas, capacidad, papeles) o al terminar el onboarding. Editar el teléfono ya no reevalúa todo. Extracción del onboarding con `maxDuration` 300. `fetch-web` valida DNS y cada redirección contra IPs internas.

Lint, tsc y build verdes. Probado en local: rutas sin sesión dan 401, recorrido de la demo sin errores, y pruebas de las funciones nuevas.

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Lo borra el segundo que lo marque como recibido.
