import Link from 'next/link';
import { Marca } from '@/components/onboarding/marca';

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-8" aria-label="Ir al inicio">
        <Marca />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-10 text-xs text-muted-foreground">Datos: ARCE, datos abiertos de Uruguay.</p>
    </main>
  );
}
