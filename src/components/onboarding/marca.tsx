// Wordmark mínimo para las pantallas de auth y onboarding (fuera del layout de maxi).
// Cuando exista src/components/marca/logo.tsx, reemplazar por ese componente.
export function Marca() {
  return (
    <span className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
      <span aria-hidden className="size-3 rounded-[2px] bg-primary" />
      Luxis
    </span>
  );
}
