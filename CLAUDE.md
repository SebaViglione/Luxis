# Luxis — contexto para Claude Code

Analizador de licitaciones públicas de Uruguay (ARCE) para barracas de materiales de construcción. Hackathon build 101, un día. Equipo: seba (infra, datos, IA de matching/precio/análisis, integración), rafa (auth, onboarding, chat del pliego, voz), maxi (UI, notificaciones, calendario, demo).

## Leé antes de actuar
- `docs/README.md` → índice. Tu brief: `docs/tareas/<nombre>.md`. Contratos, schema y **propiedad de carpetas**: `docs/03-arquitectura.md`. Datos: `docs/02-datos-arce.md`.

## Reglas
1. Antes de tocar archivos: `git checkout main && git pull && git checkout -b <branch de la tarea>`.
2. Editás solo las carpetas de tu persona (doc 03 §2). `src/lib/types.ts` y `src/db/schema.ts` los cambia solo seba. Nadie corre `db:push` salvo seba.
3. Stack fijo: Next.js 16 App Router + TS estricto + Tailwind 4 + shadcn/ui + Drizzle + Supabase Auth (`@supabase/ssr`) + Vercel AI SDK. Sin otras librerías de UI/estado/ORM. Consultá docs actuales (Context7) antes de usar una API que no conozcas bien.
4. IA real siempre: nada hardcodeado ni simulado. `generateObject` + zod para salidas estructuradas, `temperature 0` en extracción. Modelos solo desde `src/lib/ia/modelos.ts` (rápido = Haiku 5.5 para lo masivo; fuerte = Sonnet 5.5 solo en interacción directa).
5. UI en español rioplatense con estados vacío/carga/error y mensajes de progreso reales. Diseño sobrio: shadcn tal cual, Geist + Geist Mono, acento ladrillo `#C4502B`, sin gradientes genéricos ni emojis como íconos; reactbits solo donde el brief de maxi lo indica.
6. Secretos solo en `.env.local`. Base de datos compartida: no borres datos ajenos.
7. `npm run lint && npm run build` antes del PR. Commits convencionales en español. PR `S1:`/`R1:`/`M1:`.
8. Una tarea por conversación. Decisión faltante → la más simple que funcione hoy, anotada en el PR.

## Comandos
`npm run dev` · `npm run db:check` · `npm run db:push` (solo seba) · `npm run ingest:vigentes` · `npm run ingest:adjudicaciones -- --desde 2024-01-01` · `npm run analizar:pendientes` · `npm run seed:demo` · `npm run eval:matching`
