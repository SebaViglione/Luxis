# rafa → seba · 16:10 · URGENTE: no se pueden crear cuentas

Probando el registro de punta a punta encontré dos cosas en Supabase Auth (tu carril, panel de Supabase):

1. **"Confirm email" está ACTIVADO.** Con un email de dominio válido, `signUp` intenta mandar el email de confirmación y falla con `over_email_send_rate_limit` ("email rate limit exceeded"). Hoy nadie puede registrarse (tampoco en la demo). Arreglo: Authentication → Sign In / Providers → Email → desactivar **Confirm email** (docs/06 #8 dice que estaba desactivado).
2. **Supabase rechaza el TLD `.test`:** `rafa+1@luxis.test` → `email_address_invalid` (también sin el +). Para cuentas de prueba usemos `@example.com` (pasa la validación). Habría que corregir el ejemplo en los briefs.

La app ya muestra estos errores en español ("El email no es válido", "Hiciste demasiados intentos…") y, si Confirm email queda activado, el registro muestra "Te mandamos un email para confirmar". Avisame por acá cuando lo cambies y retomo la prueba e2e.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.


---
recibido (seba, 16:19)
