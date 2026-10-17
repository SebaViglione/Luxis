# Rúbrica, demo y pitch

## 1. La rúbrica en una tabla

| Criterio | Peso | Qué mira el jurado (nivel 5) | Qué hacemos para llegar |
|---|---|---|---|
| Producto funcionando | 35 % | Completa el flujo con consistencia, tolera variaciones, maneja errores; las integraciones sostienen el resultado | Flujo completo con datos reales de ARCE; "Analizar por URL" para entradas nuevas; estados de error visibles; demo local sin depender de red salvo el LLM |
| Problema y valor | 25 % | Mejora convincente con un caso concreto: menos trabajo, mejor resultado, nueva capacidad | Caso: barraca que hoy no licita; en 5 minutos tiene 10 oportunidades con precio ganador y papeles faltantes |
| Calidad de la IA | 20 % | Resultados útiles en casos distintos, enfoque justificado, comprobación sencilla de calidad | Confianza + razón por match; citas en el chat; limitaciones declaradas; eval con 20 casos etiquetados (precisión/recall) |
| Experiencia de uso | 10 % | Interacción clara, resultados comprensibles, buenos mensajes de progreso y error | Card legible en 10 s; progreso por etapas al analizar; estados vacíos útiles |
| Originalidad | 10 % | Solución o experiencia distintiva demostrada | Perfil por entrevista (voz), precio ganador + competencia por ítem, "¿llegás con los papeles?" |

Desempate: producto funcionando, después valor. **Nunca** mostrar algo simulado como si fuera IA: si algo es pendiente, se dice.

## 2. Checklist de consigna (antes de puntuar, el jurado verifica)

- [ ] La IA es central: sin LLM no hay perfil, ni matching, ni lectura de pliego, ni chat.
- [ ] Procesa casos nuevos: el jurado puede pegar una URL de ARCE, cambiar los productos del perfil o preguntar cualquier cosa al pliego.
- [ ] Partes simuladas o pendientes identificadas: en la página "Cómo funciona la IA" y en el pitch.
- [ ] Repo con historial de hoy (acceso de lectura para la revisión técnica), README con cómo correr.
- [ ] Nada hardcodeado en `main`: `grep -r "mocks" src/app` vacío.

## 3. Empresa de demo (ficticia; detalle en `demo-assets/empresa.md`)

Barraca de Las Piedras (Canelones), 12 empleados, entrega en Canelones, Montevideo, San José y Florida. Vende portland (bolsa y granel), cal, arenas, pedregullo, balasto, ladrillos, ticholos, bloques, hierro, malla, alambre, chapas, caños PVC, maderas, yeso, membranas, adhesivos y cerámicas básicas. RUPE activo, DGI y BPS al día, BSE vigente, sin UNIT ni ISO. Se presentó a 2 licitaciones en 2025 y ganó 1. Usuario demo: lo crea `npm run seed:demo` (credenciales solo en el canal).

## 4. Guion final de 3 minutos (quién habla / qué dice / qué se ve)

Versión de ensayo; el borrador v1 está en [`demo-assets/guion-pitch-v1.md`](../demo-assets/guion-pitch-v1.md). Lo que va entre llaves se lee de la pantalla en el momento (no se inventa). Ensayar con cronómetro: el bloque 3 es el que más se estira.

| Tiempo | Quién | Pantalla | Dice (primera persona) |
|---|---|---|---|
| 0:00–0:25 | maxi | Landing | "El Estado uruguayo compra portland, ladrillos y arena todas las semanas. Las barracas chicas casi nunca se presentan: ARCE es difícil, los pliegos tienen 80 páginas y nadie sabe a qué precio se gana. Para eso hicimos Luxis." |
| 0:25–1:05 | rafa | Onboarding | "Subo la lista de precios y la carta de Barraca Don Aurelio y la IA arma el perfil: qué vende, dónde entrega, qué papeles tiene. Lo que falta me lo pregunta por chat o por voz. Confirmo y listo." |
| 1:05–1:45 | seba | Dashboard → detalle | "Luxis le encontró {N} licitaciones a la barraca, {M} cierran esta semana. Cada una dice por qué: la de 30 camiones de balasto se entrega en el Municipio de Las Piedras, su misma localidad. En el detalle está lo que piden, el **precio ganador histórico** del ítem con quién ganó antes, y la documentación: lo que le falta y si llega antes del cierre." |
| 1:45–2:15 | seba | Chat → calendario → campanita | "Le pregunto al pliego '¿piden muestras?' y contesta citando el archivo y el párrafo; si no está, lo dice. En el calendario veo cierres y visitas; la campanita me avisa lo que cierra en 48 horas." |
| 2:15–2:45 | rafa | Dashboard → "Analizar una licitación puntual" | "Ahora una que nunca vimos: el jurado nos pasa una URL de ARCE, la pegamos y se ven las etapas reales: buscando en ARCE, leyendo el pliego, analizando con IA, comparando con los productos, precios. En menos de un minuto, el detalle completo." |
| 2:45–3:00 | maxi | Cómo funciona la IA | "Todo corre sobre datos reales de ARCE: {adjudicaciones} adjudicaciones históricas. Con 20 llamados etiquetados a mano, el matching acertó en todo lo que mostró y encontró casi 9 de cada 10 oportunidades reales. Precios sin IVA, sin ofertas perdedoras y la IA puede equivocarse: por eso muestra confianza y motivo. Una barraca que hoy no licita, mañana cotiza con el precio ganador en la mano." |

**Plan B:** si la IA tarda en el bloque 2:15 (analizar por URL tarda 20–90 s), seguir hablando del cierre mientras corre y volver al detalle al final; si no responde, pasar el video de respaldo desde ese minuto.

## 5. Casos de variación para el jurado (preparados, no precargados)

1. Pegar cualquier URL de llamado vigente de https://www.comprasestatales.gub.uy/consultas/buscar/tipo-pub/llamado.
2. Editar el perfil (sacar "hierro", agregar "pintura") y recalcular: cambian las confianzas.
3. Preguntar al pliego algo que no está ("¿aceptan pago en cuotas?") → "no está en el pliego".
4. Crear una cuenta nueva sin documentos y hacer la entrevista por chat.

## 6. Preguntas probables y respuestas

- **¿De dónde salen los precios?** De las adjudicaciones publicadas por ARCE (interfaz XML pública), por artículo, moneda y unidad, últimos 24 meses, sin IVA. No es probabilidad de ganar: ARCE no publica ofertas perdedoras.
- **¿Cómo sabemos que el matching es bueno?** 20 llamados reales de ARCE etiquetados a mano (10 sí, 10 no, 3 tramposos). Mostrando desde confianza 40: precisión 1,00 y recall 0,88 (F1 0,93); desde 60 el recall cae a 0,38, por eso el dashboard arranca en 40. Además cada match trae razón y confianza, y nunca descarta solo. Está en la página "Cómo funciona la IA".
- **¿Qué pasa si el pliego es escaneado?** Se marca como no leído, el análisis baja a confianza ≤ 50 y se avisa.
- **¿Qué es IA y qué es SQL?** Perfil, matching, lectura del pliego, chat y explicaciones: LLM. Percentiles de precio y competidores: SQL. La IA interpreta, SQL calcula.
- **¿Escala?** Los datos son públicos y la ingesta corre en ventanas; el costo por licitación analizada es de centavos con el modelo rápido.
- **¿Qué falta?** Email, OCR, multiusuario, conversión de monedas, seguimiento de resultados. Está en la página "Cómo funciona".

## 7. Checklist pre-demo (20:30)

- [ ] Cuenta demo creada y con matching/análisis corrido; cuenta vacía lista para "nuevo usuario".
- [ ] `npm run build && npm start` local funcionando; Vercel como respaldo; `.env.local` con claves válidas; saldo del proveedor de IA verificado (DeepSeek o Anthropic, según `IA_PROVEEDOR`).
- [ ] Red con salida a los puertos 5432/6543 de Supabase (el Wi‑Fi del evento puede bloquearlos: tener el hotspot del celular a mano).
- [ ] Botón "Actualizar" corrido antes de presentar (tarda 1–3 min) para que la campanita tenga avisos.
- [ ] 2 URLs de ARCE vigentes elegidas por nosotros por si el jurado no trae una (pero aceptamos la suya).
- [ ] Minutos de ElevenLabs restantes ≥ 20; micrófono probado; fallback de chat a mano.
- [ ] Video de respaldo en el teléfono y en la laptop.
- [ ] Notebook enchufada, zoom del navegador 125 %, notificaciones del SO apagadas, pestañas abiertas en orden del guion.
- [ ] Repo con README, tag `v0.1-demo`, acceso de lectura para la revisión técnica.

## 8. Limitaciones a declarar (decirlas antes de que pregunten)

Precios sin IVA · sin ofertas perdedoras (precio ganador histórico, no probabilidad) · sin OCR · Compras Directas ya adjudicadas no aparecen como oportunidad · un usuario por empresa · sin email · la IA puede equivocarse y por eso muestra confianza y razón.
