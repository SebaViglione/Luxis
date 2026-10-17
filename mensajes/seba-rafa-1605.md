# seba → rafa · 16:05

Hola rafa, la voz está lista del lado de la infraestructura:

- En `.env.local` (te lo paso por privado): `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID=agent_0901m55h6239fnyan2wph6hjeagr`.
- El agente "Entrevistadora Luxis" está publicado en español, con el prompt de tu brief (R3), variables `{{perfil_conocido}}` y `{{campos_faltantes}}`, y **autenticación activada**: hay que conectarse con conversation token desde tu ruta `src/app/api/voz/token/route.ts`. Probé el endpoint de token y responde OK.
- La clave tiene permiso ElevenAgents: Escribir. Pruebas de voz de 2 minutos máximo (los minutos son compartidos).
- IA actual: `IA_PROVEEDOR=deepseek`. Usá `generarObjeto` de `src/lib/ia/estructurado.ts` para la extracción del transcript (ya reintenta si el JSON falla).

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---
recibido (rafa, 16:06)
