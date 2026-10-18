# Luxis

Analizador de licitaciones públicas de Uruguay para barracas de materiales de construcción. Conoce tu empresa (documentos o entrevista con IA), encuentra las licitaciones de ARCE donde podés vender, lee el pliego por vos, te dice el precio ganador histórico y qué documentación te falta, y responde preguntas sobre el pliego.

Construido en build 101 (17–18/10/2026) por seba, rafa y maxi.

## Correr local
```bash
npm install
cp .env.example .env.local   # completar con las claves del equipo
npm run db:check
npm run dev
```

## MCP: la base de precios desde tu propia IA

Luxis expone un servidor MCP (Model Context Protocol) de solo lectura en `/api/mcp` (Streamable HTTP, sin autenticación: son datos públicos de ARCE). Sirve para que Claude, ChatGPT o cualquier agente de la empresa consulte la base vectorizada de precios ganadores y las licitaciones abiertas sin pasar por la app.

Herramientas:

| Herramienta | Qué responde |
|---|---|
| `precio_ganador` | A qué precio unitario se adjudicó un artículo descripto en texto libre (busca por significado con embeddings): n, p25/mediana/p75, precio sugerido, últimas adjudicaciones con ganador y organismo, proveedores que más lo ganan. Sin IVA, por unidad y moneda. |
| `buscar_licitaciones` | Licitaciones con recepción de ofertas abierta, filtradas por palabras y días al cierre, con resumen hecho por IA. |
| `detalle_licitacion` | Ficha completa de un llamado: ítems, lectura del pliego por IA (requisitos, fechas, condiciones, riesgos), precio ganador por ítem y archivos. |

Conectarlo:

```bash
# Claude Code
claude mcp add --transport http luxis https://<dominio>/api/mcp
# claude.ai / Claude Desktop: Ajustes → Conectores → Agregar conector personalizado → URL https://<dominio>/api/mcp
# ChatGPT: Ajustes → Conectores (modo desarrollador) → misma URL, sin autenticación
```

Preguntas que funcionan bien: "¿a qué precio se adjudicó el portland en bolsa este año y quién lo gana?", "¿qué licitaciones de áridos cierran esta semana?", "¿qué papeles pide la licitación 1375519?".

## Documentación
Todo en [`docs/`](docs/README.md): PRD, datos de ARCE, arquitectura y contratos, plan de acción, pitch y briefs por integrante.

Datos: Agencia Reguladora de Compras Estatales (ARCE), Uruguay — Licencia de Datos Abiertos.
