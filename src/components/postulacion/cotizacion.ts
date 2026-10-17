// Cotización inicial: ítems que vende la empresa con el precio sugerido por el histórico o su precio de lista.
import type { DatosPagina, LineaCotizacion } from '@/server/postulacion/tipos';

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();

export function lineasIniciales(d: DatosPagina): LineaCotizacion[] {
  const ofertables = new Map(d.ofertables.map((o) => [o.nroItem, o]));
  const precios = new Map(d.precios.map((p) => [p.nroItem, p]));
  const productos = new Map(d.empresa.productos.map((p) => [normalizar(p.nombre), p]));
  const hayMatch = d.ofertables.length > 0;
  return d.items.map((item) => {
    const o = ofertables.get(item.nroItem);
    const producto = o?.productoEmpresa ? productos.get(normalizar(o.productoEmpresa)) : undefined;
    const sugerido = precios.get(item.nroItem)?.precioSugerido ?? null;
    return {
      nroItem: item.nroItem,
      incluir: hayMatch ? Boolean(o?.puedeOfertar) : true,
      descripcion: item.descripcion,
      productoEmpresa: o?.productoEmpresa ?? null,
      cantidad: item.cantidad,
      unidad: item.unidad,
      precioUnitario: sugerido ?? producto?.precioReferencia ?? null,
      moneda: item.moneda,
      iva: 22,
      caracteristicas: '',
    };
  });
}
