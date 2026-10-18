# rafa → equipo: papeles coherentes (gap, Papeles, Postulación)

Branch `fix/papeles-coherentes`. **Toqué archivos de seba y maxi**; detalle abajo para resolver conflictos.

**Por qué:** revisé los 538 requisitos reales de la base. Papeles, el badge, la confianza y Postulación decían cosas distintas:
- "Lo prepara Luxis" se llevaba certificados de origen, muestras, folletos, el pago del pliego y hasta una constancia de visita obligatoria, por palabras sueltas (anexo, marca, origen, IVA).
- La visita obligatoria y la DJ art. 46 TOCAF salían en "Ya los tenés".
- Una ficha técnica bajaba 25 puntos.
- Los papeles opcionales figuraban como faltantes al lado de "Tenés los papeles".

**seba**
- `src/config/plazos-documentales.ts`:
  - Reglas reordenadas: lo concreto (visita, muestras, fichas, origen, pago del pliego, habilitaciones, escribano) va antes que la regla de Luxis, que ya no agarra certificados, constancias, pagos ni garantías.
  - Las reglas generales solo aplican si no es un formulario o declaración.
  - Más variantes de "envío de la oferta" y de "R.U.P.E.".
  - Las normas de producto (UNIT 20) se acreditan con el fabricante.
  - RUPE en ingreso: 1 día. Ficha técnica: 1 día.
  - Nuevos: flags `envio`, `visita`, `muestras`, `pagoPliego`; constantes `NOTA_*`; `sePideDespuesDeAdjudicar(detalle)`.
- `src/server/ia/gap-documental.ts`:
  - La visita depende de su fecha (ya no cuenta como "tenés").
  - Lo que el detalle dice que se pide al adjudicatario, para empezar o para cobrar no frena la oferta.
  - El vencimiento cuenta (`estadoDocumento`).
  - "Sin dato" se dice así en la nota.
  - RUPE siempre presente aunque el pliego no lo nombre.
  - Las reglas generales ya no van al gap.
  - Nuevo `recalcularGapsEmpresa()`.
- `src/server/ia/matching.ts`: saqué los papeles del prompt (`documentos` de `PerfilParaMatch`), porque el ajuste documental ya los descuenta. La calibración nueva del matching (`calcularConfianza`) quedó intacta: el merge fue automático.
- `src/server/ia/analisis-pliego.ts`: tres líneas en el prompt (opcional, cuándo se presenta, normas de producto). Solo afecta a los pliegos que se analicen de ahora en más.
- `src/server/notificaciones/generar.ts` (maxi): el aviso de papel faltante no incluye la visita ni lo "sin dato".

**maxi**
- `panel-documentacion.tsx`: grupos nuevos "Opcionales o solo si corresponde" y "Confirmá si los tenés". Lo opcional no figura como faltante y las reglas generales no se listan.
- `panel-decision.tsx`: "Confirmá tus papeles" cuando lo único que falta es sin dato.
- `badge-documentacion.tsx`: "Te faltan papeles, pero llegás".

**rafa (mío):** el checklist de Postulación usa las mismas reglas (sin lista propia) y cambiar papeles en Cuenta recalcula los gaps sin IA (ya no dispara el matching con IA).

**Datos:** después del merge corro `npm run recalcular:gaps` (solo reglas, sin IA): cambia `gap_documental` y `estado_documental` de todos los matches, incluida la demo. En la demo, por ejemplo, `i503656` (membrana) pasa de 63 a 78: una ficha técnica ya no cuenta como papel difícil.

**Conflictos:** si alguien tocó esas reglas o el panel, quédense con el orden nuevo de `PLAZOS_DOCUMENTALES` (lo concreto antes que Luxis) y con `grupoDe()` mirando `obligatorio`.
