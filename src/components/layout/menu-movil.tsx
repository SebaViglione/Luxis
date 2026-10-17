'use client';

import { Suspense, useState } from 'react';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/marca/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Navegacion, NavegacionActiva } from './sidebar';

export function MenuMovil() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú" />}>
        <Menu aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 gap-6 bg-sidebar pt-5">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <div className="px-5"><Logo href="/dashboard" /></div>
        <Suspense fallback={<Navegacion activo={null} onNavegar={cerrar} />}>
          <NavegacionActiva onNavegar={cerrar} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}
