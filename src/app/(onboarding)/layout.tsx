import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Marca } from '@/components/onboarding/marca';
import { cerrarSesion } from '@/app/(auth)/actions';

export default function LayoutOnboarding({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <Marca />
          <form action={cerrarSesion}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut /> Salir
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
