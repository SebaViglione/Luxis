# Plan de acción — sábado 14:00 → 21:00

Tres personas, tres carriles, cuatro puntos de sincronización. Cada uno ejecuta sus tareas **en orden** (detalle en `docs/tareas/<nombre>.md`) y no arranca la siguiente sin cerrar la anterior (PR abierto y build verde). seba integra en `main`.

## Cronograma

| Franja | seba · Claude Code | rafa · Kiro | maxi · Kiro |
|---|---|---|---|
| 14:00–14:45 | **S0** `chore/bootstrap`: Supabase + Vercel, Next 16 + shadcn + Drizzle, schema, tipos, env, docs → `main` | **R0** claves Anthropic + ElevenLabs y agente de voz creado | **M0** `feat/demo-data`: barraca ficticia, keywords de rubro (entrega 14:45), 20 casos, guion v1 |
| 14:45–17:00 | **S1** `feat/ingesta-arce`: XML, scraper, descarga/extracción (zip, rar, pdf, doc, docx, xlsx), clasificación, filtro, scripts, refresh; backfill corriendo | **R1** `feat/auth-onboarding`: login/registro/cuenta, wizard de onboarding (archivos/URL + entrevista por chat), perfil editable | **M1** `feat/ui-dashboard`: identidad, layout, dashboard, detalle con tabs (mocks con las firmas reales) |
| 17:00–19:00 | **S2** `feat/matching-precio` (17:00–18:15) · **S3** `feat/analisis-pliego` (18:15–19:15) | **R2** `feat/chat-pliego`: chat con citas en el detalle | **M2** `feat/ui-real`: datos reales, notificaciones in-app, calendario, "Analizar por URL" |
| 19:00–20:30 | **S4** integración en `main`, deploy, seed demo, eval de 20 casos, bug bash | **R3** `feat/voz` (stretch, timebox 20:15) o bug bash | **M3** "Cómo funciona la IA", pulido, guion final, video de respaldo |
| 20:30–21:00 | **Freeze**: ensayo cronometrado ×2, checklist pre-demo, tag `v0.1-demo` | | |

## Sync points (5 minutos, por voz)

| Hora | Qué tiene que estar | Qué se decide |
|---|---|---|
| 14:45 | S0 en `main` (schema + tipos + `.env.local` repartido); keywords de maxi entregadas | Arranque de S1/R1/M1 |
| 17:00 | PRs S1, R1, M1 abiertos; seba mergea; demo interna 1 (registro → onboarding → dashboard con mocks) | Si falta algo, qué se recorta |
| 19:00 | PRs S2, S3, R2, M2; demo interna 2 con datos reales | Si entra la voz (R3) o no |
| 20:30 | Todo en `main`, deploy verde, video grabado | Freeze: solo bugs y copy |

## Plan de recorte (en este orden se cae)

1. Entrevista por voz (queda chat).
2. Calendario mensual (queda lista de fechas en el detalle).
3. Notificaciones (queda badge "cierra pronto" en las cards).
4. "Analizar por URL" (la variación del jurado pasa a ser cambiar el perfil o elegir cualquier licitación).
5. Página "Cómo funciona la IA" (queda un párrafo de limitaciones en el footer del dashboard).

**Nunca se recorta:** registro/login → onboarding → matching con confianza → detalle con precio histórico y documentación → chat con el pliego.

## Reglas de integración

- `main` siempre compila y levanta. Nadie pushea directo a `main` salvo seba al integrar.
- Branch por tarea, PR con título `S1: ...`, `R1: ...`, `M1: ...`; squash-merge.
- Conflictos: el dueño de la carpeta resuelve; `src/lib/types.ts` y `src/db/schema.ts` solo los toca seba.
- Cualquier cambio de contrato (`docs/03`) se anuncia en el canal antes de hacerlo.
- Deploy: automático desde `main` a Vercel; si el deploy falla no bloquea, la demo corre local.

## Comunicación

- Canal único del equipo (WhatsApp/Discord). Mensajes cortos: "PR R1 abierto", "necesito columna X en matches", "bloqueado por Y".
- `.env.local` y claves solo por mensaje directo, nunca en el repo ni en capturas.
- Horario de ElevenLabs: nadie hace pruebas de voz de más de 2 minutos; se reservan 20 minutos para la demo.
