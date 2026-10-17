import { cantidad, monto, suavizarMayusculas } from '@/components/licitaciones/formato';
import type { ProductoVendido } from '@/server/estadisticas/consultas';

/** Barras horizontales ordenadas por monto adjudicado; cada barra lleva su valor rotulado (una sola serie, sin leyenda). */
export function RankingProductos({ productos }: { productos: ProductoVendido[] }) {
  if (!productos.length) return <p className="text-sm text-muted-foreground">Las licitaciones ganadas todavía no tienen líneas en pesos para armar el ranking.</p>;
  const max = Math.max(...productos.map((p) => p.monto), 1);
  return (
    <ol className="space-y-3">
      {productos.map((p, i) => {
        const unidad = p.unidad?.toLowerCase() ?? '';
        const detalle = `${suavizarMayusculas(p.producto)}: ${monto(p.monto)} sin IVA · ${cantidad(p.cantidad)} ${unidad} · ${p.lineas} ${p.lineas === 1 ? 'venta' : 'ventas'}`;
        return (
          <li key={p.producto} className="grid gap-1.5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center sm:gap-4" title={detalle}>
            <span className="flex min-w-0 items-baseline gap-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="truncate">{suavizarMayusculas(p.producto)}</span>
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden className="h-5 min-w-1 rounded-r-[4px] bg-foreground/75 transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${Math.max(2, (p.monto / max) * 100)}%` }} />
              <span className="shrink-0 text-sm">
                <span className="font-mono font-medium tabular-nums">{monto(p.monto)}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{cantidad(p.cantidad)} {unidad}</span>
              </span>
              <span className="sr-only">{detalle}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
