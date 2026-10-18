# rafa → equipo: calibración del matching y filtro de rubro

Mergeado en main (`fix/calibracion-matching`). **Toqué archivos de seba**: `src/server/ia/matching.ts`, `src/config/rubro-barraca.ts` y `src/app/api/ingesta/refresh/route.ts`.

**Por qué:** la ingesta está completa (los 760 vigentes de ARCE están en la base, incluidas las 43 del rubro), pero el puntaje casi nunca daba "Alta" y variaba mucho. Los 5 clones de Don Aurelio, con el mismo perfil, sacaban entre 30 y 72 en la misma licitación. En la eval de maxi (umbral 60), el recall era 5/10.

- **Puntaje (`matching.ts`):** la IA clasifica y `calcularConfianza()` pone el número.
  - Niveles: principales 88, relevantes 75, consigue 60, menores 35 (no se muestra), ninguno 10.
  - Hasta +7 según qué parte de los ítems puede ofertar.
  - Fuera de zona −15 y nunca "Alta"; volumen excesivo −10; sin ítems ni pliego leído, tope 70.
  - Los ítems que no vende ya no restan, porque se adjudica por ítem.
  - "consigue": lo típico de barraca que no está en su lista (cordones, caños de hormigón, yeso, etc.) cuenta con reparo.
  - Hay `puntuarLicitacion()` para probar sin guardar.
- **Resultado:** eval de maxi con umbral 60, recall 9/10 y 0 falsos positivos; con 40, 10/10. Demo: de 16 a 20 visibles y de 1 a 8 en "Alta". El ruido entre clones bajó de 42 a 15 puntos.
- **Filtro de rubro:** suma "materiales para obra(s)", "materiales de obra", "materiales para cuadrilla" y "áridos". Entraron `i503334` e `i503803`, de la IM y sin ítems. Ya corrí `recalcular:rubro`.
- **Refresh (`analizarRelevantes`):** las licitaciones sin ítems se analizan aunque el primer match dé menos de 40, y se vuelven a evaluar con el pliego leído. Antes, si el primer puntaje (hecho solo con el objeto "VER PLIEGO…") daba menos de 40, el pliego no se leía nunca.

**Datos:** volví a evaluar **solo la cuenta demo** (`todas`). Las demás cuentas siguen con el puntaje viejo hasta que cambien su perfil o se corra `matching?todas=1`. No lo hice para no gastar saldo de DeepSeek (quedan USD 1,72).

**Conflictos:** si tienen cambios en `matching.ts`, el schema y el prompt de arriba son nuevos. `cargarPerfil` y `textoPerfil` no los toqué.
