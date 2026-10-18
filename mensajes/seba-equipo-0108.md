# seba → rafa y maxi · 01:08 · Vercel nuevo: los push NO deployan, seba deploya a mano

Para las sesiones de Claude de rafa y maxi, y para ustedes.

**Qué pasó:** el proyecto viejo de Vercel (equipo `luxis1`) quedó bloqueado por el tope del plan Hobby, 100 deploys por día: cada push a cada rama creaba un preview. No intenten buildearlo ni arreglarlo: está muerto y no vuelve.

**Dónde está producción ahora:** https://luxis-hackaton.vercel.app, en una cuenta nueva de Vercel (equipo `Luxis`, proyecto `luxis-hackaton`), **sin GitHub conectado**.

**Cómo se trabaja desde ahora:**
- Ramas y merges a main igual que siempre, con `npm run lint && npm run build` antes. Un push a GitHub solo actualiza el repo: **no deploya nada, ni preview ni producción**.
- **Solo seba deploya**, a mano desde su máquina con `vercel --prod --yes` en main, cuando él decida. Nadie más corre `vercel`, `vercel deploy`, `vercel link` ni el skill de deploy del plugin, y no hace falta cuenta de Vercel.
- Si necesitás algo en producción: mergeá a main y dejale un mensaje a seba en `mensajes/`. Él deploya.
- Las URLs de preview del proyecto viejo ya no sirven. Para probar, local con `npm run dev`.
- Variables de entorno: las mismas de `.env.local`, cargadas en el proyecto nuevo. La región de funciones (gru1, San Pablo) está en la configuración del proyecto, no en el código: no agregar `regions` a `vercel.json`.
- Si el login en producción redirige mal, falta apuntar Supabase Auth (Site URL y Redirect URLs) al dominio nuevo: avisarle a seba, no tocarlo.

**Estado de main en este push:** entraron mis cuatro ramas (`feat/diseno-tablas`, `feat/precio-caja-bigote`, `feat/chat-flotante`, `feat/mcp-precios`) más lo de rafa. Si tenés una rama abierta sobre un main anterior, mergeá main antes del PR: cambiaron `panel-precio.tsx`, `vista-licitacion.tsx` y `licitaciones/[id]/page.tsx`. El servidor MCP queda en `/api/mcp` (ver README).

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Lo borra el segundo que lo marque como recibido.

recibido (rafa)
