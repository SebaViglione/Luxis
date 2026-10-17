# Preguntas abiertas con decisión por defecto

Regla: nadie se bloquea. Si una pregunta no tiene respuesta del dueño, vale la **decisión por defecto**. Si alguien la cambia, avisa en el canal y actualiza este archivo.

| # | Pregunta | Decisión por defecto | Dueño | Estado |
|---|---|---|---|---|
| 1 | ¿Convertimos USD/UI a pesos para comparar precios? | No. Agrupar por moneda y unidad; mostrar la moneda. | seba | decidido |
| 2 | ¿Cuánto histórico de adjudicaciones? | Desde 2024-01-01 (24 meses de estadística + margen). | seba | decidido |
| 3 | ¿Umbral de confianza para mostrar en el dashboard? | ≥ 40 se considera relevante; filtro por defecto en 60; nunca se oculta del todo (lista "descartadas / baja confianza"). | seba | decidido |
| 4 | ¿Qué hacemos con ítems `id_articulo = 0` (texto libre)? | Precio por similitud trigram ≥ 0.6 sobre la descripción normalizada; si no hay, "sin historial". | seba | decidido |
| 5 | ¿Análisis del pliego para todas las licitaciones o on-demand? | Masivo con modelo rápido para las del rubro abiertas; on-demand con modelo fuerte desde el detalle (`?forzar=1`). | seba | decidido |
| 6 | ¿Guardamos los archivos de pliegos? | No; solo texto en DB y link al original. | seba | decidido |
| 7 | ¿Un usuario puede tener varias empresas o varias personas una empresa? | No hoy: 1 usuario ↔ 1 empresa. | rafa | decidido |
| 8 | ¿Confirmación de email en el registro? | Desactivada en Supabase para la demo. | seba | decidido |
| 9 | ¿La entrevista por voz usa el LLM de ElevenLabs o el nuestro? | El de ElevenLabs conversa; nuestro Claude extrae el perfil del transcript. | rafa | decidido |
| 10 | ¿Qué pasa si se agotan los minutos de ElevenLabs? | Fallback Web Speech API + chat; se declara. | rafa | decidido |
| 11 | ¿Tipos de compra a mostrar como oportunidad? | Todas con llamado abierto (`fecha_tope_ofertas > ahora`), cualquier tipo. Las ya adjudicadas solo alimentan el histórico. | seba | decidido |
| 12 | ¿Cómo tratamos la Compra Directa sin pliego? | Análisis por metadata, confianza ≤ 50, aviso. | seba | decidido |
| 13 | ¿Días hábiles o corridos para "¿llegás con el documento?"? | Hábiles (lunes a viernes, sin feriados). | seba | decidido |
| 14 | ¿Mostramos precio sugerido como número único o banda? | Banda p25–mediana con un número destacado dentro de la banda y la explicación. | maxi | decidido |
| 15 | ¿Dark mode? | No. | maxi | decidido |
| 16 | ¿Dominio propio? | No; URL de Vercel. | seba | decidido |
| 17 | ¿Cómo mide el jurado la calidad de la IA? | `demo-assets/casos-eval.json` (20 casos) → precisión/recall en "Cómo funciona la IA". | seba/maxi | decidido |
| 18 | ¿Qué pasa con licitaciones que requieren visita ya pasada? | Se muestran con aviso "visita vencida" y la confianza baja 20 puntos en el gap. | seba | pendiente de validar en datos |
| 19 | ¿Seguimiento presentada/ganada/perdida? | Solo el estado del match (sin estadísticas). | rafa | decidido |
| 20 | ¿Backfill desde Tenki o local? | Local en la máquina de seba; Tenki solo si la máquina está ocupada o se corta internet. | seba | decidido |
