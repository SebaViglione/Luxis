# Luxis — PRD v2 (hackathon build 101, 17–18/10/2026)

## 1. Problema

Las barracas pequeñas y medianas de Uruguay (venden portland, ladrillos, arena, hierro, chapas, etc.) casi no le venden al Estado aunque el Estado compra esos materiales todas las semanas. Motivos concretos:

- El portal de ARCE (comprasestatales.gub.uy) es difícil de usar: búsqueda pobre, sin alertas útiles, sin historial de precios a mano.
- Cada llamado trae pliegos de 30 a 100 páginas (a veces en ZIP o RAR con varios archivos) que nadie en la barraca tiene tiempo de leer.
- No saben **a qué precio se gana** ni **contra quién compiten**, así que cotizan a ciegas o no cotizan.
- No saben qué **documentación** exige cada llamado (RUPE, DGI, BPS, BSE, UNIT, garantías) ni si llegan a conseguirla antes del cierre.

## 2. Usuario y propuesta de valor

**Usuario:** dueño o encargado de compras/ventas de una barraca de 2 a 30 empleados, sin área de licitaciones. Usa WhatsApp y Excel; no va a leer un pliego entero.

**Promesa:** "Decime qué vendés y te digo qué licitaciones podés ganar, a qué precio, qué papeles te faltan y cuándo cierra. Y si tenés dudas, preguntale al pliego."

**Alternativa actual:** revisar ARCE a mano o pagar un gestor. Mejora medible: de horas de lectura por llamado a minutos; de cotizar a ciegas a cotizar con el precio ganador histórico y la competencia a la vista.

## 3. Por qué la IA es indispensable (consigna)

Sin IA el producto no funciona: no hay forma por reglas de (1) armar el perfil comercial desde documentos heterogéneos o una conversación, (2) decidir si una licitación con ítems en texto libre ("CHAPA GALV ACANALADA CAL24 1,08X3,05M") es para esta barraca y con qué confianza, (3) leer un pliego de 80 páginas y extraer requisitos documentales, fechas y condiciones, (4) responder preguntas libres sobre ese pliego con citas. El precio histórico se calcula en SQL, pero el LLM lo conecta con los ítems de la empresa y lo explica. Se puede sacar el chat o la voz y el producto sigue; se saca el LLM y queda un buscador peor que ARCE.

## 4. Alcance (MoSCoW) para la demo de hoy

| Must | Should | Could | Won't (hoy) |
|---|---|---|---|
| Registro/login/cuenta · Onboarding por archivos/URL y por chat · Ingesta ARCE (XML + scraping + pliegos con ZIP/RAR) · Matching con % y razón · Precio ganador histórico + competencia · Análisis de pliego + gap documental · Chat con el pliego · Dashboard + detalle | Notificaciones in-app · Calendario · "Analizar por URL" · Página "Cómo funciona la IA" | Entrevista por voz (ElevenLabs) · Seguimiento presentada/ganada/perdida | Mailing · OCR de escaneados · Multiusuario por empresa · Conversión de monedas · Estadísticas de ganadas/perdidas · AWS |

## 5. Requisitos funcionales

Cada RF tiene criterio de aceptación (CA) y el criterio de la rúbrica al que más aporta: **P** producto funcionando · **V** valor · **IA** calidad de IA · **UX** · **O** originalidad.

| ID | Requisito | Criterios de aceptación | Rúbrica | Dueño |
|---|---|---|---|---|
| RF-01 | Registro, inicio y cierre de sesión con email y contraseña; recuperación de contraseña | Usuario nuevo se registra y queda logueado sin confirmar email; `/app/*` sin sesión redirige a `/login`; errores en español | P | rafa |
| RF-02 | Cuenta: editar datos del usuario y de la empresa | Cambios persisten y se reflejan en el dashboard | P, UX | rafa |
| RF-03 | Onboarding por fuentes: subir hasta 5 archivos (pdf/docx/xlsx/html/txt, ≤ 10 MB) y/o URL de la web; la IA arma un perfil estructurado editable | Con los assets de la barraca demo: ≥ 20 productos con unidad, documentación detectada, zonas; el usuario puede corregir antes de confirmar | P, IA | rafa |
| RF-04 | Onboarding por entrevista (chat): la IA pregunta solo lo que falta, una pregunta por turno, máximo 8 | Sin documentos, se llega a un perfil con ≥ 8 productos y la documentación declarada; "no sé" no rompe el flujo | IA, UX, O | rafa |
| RF-05 | Entrevista por voz (ElevenLabs) sobre el mismo flujo, con fallback a chat | Una conversación de 2 min produce el mismo perfil; si falla, vuelve al chat sin perder datos | O, UX | rafa (stretch) |
| RF-06 | Ingesta de ARCE: llamados vigentes (últimos 60 días) y adjudicaciones (desde 2024-01) por la interfaz XML, con filtro de rubro; refresh diario y manual | Tras el backfill hay licitaciones del rubro abiertas y ≥ 2.000 líneas de adjudicaciones del rubro con precio; `ingesta_corridas` registra cada corrida | P | seba |
| RF-07 | Scraping de la página de detalle para completar ítems/adjuntos y "Analizar por URL" (cualquier llamado nuevo que pegue el jurado) | Pegar una URL de ARCE no ingestada termina en un detalle con ítems, archivos, análisis y precio en < 60 s con progreso visible | P, IA | seba (backend) · maxi (UI) |
| RF-08 | Descarga y extracción de pliegos: pdf, doc, docx, xls(x), zip y **rar** (recursivo), clasificación de archivos y selección de los relevantes | De 10 licitaciones del rubro, ≥ 8 tienen texto extraído; un RAR con 5 archivos queda desglosado con categoría; escaneados marcados "no soportado" | P | seba |
| RF-09 | Matching empresa↔licitación con confianza 0–100, razón e ítems ofertables; nunca descarta sola; se recalcula al cambiar el perfil | Para la empresa demo: ≥ 10 licitaciones con confianza ≥ 60 y razón legible; cambiar los productos del perfil cambia los resultados | IA, V | seba |
| RF-10 | Precio ganador histórico por ítem (p25/mediana/p75, n, último ganador, competidores frecuentes) y precio sugerido explicado | Para "CEMENTO PORTLAND" muestra n ≥ 10 con banda de precios en UYU, 3 competidores y nota "sin IVA"; sin historial muestra aviso | V, IA, O | seba |
| RF-11 | Análisis del pliego: resumen, qué piden, requisitos documentales, fechas clave (visita, consultas, apertura, entrega), condiciones, riesgos, confianza y si se basó en pliego o solo metadata | En 3 pliegos distintos los requisitos citan sección; si no hay texto, confianza ≤ 50 y aviso visible | IA, V | seba |
| RF-12 | Gap documental: cruza requisitos con la documentación de la empresa y estima si llega antes del cierre | Muestra Cumple / Alcanzable (días estimados) / Difícil por documento; UNIT faltante con cierre en 10 días = Difícil | V, O | seba |
| RF-13 | Chat con el pliego con citas `[archivo, párrafo]`; dice cuando algo no está | 5 preguntas estándar respondidas con cita; pregunta fuera del pliego → "no está en el pliego" | IA, UX | rafa |
| RF-14 | Dashboard de licitaciones: cards con confianza, cierre, resumen, ítems ofertables, estado documental; filtros y orden; acciones guardar/descartar/presentada | Se entiende en 10 s qué conviene; filtros funcionan; estados persisten | UX, P | maxi |
| RF-15 | Detalle con tabs: Resumen IA · Ítems y precio · Documentación · Fechas · Chat · Archivos | Toda la info del RF-09 a RF-13 visible; links a originales en ARCE | UX, P | maxi |
| RF-16 | Calendario mensual + próximos 14 días con cierres, consultas, prórrogas, visitas y entregas | Eventos reales desde DB; click lleva al detalle | UX | maxi |
| RF-17 | Notificaciones in-app (campanita + página): nuevo match, cierre próximo, visita próxima, aclaración nueva, documento alcanzable. Sin email | Tras "Actualizar" aparecen notificaciones reales, sin duplicados; marcar leídas | UX, V | maxi |
| RF-18 | Página "Cómo funciona la IA": componentes, datos, limitaciones declaradas y cobertura real | Números leídos de la DB; limitaciones listadas | IA | maxi |

## 6. Requisitos no funcionales

- **Sin simulaciones**: todo lo que se muestra sale del pipeline real; lo pendiente se declara en la UI y en el pitch.
- **Tiempos**: dashboard < 2 s; análisis on-demand de una licitación < 60 s con etapas visibles; chat primer token < 3 s.
- **Robustez**: errores de ARCE, archivos no soportados y fallos del LLM se muestran con mensaje y reintento; nada queda en spinner infinito.
- **Costo**: modelo rápido para lo masivo, fuerte solo en interacción; < USD 5 en el día.
- **Datos**: precios siempre "sin IVA"; agrupación por moneda y unidad; atribución a ARCE en el footer.
- **Seguridad mínima**: acceso a DB solo desde servidor filtrado por `empresa_id`; secretos en variables de entorno.
- **Idioma**: UI y salidas de IA en español rioplatense.

## 7. Flujo principal de la demo (3 minutos)

1. Registro → onboarding: subir lista de precios + carta → perfil extraído → una repregunta por chat (o voz) → confirmar.
2. Dashboard: "N licitaciones para vos", la primera con 92 % y "cierra en 5 días".
3. Detalle: resumen, ítems que vendemos, **precio sugerido** con banda histórica y competidores, documentación (falta BSE: alcanzable), fechas con visita.
4. Chat: "¿piden muestras?" → respuesta con cita.
5. Variación del jurado: pegar una URL nueva de ARCE o cambiar productos del perfil.

## 8. Limitaciones declaradas

- ARCE no publica ofertas perdedoras: el precio es **ganador histórico**, no probabilidad de ganar.
- Precios sin IVA; monedas no convertidas.
- Pliegos escaneados o en formatos no soportados (7z, dwg) no se leen; el análisis cae a metadata con confianza ≤ 50.
- Compras Directas que se publican ya adjudicadas no aparecen como oportunidades (sí alimentan el histórico).
- La IA puede equivocarse: por eso muestra confianza y razón, y nunca descarta sola.
- Un usuario por empresa; sin RLS; sin OCR; sin email.

## 9. Mapeo con la rúbrica

| Criterio (peso) | Cómo lo cubrimos |
|---|---|
| Producto funcionando (35 %) | Flujo completo end-to-end con datos reales de ARCE; "Analizar por URL" demuestra entradas nuevas; errores manejados |
| Valor para el usuario (25 %) | Caso concreto: barraca que hoy no licita → en 5 minutos tiene 10 oportunidades con precio y papeles |
| Calidad de IA (20 %) | Confianza + razón, citas en el chat, limitaciones declaradas, página "Cómo funciona", eval con 20 casos etiquetados |
| Experiencia (10 %) | Dashboard legible en 10 s, progreso visible, estados vacíos/error |
| Originalidad (10 %) | Perfil por entrevista (voz), precio ganador + competencia por ítem, gap documental con "¿llegás?" |
