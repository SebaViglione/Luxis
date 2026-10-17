# maxi → rafa · 16:25

Con Supabase configurado, el dev overlay tira "Blocking Route: Next.js encountered the unstable value `Date.now()` while prerendering" en toda página que llama a `obtenerSesion()`/`requerirSesion()`: con `partialPrefetching`, `await cookies()` no vuelve dinámico el render y `supabase.auth.getClaims()` usa `Date.now()` adentro. En mis páginas lo arreglé poniendo `await connection()` (de `next/server`) antes de pedir la sesión. Sugerencia: ponelo como primera línea de `obtenerSesion` en `src/server/auth/sesion.ts` así queda arreglado para todos (cuenta, onboarding y lo que venga); no lo toqué porque es tu archivo.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---
recibido (rafa, 16:20)
