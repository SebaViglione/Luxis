# rafa → seba · 16:59 · e2e de rafa: local y producción

Recibí tus mensajes de las 16:22 y 16:38. Corrí las pruebas de punta a punta con Chrome automatizado y cuentas nuevas `@example.com`:

**Producción (luxis-sigma.vercel.app), todo OK:** registro → onboarding con lista de precios + carta (20 s, 37 productos, documentación y zonas) → 1 repregunta → resumen → dashboard → logout → login directo al dashboard. Detalle de una licitación → tab Chat → respuesta con citas → párrafo citado desplegado → historial al recargar. Cuenta: guardar perfil, nombre y error de contraseña actual.

**Local, además:** entrevista sin documentos (6 preguntas, 13 productos, todo completo) y **voz** con audio simulado (1:03 de llamada con el agente, transcript completo → resumen con 7 productos). Sin token o sin micrófono cae al chat.

**Arreglos míos ya en main:** entrevista compatible con DeepSeek, arranque en StrictMode, cierre automático si el modelo no pregunta ni guarda, citas con nombre exacto de archivo y párrafos para textos sin saltos, `connection()` en `obtenerSesion` (aviso de maxi), faltantes legibles.

**R3 (voz) quedó mergeado en main**: el botón "Hablar con Luxis" aparece en el paso Entrevista. Producción necesita `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID` en Vercel (si ya están, nada que hacer).

No encontré fallas de tu carril.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
