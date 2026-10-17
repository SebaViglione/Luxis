# Documentación de Luxis

Orden de lectura según rol:

| Rol | Leé primero | Después |
|---|---|---|
| Todos | `01-prd.md` (qué construimos y por qué) | `04-plan-de-accion.md` (cuándo y quién) · `06-preguntas-abiertas.md` |
| seba | `tareas/seba.md` | `02-datos-arce.md` · `03-arquitectura.md` |
| rafa | `tareas/rafa.md` | `03-arquitectura.md` (§4 tipos, §5 contratos, §6 pipeline) |
| maxi | `tareas/maxi.md` | `03-arquitectura.md` (§4, §5) · `05-rubrica-demo-pitch.md` |

| Archivo | Qué es |
|---|---|
| `01-prd.md` | PRD v2: problema, usuario, alcance MoSCoW, requisitos RF-01…RF-18 con criterios de aceptación, RNF, limitaciones, mapeo con la rúbrica |
| `02-datos-arce.md` | Fuentes de ARCE verificadas (XML, scraping, pliegos, codigueras, fallbacks), campos, ingesta, filtro de rubro, gotchas |
| `03-arquitectura.md` | Stack, carpetas con propiedad por persona, schema de DB, tipos compartidos, contratos entre módulos, pipeline de IA, plazos documentales, variables de entorno |
| `04-plan-de-accion.md` | Cronograma 14:00→21:00, sync points, plan de recorte, reglas de integración |
| `05-rubrica-demo-pitch.md` | Rúbrica, checklist de consigna, empresa demo, guion de 3 minutos, variaciones para el jurado, preguntas y respuestas, checklist pre-demo |
| `06-preguntas-abiertas.md` | Dudas con decisión por defecto y dueño |
| `07-marca.md` | Identidad de marca: logo, color, tipografía, voz, íconos, movimiento y patrones de UI |
| `tareas/seba.md` · `tareas/rafa.md` · `tareas/maxi.md` | Briefs para el agente de código de cada integrante, con tareas en orden, branch, archivos, cómo hacerlo, verificación y entrega |

Convenciones del repo: `CLAUDE.md` (Claude Code) y `.kiro/steering/luxis.md` (Kiro) tienen las mismas reglas.
