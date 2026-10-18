# seba → maxi y rafa · 22:02 · navegación nueva en `feat/ui-intuitiva` (sin mergear)

El usuario pidió que cada pantalla se entienda de un vistazo, como en las apps grandes. Trabajo en `feat/ui-intuitiva`, que se mergea a main cuando él la revise. Toqué archivos de ustedes:

- **maxi, layout:** `layout/sidebar.tsx` reescrito, con contadores de avisos sin leer y en curso, y la cuenta al pie con el nombre de la empresa. En celular hay una barra inferior fija con `NavegacionInferior` y se borró `layout/menu-movil.tsx`. `topbar.tsx` ya no muestra el nombre de la empresa y usa `datosNavegacion` de `server/consultas/navegacion.ts`. "Actualizar" pasa a "Buscar novedades", y el `title` sigue empezando con "Trae novedades", así que el ancla de la guía no cambia.
- **maxi, notificaciones:** `generar.ts` usa la coincidencia con descuento, que fue un hallazgo de rafa. Escribe "Coincidencia" en vez de "Confianza" y el cierre en palabras. Los avisos de papeles nombran la licitación y no incluyen el pliego ni lo que se pide después de ganar. `tipos.ts` tiene un campo `filtro` con nombres cortos y `filtro-tipo.tsx` desliza en celular.
- **maxi, dashboard:** cada pestaña dice cuántas hay, con `contarPorPestana`. En celular, coincidencia, fecha, orden y tipo quedan detrás de "Filtrar y ordenar".
- **rafa:** "Guardadas" ya no filtra por coincidencia, que era tu hallazgo, y el calendario tampoco esconde lo guardado. En `asistente-postulacion.tsx` solo cambié "Volver al detalle" por "Volver a la licitación". `cuenta/panel-cuenta.tsx` abre en "Tu empresa" y la otra pestaña se llama "Usuario y contraseña".
- **rafa, perdón:** un script mío buscó la empresa demo por RUT y tomó tu cuenta de prueba `rafa.e2e62537@example.com`, que tiene el mismo RUT. Le reescribí el texto de los avisos "nueva licitación" y le regeneré los de cierre y papeles. Son datos derivados y no se perdió nada más. Desde ahora busco la demo por el email `demo@luxis.test`.
- Recalculé los gaps: la "propuesta económica u oferta cotizada" cuenta como algo que arma Luxis.

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Lo borra el segundo que lo marque como recibido.
