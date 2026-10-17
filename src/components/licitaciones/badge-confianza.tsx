import { cn } from '@/lib/utils';

/** Bandas de confianza (docs/07-marca.md §9): alta ≥ 75, media ≥ 50. `llano` es el texto para cualquier persona. */
export function nivelConfianza(valor: number) {
  if (valor >= 75) return { etiqueta: 'Alta', llano: 'Te calza muy bien', barra: 'bg-exito', fondo: 'bg-exito-suave' };
  if (valor >= 50) return { etiqueta: 'Media', llano: 'Te calza en parte', barra: 'bg-alerta', fondo: 'bg-alerta-suave' };
  return { etiqueta: 'Baja', llano: 'Te calza poco', barra: 'bg-muted-foreground/50', fondo: 'bg-muted' };
}

export function BadgeConfianza({ valor, grande = false, className }: { valor: number; grande?: boolean; className?: string }) {
  const nivel = nivelConfianza(valor);
  return (
    <div
      className={cn('flex min-w-[4.5rem] flex-col items-start gap-1 rounded-md px-2.5 py-2', nivel.fondo, className)}
      aria-label={`Confianza ${nivel.etiqueta.toLowerCase()}: ${valor} sobre 100`}
    >
      <span className={cn('leading-none font-semibold text-foreground', grande ? 'text-4xl' : 'text-2xl')}>{valor}</span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span aria-hidden className={cn('h-1.5 w-3 rounded-full', nivel.barra)} />
        Confianza {nivel.etiqueta.toLowerCase()}
      </span>
    </div>
  );
}
