import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });

/**
 * Crea (o actualiza) la empresa de demo: barraca ficticia de Las Piedras.
 * - Con SUPABASE_SERVICE_ROLE_KEY: crea también el usuario de login demo@luxis.test (contraseña en DEMO_PASSWORD o "luxis-demo-2026").
 * - Con clave de IA: corre el matching y el análisis de pliegos de sus matches.
 * Los datos son del perfil de la empresa (ficticia, docs/05-rubrica-demo-pitch.md §3), no resultados de IA.
 */
const EMPRESA = {
  nombre: 'Barraca Don Aurelio', razonSocial: 'Barraca Don Aurelio S.R.L.', rut: '217845320011',
  departamento: 'Canelones', localidad: 'Las Piedras', web: 'https://barracadonaurelio.example', telefono: '2364 1234', emailContacto: 'ventas@barracadonaurelio.example',
  descripcion: 'Barraca familiar de Las Piedras con 12 empleados. Venta de materiales de construcción, hierro y maderas, con reparto propio.',
  zonasEntrega: ['Canelones', 'Montevideo', 'San José', 'Florida'],
  capacidadNotas: '4 camiones por semana; hasta 20 toneladas de áridos o 400 bolsas de portland por entrega.',
};
const PRODUCTOS: Array<[string, string, string, number]> = [
  ['Cemento Portland bolsa 25 kg', 'Aglomerantes', 'bolsa', 390], ['Cemento Portland a granel', 'Aglomerantes', 'tonelada', 12500],
  ['Cal hidratada bolsa 25 kg', 'Aglomerantes', 'bolsa', 260], ['Arena fina', 'Áridos', 'm3', 1150], ['Arena terciada', 'Áridos', 'm3', 1250],
  ['Arena gruesa', 'Áridos', 'm3', 1200], ['Pedregullo', 'Áridos', 'm3', 1650], ['Balasto', 'Áridos', 'm3', 900], ['Tosca', 'Áridos', 'm3', 750],
  ['Ladrillo de campo', 'Mampostería', 'unidad', 9], ['Ticholo 12x25x25', 'Mampostería', 'unidad', 38], ['Bloque de hormigón 12', 'Mampostería', 'unidad', 45],
  ['Varilla de hierro lisa 6 mm (barra 6 m)', 'Hierro', 'unidad', 95], ['Varilla de hierro torsionada 8 mm (barra 6 m)', 'Hierro', 'unidad', 165],
  ['Varilla de hierro torsionada 10 mm (barra 6 m)', 'Hierro', 'unidad', 255], ['Varilla de hierro torsionada 12 mm (barra 6 m)', 'Hierro', 'unidad', 365],
  ['Malla electrosoldada 15x15 4,2 mm', 'Hierro', 'unidad', 1450], ['Alambre de atar recocido', 'Hierro', 'kg', 120],
  ['Chapa galvanizada acanalada C24', 'Techos', 'unidad', 790], ['Caño PVC 110 mm (6 m)', 'Sanitaria', 'unidad', 690], ['Caño PVC 40 mm (3 m)', 'Sanitaria', 'unidad', 160],
  ['Tirante de pino 3x6"', 'Maderas', 'metro', 210], ['Tabla de pino 1x6"', 'Maderas', 'metro', 85], ['Compensado fenólico 18 mm', 'Maderas', 'unidad', 2400],
  ['Placa de yeso 12,5 mm', 'Construcción en seco', 'unidad', 420], ['Membrana asfáltica 4 mm', 'Impermeabilización', 'rollo', 2900],
  ['Adhesivo para cerámica 25 kg', 'Terminaciones', 'bolsa', 330], ['Pastina 5 kg', 'Terminaciones', 'bolsa', 290], ['Cerámica piso 45x45', 'Terminaciones', 'm2', 520],
  ['Clavos 2,5"', 'Ferretería', 'kg', 140],
];
const DOCUMENTOS: Array<[string, string, string]> = [
  ['RUPE', 'Registro Único de Proveedores del Estado', 'vigente'], ['DGI', 'Certificado único DGI', 'vigente'], ['BPS', 'Certificado común BPS', 'vigente'],
  ['BSE', 'Póliza de accidentes de trabajo BSE', 'vigente'], ['UNIT', 'Certificación UNIT de producto', 'no_tiene'], ['ISO', 'ISO 9001', 'no_tiene'],
];

const arg = (n: string) => process.argv.includes(`--${n}`);

async function main() {
  const { db, schema } = await import('@/db');
  const { eq } = await import('drizzle-orm');
  const { normalizarTexto } = await import('@/server/arce/normalizar');
  const email = 'demo@luxis.test';
  let userId: string | null = null;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const password = process.env.DEMO_PASSWORD ?? 'luxis-demo-2026';
    const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = lista?.users.find((u) => u.email === email)?.id ?? null;
    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre: 'Aurelio (demo)' } });
      if (error) throw error;
      userId = data.user.id;
    }
    console.log(`✓ Usuario demo: ${email}`);
  } else {
    console.log('· Sin SUPABASE_SERVICE_ROLE_KEY: creo solo la empresa (sin usuario de login).');
  }

  const existente = userId ? (await db.select().from(schema.perfilesUsuario).where(eq(schema.perfilesUsuario.id, userId)))[0] : undefined;
  let empresaId = existente?.empresaId ?? (await db.select({ id: schema.empresas.id }).from(schema.empresas).where(eq(schema.empresas.rut, EMPRESA.rut)))[0]?.id ?? null;
  const perfilJson = {
    ...EMPRESA, productos: PRODUCTOS.map(([nombre, categoria, unidad, precio]) => ({ nombre, categoria, unidad, precioReferencia: precio, moneda: 'UYU' as const, keywords: [], fuente: 'documento' as const })),
    documentacion: DOCUMENTOS.map(([tipo, nombre, estado]) => ({ tipo: tipo as 'RUPE', nombre, estado: estado as 'vigente', vencimiento: null })),
    experienciaLicitaciones: 'Se presentó a 2 licitaciones en 2025 y ganó 1.', camposFaltantes: [],
  };
  const datos = { ...EMPRESA, perfilJson, estadoOnboarding: 'completo', perfilActualizadoEn: new Date(), updatedAt: new Date() };
  if (empresaId) await db.update(schema.empresas).set(datos).where(eq(schema.empresas.id, empresaId));
  else empresaId = (await db.insert(schema.empresas).values(datos).returning({ id: schema.empresas.id }))[0].id;

  await db.delete(schema.empresaProductos).where(eq(schema.empresaProductos.empresaId, empresaId));
  await db.insert(schema.empresaProductos).values(PRODUCTOS.map(([nombre, categoria, unidad, precio]) => ({
    empresaId: empresaId!, nombre, nombreNormalizado: normalizarTexto(nombre), categoria, unidad, precioReferencia: String(precio), moneda: 'UYU', fuente: 'documento',
  })));
  await db.delete(schema.empresaDocumentos).where(eq(schema.empresaDocumentos.empresaId, empresaId));
  await db.insert(schema.empresaDocumentos).values(DOCUMENTOS.map(([tipo, nombre, estado]) => ({ empresaId: empresaId!, tipo, nombre, estado })));
  if (userId) {
    await db.insert(schema.perfilesUsuario).values({ id: userId, email, nombre: 'Aurelio (demo)', empresaId }).onConflictDoUpdate({ target: schema.perfilesUsuario.id, set: { empresaId } });
  }
  console.log(`✓ Empresa demo ${empresaId} con ${PRODUCTOS.length} productos y ${DOCUMENTOS.length} documentos`);

  if (arg('sin-ia')) process.exit(0);
  const { verificarIA } = await import('@/lib/ia/estructurado');
  try { verificarIA(); } catch (e) { console.log(`· ${(e as Error).message}. Saltando matching.`); process.exit(0); }
  const { evaluarEmpresa } = await import('@/server/ia/matching');
  console.log('Matching…');
  const r = await evaluarEmpresa(empresaId, { todas: arg('todas') });
  console.log(`✓ ${r.evaluadas} evaluadas · ${r.relevantes} relevantes · ${r.errores} errores`);
  process.exit(0);
}
main().catch((e) => { console.error('✗', (e as Error).message); process.exit(1); });
