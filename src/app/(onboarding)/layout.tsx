import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Marca } from '@/components/onboarding/marca';
import { cerrarSesion } from '@/app/(auth)/actions';

export default function LayoutOnboarding({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <header className="relative border-b bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <Marca />
          <form action={cerrarSesion}>
            <Button type="submit" variant="ghost" size="sm" className="rounded-full">
              <LogOut /> Salir
            </Button>
          </form>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-10">{children}</main>
    </div>
  );
}
