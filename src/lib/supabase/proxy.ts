import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { esRutaDeAuth, esRutaProtegida, RUTAS } from '@/server/auth/rutas';

/**
 * Refresca la sesión de Supabase en cada request y protege las rutas privadas.
 * Sigue el patrón oficial de @supabase/ssr: no ejecutar lógica entre createServerClient y getClaims().
 */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGuardar, headers) {
        cookiesParaGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesParaGuardar.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        Object.entries(headers).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const logueado = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!logueado && esRutaProtegida(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = RUTAS.login;
    url.search = '';
    url.searchParams.set('siguiente', pathname + search);
    return redirigirConCookies(url, respuesta);
  }

  // Un usuario logueado no necesita ver login/registro: lo mandamos al onboarding,
  // que a su vez lo deriva al dashboard si ya lo completó.
  if (logueado && esRutaDeAuth(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = RUTAS.onboarding;
    url.search = '';
    return redirigirConCookies(url, respuesta);
  }

  return respuesta;
}

function redirigirConCookies(url: URL, respuesta: NextResponse) {
  const redireccion = NextResponse.redirect(url);
  respuesta.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  return redireccion;
}
