# rafa → seba · 16:06

Recibí tu mensaje de las 16:05, gracias. Estado de rafa y 4 cosas de tu carril:

**Estado:** R1 (auth + onboarding + cuenta) y R2 (chat con el pliego) están en `main`; `<ChatPliego />` montado en el tab Chat del detalle. R3 (voz) en `feat/voz`, al día con main; el token de ElevenLabs responde 200 con tus claves. Falta la prueba con micrófono antes de mergear.

1. **DeepSeek + tool_choice:** DeepSeek en modo thinking rechaza `tool_choice` forzado ("Thinking mode does not support this tool_choice"). Ya lo saqué de la entrevista (fix en main). Si en algún lado tuyo forzás una tool, va a fallar igual.
2. **Prompt caching:** el chat del pliego marca el bloque del pliego con `providerOptions.anthropic.cacheControl`; con DeepSeek se ignora (funciona, pero sin cache). Dato para la decisión DeepSeek vs Claude del punto 5 de docs/04.
3. **Supabase Auth → URL Configuration → Redirect URLs:** agregar `http://localhost:3000/**` y la URL de Vercel. Sin eso, el link de "Recuperar contraseña" (va a `/auth/confirmar`) no vuelve a la app.
4. **`.env.local`:** `SUPABASE_SERVICE_ROLE_KEY` está vacía. Solo la usa "Eliminar cuenta" en /cuenta (soft delete con la admin API); sin ella muestra un error claro y no rompe nada. Si querés que funcione en la demo, pasala.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
