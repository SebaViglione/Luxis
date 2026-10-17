import { sql, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { CompraNormalizada } from './normalizar';
import { compraEsRubro, esRubro } from './rubro';
import { nombreOrganismo } from './organismos';

const LOTE = 200;
function lotes<T>(arr: T[], n = LOTE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
/** Última aparición gana (un llamado puede venir en varias ventanas). */
function unicos<T>(arr: T[], clave: (x: T) => string): T[] {
  const m = new Map<string, T>();
  for (const x of arr) m.set(clave(x), x);
  return [...m.values()];
}

/** Upsert de llamados con ítems y aclaraciones. Devuelve conteos. */
export async function upsertLlamados(compras: CompraNormalizada[]): Promise<{ compras: number; items: number; rubro: number }> {
  const lista = unicos(compras, (c) => c.idCompra);
  let items = 0; let rubro = 0;
  for (const grupo of lotes(lista)) {
    const filas = await Promise.all(grupo.map(async (c) => {
      const org = await nombreOrganismo(c.inciso, c.ue);
      const esR = compraEsRubro(c);
      if (esR) rubro++;
      return {
        idCompra: c.idCompra, tipoCompra: c.tipoCompra, subtipoCompra: c.subtipoCompra, numCompra: c.numCompra, anioCompra: c.anioCompra,
        inciso: c.inciso, ue: c.ue, organismo: c.organismo ?? org.organismo, unidadEjecutora: c.unidadEjecutora ?? org.unidadEjecutora, objeto: c.objeto, estado: c.estado,
        fechaPublicacion: c.fechaPublicacion, fechaUltMod: c.fechaUltMod, fechaApertura: c.fechaApertura, fechaTopeOfertas: c.fechaTopeOfertas,
        fechaSolAclar: c.fechaSolAclar, fechaSolProrr: c.fechaSolProrr, fechaTopeEntrega: c.fechaTopeEntrega,
        lugarApertura: c.lugarApertura, lugarEntrega: c.lugarEntrega,
        precioPliego: c.precioPliego?.toString() ?? null, monedaPliego: c.monedaPliego,
        nombreContacto: c.nombreContacto, emailContacto: c.emailContacto, nombrePliego: c.nombrePliego, urlDetalle: c.urlDetalle,
        aperturaElectronica: c.aperturaElectronica, fuente: c.fuente, esRubro: esR, raw: c.raw as object, updatedAt: new Date(),
      };
    }));
    await db.insert(schema.licitaciones).values(filas).onConflictDoUpdate({
      target: schema.licitaciones.idCompra,
      set: {
        tipoCompra: sql`excluded.tipo_compra`, subtipoCompra: sql`excluded.subtipo_compra`, organismo: sql`excluded.organismo`,
        unidadEjecutora: sql`excluded.unidad_ejecutora`, objeto: sql`excluded.objeto`, estado: sql`excluded.estado`,
        fechaUltMod: sql`excluded.fecha_ult_mod`, fechaApertura: sql`excluded.fecha_apertura`, fechaTopeOfertas: sql`excluded.fecha_tope_ofertas`,
        fechaSolAclar: sql`excluded.fecha_sol_aclar`, fechaSolProrr: sql`excluded.fecha_sol_prorr`, fechaTopeEntrega: sql`excluded.fecha_tope_entrega`,
        lugarApertura: sql`excluded.lugar_apertura`, lugarEntrega: sql`excluded.lugar_entrega`,
        nombrePliego: sql`coalesce(excluded.nombre_pliego, ${schema.licitaciones.nombrePliego})`,
        // Si cambió el pliego, hay que volver a procesar archivos.
        archivosProcesados: sql`case when excluded.nombre_pliego is distinct from ${schema.licitaciones.nombrePliego} then false else ${schema.licitaciones.archivosProcesados} end`,
        esRubro: sql`${schema.licitaciones.esRubro} or excluded.es_rubro`,
        raw: sql`excluded.raw`, updatedAt: sql`now()`,
      },
    });

    const ids = grupo.map((c) => c.idCompra);
    const filasItems = grupo.flatMap((c) => unicos(c.items, (i) => String(i.nroItem)).map((i) => ({
      idCompra: c.idCompra, nroItem: i.nroItem, idArticulo: i.idArticulo, descArticulo: i.descArticulo, descNormalizada: i.descNormalizada,
      cantPedida: i.cantPedida?.toString() ?? null, unidad: i.unidad, idMonedaCotiz: i.idMonedaCotiz,
      variante: i.variante, presentacion: i.presentacion, marca: i.marca, atributos: i.atributos,
    })));
    if (filasItems.length) {
      // El XML trae la lista completa de ítems: reemplazar.
      await db.delete(schema.licitacionItems).where(inArray(schema.licitacionItems.idCompra, ids.filter((id) => grupo.find((c) => c.idCompra === id)!.items.length > 0)));
      for (const l of lotes(filasItems, 500)) await db.insert(schema.licitacionItems).values(l).onConflictDoNothing();
      items += filasItems.length;
    }
    const filasAcl = grupo.flatMap((c) => c.aclaraciones.map((a) => ({ idCompra: c.idCompra, fecha: a.fecha, texto: a.texto, nomArchivo: a.nomArchivo, url: a.url })));
    if (filasAcl.length) {
      await db.delete(schema.licitacionAclaraciones).where(inArray(schema.licitacionAclaraciones.idCompra, [...new Set(filasAcl.map((a) => a.idCompra))]));
      for (const l of lotes(filasAcl, 500)) await db.insert(schema.licitacionAclaraciones).values(l);
    }
  }
  return { compras: lista.length, items, rubro };
}

/** Guarda solo filas de adjudicación del rubro + todos los oferentes de esas compras. */
export async function upsertAdjudicaciones(compras: CompraNormalizada[]): Promise<{ compras: number; adjudicaciones: number; oferentes: number }> {
  let nAdj = 0; let nOf = 0; let nCompras = 0;
  for (const grupo of lotes(unicos(compras, (c) => c.idCompra))) {
    const filasAdj: (typeof schema.adjudicaciones.$inferInsert)[] = [];
    const filasOf: (typeof schema.oferentes.$inferInsert)[] = [];
    for (const c of grupo) {
      const delRubro = c.adjudicaciones.filter((a) => esRubro(a.descArticulo) && a.precioUnit !== null && a.precioUnit > 0);
      if (!delRubro.length) continue;
      nCompras++;
      const org = await nombreOrganismo(c.inciso, c.ue);
      for (const a of unicos(delRubro, (a) => `${a.nroItem}|${a.nroDocProv}`)) {
        filasAdj.push({
          idCompra: c.idCompra, nroItem: a.nroItem, idArticulo: a.idArticulo, descArticulo: a.descArticulo, descNormalizada: a.descNormalizada,
          nroDocProv: a.nroDocProv, nombreComercial: a.nombreComercial, cantAdj: a.cantAdj?.toString() ?? null,
          precioUnit: a.precioUnit?.toString() ?? null, precioTotal: a.precioTotal?.toString() ?? null, idMoneda: a.idMoneda, unidad: a.unidad,
          fechaPubAdj: c.fechaPubAdj ?? c.fechaPublicacion, tipoCompra: c.tipoCompra, inciso: c.inciso, ue: c.ue, organismo: org.organismo,
        });
      }
      for (const o of c.oferentes) filasOf.push({ idCompra: c.idCompra, nroDocProv: o.nroDocProv, nombreComercial: o.nombreComercial });
    }
    for (const l of lotes(filasAdj, 500)) {
      await db.insert(schema.adjudicaciones).values(l).onConflictDoUpdate({
        target: [schema.adjudicaciones.idCompra, schema.adjudicaciones.nroItem, schema.adjudicaciones.nroDocProv],
        set: { precioUnit: sql`excluded.precio_unit`, cantAdj: sql`excluded.cant_adj`, precioTotal: sql`excluded.precio_total`, fechaPubAdj: sql`excluded.fecha_pub_adj` },
      });
    }
    for (const l of lotes(filasOf, 500)) await db.insert(schema.oferentes).values(l).onConflictDoNothing();
    nAdj += filasAdj.length; nOf += filasOf.length;
  }
  return { compras: nCompras, adjudicaciones: nAdj, oferentes: nOf };
}

export async function registrarCorrida(c: typeof schema.ingestaCorridas.$inferInsert) {
  await db.insert(schema.ingestaCorridas).values(c);
}
