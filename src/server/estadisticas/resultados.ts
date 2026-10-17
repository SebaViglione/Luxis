import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { monto, suavizarMayusculas } from '@/components/licitaciones/formato';
import { actualizarEstadoMatch } from '@/server/consultas/acciones';
import { esDeLaEmpresa, type IdentidadEmpresa } from './proveedor';

export async function identidadEmpresa(empresaId: string): Promise<IdentidadEmpresa | null> {
  const [e] = await db.select({ rut: schema.empresas.rut, nombre: schema.empresas.nombre, razonSocial: schema.empresas.razonSocial })
    .from(schema.empresas).where(eq(schema.empresas.id, empresaId));
  return e ?? null;
}

const corto = (objeto: string | null) => {
  const t = suavizarMayusculas((objeto ?? 'Licitación').replace(/\s+/g, ' ').trim());
  return t.length > 70 ? `${t.slice(0, 67)}…` : t;
};

/**
 * Pasa a ganada o perdida las licitaciones presentadas cuya adjudicación ya publicó ARCE: si alguna línea
 * adjudicada es de la empresa (RUT, o nombre si falta el RUT) es ganada; si no, perdida. Avisa una sola vez.
 */
export async function actualizarResultados(empresaId: string): Promise<{ ganadas: number; perdidas: number }> {
  const M = schema.matches, L = schema.licitaciones, A = schema.adjudicaciones;
  const empresa = await identidadEmpresa(empresaId);
  if (!empresa) return { ganadas: 0, perdidas: 0 };

  const presentadas = await db.select({ idCompra: M.idCompra, objeto: L.objeto })
    .from(M).innerJoin(L, eq(L.idCompra, M.idCompra))
    .where(and(eq(M.empresaId, empresaId), eq(M.estadoUsuario, 'presentada')));
  if (!presentadas.length) return { ganadas: 0, perdidas: 0 };

  const lineas = await db.select({ idCompra: A.idCompra, nroDoc: A.nroDocProv, nombre: A.nombreComercial, cant: A.cantAdj, precio: A.precioUnit, moneda: A.idMoneda })
    .from(A).where(inArray(A.idCompra, presentadas.map((p) => p.idCompra)));
  const porCompra = new Map<string, typeof lineas>();
  for (const l of lineas) porCompra.set(l.idCompra, [...(porCompra.get(l.idCompra) ?? []), l]);

  let ganadas = 0, perdidas = 0;
  for (const p of presentadas) {
    const adjudicadas = porCompra.get(p.idCompra);
    if (!adjudicadas?.length) continue;
    const propias = adjudicadas.filter((l) => esDeLaEmpresa(empresa, l.nroDoc, l.nombre));
    const gano = propias.length > 0;
    await actualizarEstadoMatch(empresaId, p.idCompra, gano ? 'ganada' : 'perdida');

    const facturado = propias.filter((l) => l.moneda === 0).reduce((s, l) => s + Number(l.cant ?? 0) * Number(l.precio ?? 0), 0);
    const ganador = adjudicadas.find((l) => l.nombre)?.nombre ?? 'otro proveedor';
    await db.insert(schema.notificaciones).values({
      empresaId, tipo: 'sistema', idCompra: p.idCompra, claveDedupe: `resultado:${p.idCompra}`,
      titulo: gano ? `Ganaste: ${corto(p.objeto)}` : `Se adjudicó a otro proveedor: ${corto(p.objeto)}`,
      cuerpo: gano
        ? `Te adjudicaron ${propias.length} ${propias.length === 1 ? 'línea' : 'líneas'}${facturado ? ` por ${monto(facturado)} sin IVA` : ''}.`
        : `La adjudicación salió para ${suavizarMayusculas(ganador)}. Revisá sus precios en el historial del ítem.`,
    }).onConflictDoNothing({ target: [schema.notificaciones.empresaId, schema.notificaciones.claveDedupe] });
    if (gano) ganadas++; else perdidas++;
  }
  return { ganadas, perdidas };
}
