import { Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ItemLicitacion, ItemOfertable } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cantidad, suavizarMayusculas } from './formato';

/** Todos los ítems de la compra, con los que la empresa vende marcados y el producto propio al lado. */
export function TablaItems({ items, ofertables, segunPliego = false }: { items: ItemLicitacion[]; ofertables: ItemOfertable[]; segunPliego?: boolean }) {
  const porNro = new Map(ofertables.map((o) => [o.nroItem, o]));
  const vendes = items.filter((i) => porNro.get(i.nroItem)?.puedeOfertar).length;

  return (
    <section className="space-y-3" aria-labelledby="titulo-items">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="space-y-0.5">
          <h2 id="titulo-items" className="text-lg font-semibold">{segunPliego ? 'Ítems según el pliego' : 'Ítems de la licitación'}</h2>
          <p className="text-sm text-muted-foreground">
            {segunPliego
              ? 'ARCE no publicó los ítems de esta compra: los tomamos de lo que leímos en el pliego.'
              : 'Todo lo que pide el organismo. Lo que vendés está marcado; el resto no está en tu lista de productos.'}
          </p>
        </div>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Vendés <span className="font-medium text-foreground">{vendes}</span> de {items.length}
        </p>
      </div>
      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-right">Nº</TableHead>
              <TableHead>Qué piden</TableHead>
              <TableHead className="w-36 text-right">Cantidad</TableHead>
              <TableHead className="w-[36%]">Lo que ofrecés</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const o = porNro.get(item.nroItem);
              const si = o?.puedeOfertar ?? false;
              return (
                <TableRow key={item.nroItem} className={cn(!si && 'text-muted-foreground')}>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground tabular-nums">{item.nroItem}</TableCell>
                  <TableCell className={cn('whitespace-normal', si && 'font-medium')}>{suavizarMayusculas(item.descripcion)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono tabular-nums">{Number.isFinite(item.cantidad) ? cantidad(item.cantidad) : '—'}</span>
                    {item.unidad && <span className="ml-1.5 text-xs text-muted-foreground">{item.unidad.toLowerCase()}</span>}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {si ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-exito-suave px-2 py-0.5 text-xs font-medium text-exito">
                          <Check aria-hidden className="size-3" /> Lo vendés
                        </span>
                        {o?.productoEmpresa && <span title={o.nota || undefined}>{o.productoEmpresa}</span>}
                      </span>
                    ) : (
                      <span aria-label="No lo vendés">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
