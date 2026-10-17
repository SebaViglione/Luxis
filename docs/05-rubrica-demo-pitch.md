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

## 4. Guion de 3 minutos (quién habla / qué se ve)

| Tiempo | Quién | Dice | Pantalla |
|---|---|---|---|
| 0:00–0:25 | maxi | El problema: el Estado compra portland y ladrillos todas las semanas; las barracas chicas no se presentan porque ARCE es inusable, los pliegos son enormes y nadie sabe a qué precio se gana. | Landing |
| 0:25–1:05 | rafa | "Luxis conoce tu empresa en 2 minutos": sube lista de precios y carta → perfil extraído → la IA pregunta lo único que falta (voz o chat) → confirmar. | Onboarding |
| 1:05–1:45 | seba | Dashboard: "14 licitaciones para vos, 3 cierran esta semana". Abre la primera (92 %): resumen, ítems que vendemos, **precio sugerido** con banda histórica y 3 competidores, documentación (falta BSE, alcanzable), fechas con visita. | Dashboard → Detalle |
| 1:45–2:15 | seba | Chat: "¿piden muestras?" → respuesta con cita del pliego. Calendario y campanita en 5 segundos. | Chat → Calendario |
| 2:15–2:45 | rafa | Variación en vivo: pega una URL de ARCE que el jurado elija → etapas (descargando, extrayendo, analizando, precios) → detalle nuevo. | Analizar por URL |
| 2:45–3:00 | maxi | Cierre: datos reales de ARCE, precios sin IVA, limitaciones declaradas; "una barraca que hoy no licita, mañana cotiza con el precio ganador en la mano". | Cómo funciona la IA |

## 5. Casos de variación para el jurado (preparados, no precargados)

1. Pegar cualquier URL de llamado vigente de https://www.comprasestatales.gub.uy/consultas/buscar/tipo-pub/llamado.
2. Editar el perfil (sacar "hierro", agregar "pintura") y recalcular: cambian las confianzas.
3. Preguntar al pliego algo que no está ("¿aceptan pago en cuotas?") → "no está en el pliego".
4. Crear una cuenta nueva sin documentos y hacer la entrevista por chat.

## 6. Preguntas probables y respuestas

- **¿De dónde salen los precios?** De las adjudicaciones publicadas por ARCE (interfaz XML pública), por artículo, moneda y unidad, últimos 24 meses, sin IVA. No es probabilidad de ganar: ARCE no publica ofertas perdedoras.
- **¿Cómo sabemos que el matching es bueno?** 20 llamados etiquetados a mano; mostramos precisión y recall; además cada match trae razón y confianza, y nunca descarta solo.
- **¿Qué pasa si el pliego es escaneado?** Se marca como no leído, el análisis baja a confianza ≤ 50 y se avisa.
- **¿Qué es IA y qué es SQL?** Perfil, matching, lectura del pliego, chat y explicaciones: LLM. Percentiles de precio y competidores: SQL. La IA interpreta, SQL calcula.
- **¿Escala?** Los datos son públicos y la ingesta corre en ventanas; el costo por licitación analizada es de centavos con el modelo rápido.
- **¿Qué falta?** Email, OCR, multiusuario, conversión de monedas, seguimiento de resultados. Está en la página "Cómo funciona".

## 7. Checklist pre-demo (20:30)

- [ ] Cuenta demo creada y con matching/análisis corrido; cuenta vacía lista para "nuevo usuario".
- [ ] `npm run build && npm start` local funcionando; Vercel como respaldo; `.env.local` con claves válidas; saldo de Anthropic verificado.
- [ ] 2 URLs de ARCE vigentes elegidas por nosotros por si el jurado no trae una (pero aceptamos la suya).
- [ ] Minutos de ElevenLabs restantes ≥ 20; micrófono probado; fallback de chat a mano.
- [ ] Video de respaldo en el teléfono y en la laptop.
- [ ] Notebook enchufada, zoom del navegador 125 %, notificaciones del SO apagadas, pestañas abiertas en orden del guion.
- [ ] Repo con README, tag `v0.1-demo`, acceso de lectura para la revisión técnica.

## 8. Limitaciones a declarar (decirlas antes de que pregunten)

Precios sin IVA · sin ofertas perdedoras (precio ganador histórico, no probabilidad) · sin OCR · Compras Directas ya adjudicadas no aparecen como oportunidad · un usuario por empresa · sin email · la IA puede equivocarse y por eso muestra confianza y razón.
