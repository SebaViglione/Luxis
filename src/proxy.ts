import type { NextRequest } from 'next/server';
import { actualizarSesion } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  // Todo menos assets estáticos, imágenes y archivos con extensión.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
