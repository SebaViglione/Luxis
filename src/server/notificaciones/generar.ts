import { and, eq, gt, gte, inArray, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import type { Notificacion } from '@/lib/types';
import { fechaCorta, fechaHora, suavizarMayusculas } from '@/components/licitaciones/formato';

const HORA = 36e5;

interface NuevaNotificacion {
  tipo: Notificacion['tipo'];
  titulo: string;
  cuerpo: string;
  idCompra: string;
  clave: string;
}

const corto = (objeto: string | null) => {
  const t = suavizarMayusculas((objeto ?? 'Licitación').replace(/\s+/g, ' ').trim());
  return t.length > 70 ? `${t.slice(0, 67)}…` : t;
};
const dia = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Montevideo' }).format(d);

/** Crea las notificaciones in-app pendientes de una empresa. Idempotente por (empresa, tipo:id_compra:día). Devuelve cuántas creó. */
export async function generarNotificaciones(empresaId: string): Promise<number> {
  const M = schema.matches, L = schema.licitaciones, A = schema.analisisLicitacion;
  const ahora = new Date();

  const filas = await db.select({
    idCompra: M.idCompra, confianza: M.confianza, estado: M.estadoUsuario, gap: M.gapDocumental, creado: M.createdAt,
    objeto: L.objeto, tope: L.fechaTopeOfertas, fechas: A.fechasClave,
  }).from(M).innerJoin(L, eq(L.idCompra, M.idCompra)).leftJoin(A, eq(A.idCompra, M.idCompra))
    .where(and(eq(M.empresaId, empresaId), ne(M.estadoUsuario, 'descartada'), gte(M.confianza, 50), gt(L.fechaTopeOfertas, ahora)));

  const nuevas: NuevaNotificacion[] = [];
  for (const f of filas) {
    const objeto = corto(f.objeto);

    if (f.confianza >= 70 && ahora.getTime() - f.creado.getTime() <= 24 * HORA) {
      nuevas.push({ tipo: 'nuevo_match', titulo: `Nueva licitación para vos: ${objeto}`, cuerpo: `Confianza ${f.confianza}. Cierra el ${fechaHora(f.tope?.toISOString() ?? null)}.`, idCompra: f.idCompra, clave: `nuevo_match:${f.idCompra}:${dia(f.creado)}` });
    }

    if (f.tope && f.tope.getTime() - ahora.getTime() <= 48 * HORA) {
      const horas = Math.max(1, Math.round((f.tope.getTime() - ahora.getTime()) / HORA));
      nuevas.push({ tipo: 'cierre_proximo', titulo: `Cierra en ${horas} h: ${objeto}`, cuerpo: `La recepción de ofertas cierra el ${fechaHora(f.tope.toISOString())}.`, idCompra: f.idCompra, clave: `cierre_proximo:${f.idCompra}:${dia(f.tope)}` });
    }

    for (const fc of f.fechas ?? []) {
      if (fc.tipo !== 'visita' || !fc.fecha) continue;
      const fecha = new Date(fc.fecha);
      const falta = fecha.getTime() - ahora.getTime();
      if (Number.isNaN(falta) || falta < 0 || falta > 72 * HORA) continue;
      nuevas.push({
        tipo: 'visita_proxima',
        titulo: `${fc.obligatoria ? 'Visita obligatoria' : 'Visita'} el ${fechaCorta(fc.fecha)}: ${objeto}`,
        cuerpo: fc.descripcion, idCompra: f.idCompra, clave: `visita_proxima:${f.idCompra}:${dia(fecha)}`,
      });
    }

    if (f.confianza >= 70 && f.tope) {
      const faltantes = (f.gap ?? []).filter((g) => !g.tiene && g.alcanzableAntesCierre === true);
      if (faltantes.length) {
        const extra = faltantes.length > 1 ? ` (y ${faltantes.length - 1} más)` : '';
        nuevas.push({
          tipo: 'doc_alcanzable', titulo: `Te falta ${faltantes[0].documento}${extra}, pero llegás: cierra el ${fechaCorta(f.tope.toISOString())}`,
          cuerpo: faltantes.map((g) => g.nota).filter(Boolean).join(' '), idCompra: f.idCompra, clave: `doc_alcanzable:${f.idCompra}:${dia(f.tope)}`,
        });
      }
    }
  }

  const guardadas = filas.filter((f) => f.estado === 'guardada' || f.estado === 'presentada');
  if (guardadas.length) {
    const objetos = new Map(guardadas.map((f) => [f.idCompra, corto(f.objeto)]));
    const aclaraciones = await db.select({ idCompra: schema.licitacionAclaraciones.idCompra, fecha: schema.licitacionAclaraciones.fecha, texto: schema.licitacionAclaraciones.texto })
      .from(schema.licitacionAclaraciones)
      .where(and(inArray(schema.licitacionAclaraciones.idCompra, [...objetos.keys()]), sql`${schema.licitacionAclaraciones.fecha} > now() - interval '3 days'`));
    for (const a of aclaraciones) {
      if (!a.fecha) continue;
      nuevas.push({
        tipo: 'aclaracion', titulo: `Nueva aclaración en ${objetos.get(a.idCompra)}`, cuerpo: (a.texto ?? '').slice(0, 280),
        idCompra: a.idCompra, clave: `aclaracion:${a.idCompra}:${dia(a.fecha)}`,
      });
    }
  }

  if (!nuevas.length) return 0;
  const creadas = await db.insert(schema.notificaciones)
    .values(nuevas.map((n) => ({ empresaId, tipo: n.tipo, titulo: n.titulo, cuerpo: n.cuerpo, idCompra: n.idCompra, claveDedupe: n.clave })))
    .onConflictDoNothing({ target: [schema.notificaciones.empresaId, schema.notificaciones.claveDedupe] })
    .returning({ id: schema.notificaciones.id });
  return creadas.length;
}
