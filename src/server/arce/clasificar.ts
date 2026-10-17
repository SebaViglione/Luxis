import type { CategoriaArchivo } from '@/lib/types';

const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const REGLAS: Array<{ cat: CategoriaArchivo; rx: RegExp }> = [
  { cat: 'plano', rx: /plano|\.(dwg|dxf|jpe?g|png|tiff?)$/ },
  { cat: 'aclaracion', rx: /aclarac|aclar_|consulta|respuesta|comunicado|enmienda|resolucion/ },
  { cat: 'planilla', rx: /planilla|cotiz|presupuesto|\.(xlsx?|ods|csv)$/ },
  { cat: 'formulario', rx: /anexo|formulario|form[_ -]?\d|declaraci|identificaci|modelo de (oferta|nota)/ },
  { cat: 'pliego_general', rx: /pliego.?(unico|general)|pcg|condiciones generales|decreto|tocaf|pliego unico/ },
  { cat: 'memoria', rx: /memoria|especificac|tecnic|descriptiv/ },
  { cat: 'pliego_particular', rx: /particular|pcp|pliego|bases|condiciones|pedido_|llamado/ },
];

/** Categoría por nombre y, si no alcanza, por las primeras líneas del texto. */
export function clasificarArchivo(nombre: string, texto: string | null): CategoriaArchivo {
  const nom = n(nombre);
  for (const r of REGLAS) if (r.rx.test(nom)) return r.cat;
  const ini = n((texto ?? '').slice(0, 1500));
  if (/pliego de (bases y )?condiciones particulares|condiciones particulares/.test(ini)) return 'pliego_particular';
  if (/pliego unico|condiciones generales/.test(ini)) return 'pliego_general';
  if (/especificaciones tecnicas|memoria descriptiva/.test(ini)) return 'memoria';
  if (/aclaracion|consulta n/.test(ini)) return 'aclaracion';
  if (/formulario|declaracion jurada|anexo/.test(ini)) return 'formulario';
  return 'otro';
}

export const PRIORIDAD: Record<CategoriaArchivo, number> = {
  pliego_particular: 0, memoria: 1, aclaracion: 2, formulario: 3, planilla: 4, otro: 5, pliego_general: 6, plano: 9,
};

/** Qué archivos van al LLM: todo lo útil; el pliego general solo si no hay particular; "otro" solo si es lo único. */
export function marcarRelevantes<T extends { categoria: CategoriaArchivo; estado: string }>(archivos: T[]): Array<T & { relevante: boolean }> {
  const conTexto = archivos.filter((a) => a.estado === 'ok');
  const hayParticular = conTexto.some((a) => a.categoria === 'pliego_particular' || a.categoria === 'memoria');
  const soloOtros = conTexto.every((a) => a.categoria === 'otro' || a.categoria === 'plano');
  return archivos.map((a) => ({
    ...a,
    relevante: a.estado === 'ok' && (
      ['pliego_particular', 'memoria', 'aclaracion', 'formulario', 'planilla'].includes(a.categoria) ||
      (a.categoria === 'pliego_general' && !hayParticular) ||
      (a.categoria === 'otro' && (soloOtros || !hayParticular))
    ),
  }));
}
