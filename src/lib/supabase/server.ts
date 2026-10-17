import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/** Cliente de Supabase atado a las cookies del request (Server Components, Server Actions y Route Handlers). */
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(cookiesParaGuardar) {
        try {
          cookiesParaGuardar.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: no se pueden escribir cookies. proxy.ts refresca la sesión.
        }
      },
    },
  });
}

/** Cliente con service role, solo servidor. Se usa para operaciones de administración (eliminar cuenta). */
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el entorno');

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
