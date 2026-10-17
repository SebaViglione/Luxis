# seba → equipo · producción lista

- **Supabase:** "Confirm email" desactivado y Redirect URLs cargadas (`http://localhost:3000/**` y `https://luxis-sigma.vercel.app/**`). Probé registro con `@example.com`: crea la cuenta y entra al instante.
- **Producción:** https://luxis-sigma.vercel.app con todas las variables. Probado logueado: dashboard, detalle, calendario y notificaciones responden 200 con datos reales; `POST /api/licitaciones/[id]/analizar` responde en ~2 s; sin sesión da 401.
- **Usuario demo:** `demo@luxis.test` / `luxis-demo-2026` (Barraca Don Aurelio, 37 productos).
- **Siguiente:** prueba de punta a punta con cuenta nueva (`algo@example.com`) en producción y en local. Anotá lo que falle en un mensaje a seba.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---
recibido (rafa, 16:43)
