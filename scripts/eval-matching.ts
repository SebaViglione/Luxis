import { config } from 'dotenv';
config({ path: '.env.local', quiet: true }); config({ quiet: true });
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Evaluación del matching contra casos etiquetados a mano (demo-assets/casos-eval.json, de maxi).
 * Para cada caso asegura que la licitación esté en la DB (scraping si hace falta), corre el matching
 * para la empresa demo y calcula precisión, recall y F1 con umbral de confianza 60. Escribe demo-assets/eval-resultado.json.
 */
interface Caso { idCompra?: string; url?: string; relevante: boolean; motivo?: string }
const UMBRAL = 60;

async function main() {
  const { db, schema } = await import('@/db');
  const { eq } = await import('drizzle-orm');
  const { idDesdeUrl, scrapeDetalle } = await import('@/server/arce/scraper');
  const { upsertLlamados } = await import('@/server/arce/guardar');
  const { procesarArchivos } = await import('@/server/arce/procesar-archivos');
  const { analizarLicitacion } = await import('@/server/ia/analisis-pliego');
  const { cargarPerfil, evaluarLicitacion } = await import('@/server/ia/matching');
  const { verificarIA } = await import('@/lib/ia/estructurado');
  verificarIA();

  const casos = JSON.parse(await readFile('demo-assets/casos-eval.json', 'utf8')) as Caso[];
  const [empresa] = await db.select({ id: schema.empresas.id }).from(schema.empresas).where(eq(schema.empresas.rut, '213456780012'));
  if (!empresa) throw new Error('Falta la empresa demo: corré npm run seed:demo -- --sin-ia');
  const perfil = (await cargarPerfil(empresa.id))!;

  const filas: Array<Caso & { idCompra: string; confianza: number | null; prediccion: boolean | null; razon: string | null; error?: string }> = [];
  for (const c of casos) {
    const id = c.idCompra ?? (c.url ? idDesdeUrl(c.url) : null);
    if (!id) { filas.push({ ...c, idCompra: '?', confianza: null, prediccion: null, razon: null, error: 'sin id' }); continue; }
    try {
      const [existe] = await db.select({ id: schema.licitaciones.idCompra, proc: schema.licitaciones.archivosProcesados }).from(schema.licitaciones).where(eq(schema.licitaciones.idCompra, id));
      if (!existe) { const s = await scrapeDetalle(id); if (!s) throw new Error('no existe en ARCE'); await upsertLlamados([s]); }
      if (!existe?.proc) await procesarArchivos(id);
      await analizarLicitacion(id);
      const r = await evaluarLicitacion(perfil, id);
      filas.push({ ...c, idCompra: id, confianza: r?.confianza ?? null, prediccion: r ? r.confianza >= UMBRAL : null, razon: r?.razon ?? null });
      console.log(`  ${id}: esperado ${c.relevante ? 'SÍ' : 'NO'} · IA ${r?.confianza} ${r && (r.confianza >= UMBRAL) === c.relevante ? '✓' : '✗'}`);
    } catch (e) {
      filas.push({ ...c, idCompra: id, confianza: null, prediccion: null, razon: null, error: (e as Error).message });
      console.log(`  ${id}: ✗ ${(e as Error).message}`);
    }
  }
  const ok = filas.filter((f) => f.prediccion !== null);
  const tp = ok.filter((f) => f.prediccion && f.relevante).length;
  const fp = ok.filter((f) => f.prediccion && !f.relevante).length;
  const fn = ok.filter((f) => !f.prediccion && f.relevante).length;
  const tn = ok.filter((f) => !f.prediccion && !f.relevante).length;
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  const f1 = precision && recall ? (2 * precision * recall) / (precision + recall) : null;
  const resultado = { fecha: new Date().toISOString(), umbral: UMBRAL, casos: ok.length, tp, fp, fn, tn, precision, recall, f1, exactitud: ok.length ? (tp + tn) / ok.length : null, detalle: filas };
  await writeFile('demo-assets/eval-resultado.json', JSON.stringify(resultado, null, 2));
  console.log(`\nPrecisión ${precision?.toFixed(2)} · Recall ${recall?.toFixed(2)} · F1 ${f1?.toFixed(2)} · ${ok.length} casos → demo-assets/eval-resultado.json`);
  process.exit(0);
}
main().catch((e) => { console.error('✗', (e as Error).message); process.exit(1); });
