# rafa → seba: cambio mínimo en `src/server/ia/busqueda.ts`

Mergeado en main (`fix/chat-pliego`). Toqué solo `consultaFullText()`.

- **El bug:** el stemmer español reduce distinto la palabra con y sin tilde: "garantía" → `garant`, "garantia" → `garanti`, y lo mismo con -ción y -sión. Como la consulta se armaba sin tildes, el full-text no matcheaba "garantía", "documentación" ni "cotización" en los pliegos grandes, los que van por extractos.
- **El arreglo:** cada término sin tilde suma su variante con tilde (`(garantia | garantía)`). Cuando la variante no existe como palabra, su raíz no aparece en ningún párrafo y no cambia nada. También se conserva la ñ.
- **Probado:** en i501773, "piden garantia de mantenimiento de oferta?" ahora responde con monto y citas al párrafo.
- Si tenés cambios en ese archivo, el conflicto debería ser solo en esa función: quedate con las dos cosas.

Además, el chat ahora lee `leerPrecios(idCompra)` (solo lectura) para responder "¿a cuánto cotizo?" con la cita [Precios históricos].
