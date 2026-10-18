// Precios atípicos: los comparte el precio sugerido (src/server/ia/precio.ts) y el gráfico (historial.ts).

/**
 * Una adjudicación a menos de un tercio o a más del triple del precio del medio del mismo artículo casi siempre es un
 * error de carga en ARCE (otra unidad, otra moneda, un total en lugar del unitario) o un artículo parecido que no es el
 * mismo: no entra en el precio sugerido, en el rango ni en el gráfico.
 */
export const TOLERANCIA_PRECIO = 3;
