import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';
import { RUTAS, rutaInternaSegura } from '@/server/auth/rutas';

/** Destino de los links de email de Supabase (recuperar contraseña, confirmar email). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const siguiente = rutaInternaSegura(searchParams.get('siguiente'));
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const tipo = searchParams.get('type') as EmailOtpType | null;

  const supabase = await crearClienteServidor();
  let error: { message: string } | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && tipo) {
    ({ error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash }));
  } else {
    error = { message: 'link incompleto' };
  }

  if (error) {
    const url = new URL(RUTAS.recuperar, request.url);
    url.searchParams.set('error', 'link_invalido');
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(siguiente, request.url));
}
