// Reconocer si una adjudicación de ARCE es de la empresa: por RUT si ambos lo tienen, si no por nombre.
const FORMAS_JURIDICAS = /\b(S\s?A\s?S|S\s?R\s?L|S\s?A|LTDA|LIMITADA|SOCIEDAD ANONIMA|SOCIEDAD DE RESPONSABILIDAD LIMITADA|SOCIEDAD POR ACCIONES SIMPLIFICADAS)\b/g;

export const soloDigitos = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

export function nombreComparable(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(FORMAS_JURIDICAS, ' ')
    .replace(/[^A-Z0-9]/g, '');
}

export interface IdentidadEmpresa { rut: string | null; nombre: string; razonSocial: string | null }

export function esDeLaEmpresa(empresa: IdentidadEmpresa, nroDoc: string | null, nombreComercial: string | null): boolean {
  const rutEmpresa = soloDigitos(empresa.rut), rutProv = soloDigitos(nroDoc);
  if (rutEmpresa && rutProv) return rutEmpresa === rutProv;
  const prov = nombreComparable(nombreComercial);
  if (prov.length < 4) return false;
  // Contención solo con nombres largos: "BARRACA" no alcanza para decir que "BARRACA DON AURELIO" ganó.
  return [empresa.razonSocial, empresa.nombre].map(nombreComparable).some((n) =>
    n.length >= 4 && (n === prov || (Math.min(n.length, prov.length) >= 8 && (n.includes(prov) || prov.includes(n)))));
}
