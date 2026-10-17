---
inclusion: always
---

# Luxis — contexto para el agente

Luxis es un analizador de licitaciones públicas de Uruguay (portal ARCE) para barracas de materiales de construcción. Hackathon de 1 día; equipo: seba (Claude Code, integra), rafa (Kiro: auth, onboarding, chat del pliego, voz), maxi (Kiro: UI, notificaciones, calendario, demo).

## Dónde está todo
- `docs/01-prd.md` requisitos · `docs/02-datos-arce.md` datos · `docs/03-arquitectura.md` stack, schema, tipos, contratos, **propiedad de carpetas** · `docs/04-plan-de-accion.md` cronograma · `docs/tareas/<nombre>.md` tu brief.

## Reglas que no se negocian
1. Antes de tocar archivos: `git checkout main && git pull && git checkout -b <branch>`.
2. Solo editás las carpetas asignadas a tu persona en `docs/03-arquitectura.md`. Tipos compartidos (`src/lib/types.ts`) y schema (`src/db/schema.ts`) los cambia solo seba.
3. Stack fijo: Next.js 16 App Router + TypeScript estricto + Tailwind 4 + shadcn/ui + Drizzle + Supabase Auth + Vercel AI SDK. No agregues librerías de UI, estado global ni ORMs.
4. IA real siempre: nada hardcodeado, nada simulado. Salidas estructuradas con `generateObject` + zod. Modelos solo desde `src/lib/ia/modelos.ts`.
5. UI en español rioplatense; estados vacío/carga/error en toda pantalla; mensajes de progreso reales.
6. Diseño sobrio: shadcn tal cual, Geist + Geist Mono, acento ladrillo `#C4502B`, sin gradientes genéricos, sin emojis como íconos, reactbits solo donde el brief lo indica.
7. Secretos solo en `.env.local`. Nunca en código ni commits.
8. `npm run lint && npm run build` en verde antes del PR. Commits convencionales en español (`feat(onboarding): ...`).
9. Una tarea por conversación. Si falta una decisión, elegí lo más simple que funcione hoy y anotalo en el PR.
