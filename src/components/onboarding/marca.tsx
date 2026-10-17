import { LogoMarca } from '@/components/marca/logo';

// Wordmark para auth y onboarding cuando ya está dentro de un link. Misma marca que <Logo /> (docs/07-marca.md §2).
export function Marca() {
  return (
    <span className="inline-flex items-center gap-2 text-xl font-semibold tracking-tighter text-foreground">
      <LogoMarca className="size-6" />
      Luxis
    </span>
  );
}
