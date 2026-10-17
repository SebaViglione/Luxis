import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { UA_NAVEGADOR } from './xml';

const BASE = 'https://www.comprasestatales.gub.uy/comprasenlinea/jboss/';
const ARCHIVO = path.join(process.cwd(), 'src/config/organismos.json');

export interface MapaOrganismos { incisos: Record<string, string>; ues: Record<string, string> }

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

async function bajar(nombre: string): Promise<string> {
  const res = await fetch(BASE + nombre, { headers: { 'User-Agent': UA_NAVEGADOR } });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${nombre}`);
  return new TextDecoder('iso-8859-1').decode(await res.arrayBuffer());
}

const arr = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const titulo = (s: string) => s.trim().replace(/\s+/g, ' ');

/** Descarga codigueras de incisos y unidades ejecutoras y las guarda en src/config/organismos.json. */
export async function actualizarOrganismos(): Promise<MapaOrganismos> {
  const inc = parser.parse(await bajar('reporteIncisos.do'));
  const ue = parser.parse(await bajar('reporteUnidadesEjecutoras.do'));
  const incisos: Record<string, string> = {};
  for (const i of arr<Record<string, string>>(inc?.incisos?.inciso)) incisos[i['id-inciso']] = titulo(i['nom-inciso']);
  const ues: Record<string, string> = {};
  const listaUe = arr<Record<string, string>>(ue?.['unidades-ejecutoras']?.['unidad-ejecutora'] ?? ue?.unidades_ejecutoras?.unidad_ejecutora);
  for (const u of listaUe) {
    const idInc = u['id-inciso'] ?? u.id_inciso; const idUe = u['id-ue'] ?? u.id_ue;
    const nom = u['nom-ue'] ?? u.nom_ue ?? u.descripcion;
    if (idInc && idUe && nom) ues[`${idInc}|${idUe}`] = titulo(nom);
  }
  const mapa = { incisos, ues };
  await mkdir(path.dirname(ARCHIVO), { recursive: true });
  await writeFile(ARCHIVO, JSON.stringify(mapa, null, 1));
  return mapa;
}

let cache: MapaOrganismos | null = null;
export async function mapaOrganismos(): Promise<MapaOrganismos> {
  if (cache) return cache;
  try { cache = JSON.parse(await readFile(ARCHIVO, 'utf8')) as MapaOrganismos; }
  catch { cache = { incisos: {}, ues: {} }; }
  return cache;
}

export async function nombreOrganismo(inciso: number | null, ue: number | null) {
  const m = await mapaOrganismos();
  return {
    organismo: inciso !== null ? (m.incisos[String(inciso)] ?? `Inciso ${inciso}`) : null,
    unidadEjecutora: inciso !== null && ue !== null ? (m.ues[`${inciso}|${ue}`] ?? null) : null,
  };
}
