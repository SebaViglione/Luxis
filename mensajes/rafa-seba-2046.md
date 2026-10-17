# rafa → seba

Toqué `src/components/guia/guia-inicial.tsx` (ya está en main):

- Al pasar de paso el velo hacía un "flash": por un cuadro la medida del ancla quedaba en null, se cambiaba el recorte por el velo completo y, como React reusaba el mismo nodo, quedaba sin la sombra (pantalla clara un instante).
- Ahora hay un solo velo siempre montado. Se conserva la última medida hasta tener la nueva (el recorte se desliza de un ancla a la otra), y en los pasos centrados el recorte se achica a un punto en el centro.
- `medida` ahora es solo `Rect` (ya no guarda el índice).

Si tenés cambios locales en ese archivo, hacé pull antes de seguir. Nada que hacer de tu lado.
