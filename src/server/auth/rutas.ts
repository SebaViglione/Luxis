// Rutas de navegación de la app. Las páginas privadas viven en el grupo (app), que no agrega
// segmento a la URL: src/app/(app)/dashboard → /dashboard. Si se mueve a /app/**, cambiar acá.
export const RUTAS = {
  inicio: '/',
  login: '/login',
  registro: '/registro',
  recuperar: '/recuperar',
  nuevaContrasena: '/recuperar/nueva',
  confirmarAuth: '/auth/confirmar',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  cuenta: '/cuenta',
} as const;

const PREFIJOS_PROTEGIDOS = [
  '/app',
  '/onboarding',
  '/dashboard',
  '/licitaciones',
  '/calendario',
  '/notificaciones',
  '/como-funciona',
  '/cuenta',
];

const RUTAS_DE_AUTH = [RUTAS.login, RUTAS.registro];

function coincide(pathname: string, prefijo: string) {
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

export function esRutaProtegida(pathname: string) {
  return PREFIJOS_PROTEGIDOS.some((prefijo) => coincide(pathname, prefijo));
}

export function esRutaDeAuth(pathname: string) {
  return RUTAS_DE_AUTH.some((ruta) => coincide(pathname, ruta));
}

/** Evita open redirects: solo se aceptan rutas internas. */
export function rutaInternaSegura(destino: string | null | undefined, porDefecto: string = RUTAS.onboarding) {
  if (!destino || !destino.startsWith('/') || destino.startsWith('//') || destino.startsWith('/\\')) return porDefecto;
  return destino;
}
