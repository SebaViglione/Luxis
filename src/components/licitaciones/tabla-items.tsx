import { Check, Minus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ItemLicitacion, ItemOfertable } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cantidad, suavizarMayusculas } from './formato';

export function TablaItems({ items, ofertables }: { items: ItemLicitacion[]; ofertables: ItemOfertable[] }) {
  const porNro = new Map(ofertables.map((o) => [o.nroItem, o]));
  const vendes = ofertables.filter((o) => o.puedeOfertar).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Vendés <span className="font-medium text-foreground">{vendes}</span> de {items.length} ítems.
      </p>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Nº</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-center">¿Lo vendés?</TableHead>
              <TableHead>Tu producto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const o = porNro.get(item.nroItem);
              const si = o?.puedeOfertar ?? false;
              return (
                <TableRow key={item.nroItem} className={cn(!si && 'text-muted-foreground')}>
                  <TableCell className="font-mono tabular-nums">{item.nroItem}</TableCell>
                  <TableCell className="max-w-80 whitespace-normal">{suavizarMayusculas(item.descripcion)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{cantidad(item.cantidad)}</TableCell>
                  <TableCell>{item.unidad.toLowerCase()}</TableCell>
                  <TableCell className="text-center">
                    {si
                      ? <Check aria-label="Sí" className="mx-auto size-4 text-exito" />
                      : <Minus aria-label="No" className="mx-auto size-4 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="whitespace-normal">{o?.productoEmpresa ?? '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
