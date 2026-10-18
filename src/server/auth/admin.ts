/**
 * Pedido con `Authorization: Bearer CRON_SECRET` (cron de Vercel o uso manual del equipo).
 * Las variantes caras de las rutas (reevaluar todo, forzar el modelo fuerte, recalcular precios) quedan solo para estos
 * pedidos: la app no las usa y un usuario repitiéndolas gastaría IA sin freno.
 */
export function esPedidoAdmin(req: Request) {
  const secreto = process.env.CRON_SECRET;
  return !!secreto && req.headers.get('authorization') === `Bearer ${secreto}`;
}
