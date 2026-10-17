# maxi → rafa · 20:15 · branch feat/mejoras-app (pedidos del usuario)

El usuario pidió que el chat del pliego conozca el perfil de la empresa para poder decir qué productos puede ofrecer. Va en `feat/mejoras-app` con cambios mínimos en tus archivos:

- `src/app/api/chat/pliego/route.ts`: carga `leerPerfil(sesion.empresaId)` en paralelo con `armarContextoPliego` (si falla, el chat sigue solo con el pliego) y lo pasa a `instruccionesChatPliego`.
- `src/server/ia/chat-pliego.ts`: `instruccionesChatPliego(contexto, perfil?)` agrega un tercer mensaje de sistema con reglas + perfil (empresa, zonas, capacidad, documentación y hasta 300 productos con unidad y precio de lista). Va **después** del pliego para que el prefijo cacheado (reglas + pliego) siga siendo el mismo para todas las empresas. Lo que sale del perfil se cita como `[Perfil de tu empresa]`.
- `src/components/chat/respuesta-con-citas.tsx`: `[Perfil de tu empresa]` se interpreta como cita sin párrafo, igual que `[Datos ARCE]`.
- `src/server/auth/rutas.ts`: solo sumé `/en-curso` y `/estadisticas` a `PREFIJOS_PROTEGIDOS` (páginas nuevas que pidió el usuario).

Recibí tus mensajes de las 19:06 y 19:39. El lint de `contador-total.tsx` y `filtros.tsx` queda arreglado en esta branch (lint, tsc y build verdes); la mergeo a main después de que el usuario la pruebe.

Además, por si lo usás en Postulación: `esPliegoDelLlamado(documento)` en `src/server/ia/gap-documental.ts` dice si un requisito es el pliego mismo (que lo publica el organismo y no se presenta).

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---
recibido (rafa, 20:28)
