import { and, eq, gt, gte, inArray, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { confianzaEfectiva, type Notificacion } from '@/lib/types';
import { esDocumentoDeLaLicitacion } from '@/config/plazos-documentales';
import { fechaCorta, fechaHora, suavizarMayusculas } from '@/components/licitaciones/formato';
import { actualizarResultados } from '@/server/estadisticas/resultados';

const HORA = 36e5;

/** "en 5 horas", "mañana", "en 2 días": cuánto falta para el cierre, en palabras. */
function cuandoCierra(tope: Date, ahora: Date): string {
  const horas = Math.max(1, Math.round((tope.getTime() - ahora.getTime()) / HORA));
  if (horas < 24) return horas === 1 ? 'en 1 hora' : `en ${horas} horas`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'mañana' : `en ${dias} días`;
}

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
  // Primero los resultados: cada presentada que ARCE ya adjudicó pasa a ganada o perdida y avisa (tipo sistema).
  const resultados = await actualizarResultados(empresaId).catch((e) => {
    console.error('[notificaciones] resultados', e);
    return { ganadas: 0, perdidas: 0 };
  });
  const resueltas = resultados.ganadas + resultados.perdidas;

  const filas = await db.select({
    idCompra: M.idCompra, confianzaBase: M.confianza, estadoDoc: M.estadoDocumental, estado: M.estadoUsuario, gap: M.gapDocumental, creado: M.createdAt,
    objeto: L.objeto, tope: L.fechaTopeOfertas, fechas: A.fechasClave,
  }).from(M).innerJoin(L, eq(L.idCompra, M.idCompra)).leftJoin(A, eq(A.idCompra, M.idCompra))
    .where(and(eq(M.empresaId, empresaId), ne(M.estadoUsuario, 'descartada'), gte(M.confianza, 50), gt(L.fechaTopeOfertas, ahora)));

  const nuevas: NuevaNotificacion[] = [];
  for (const fila of filas) {
    // Mismo puntaje que el dashboard: la coincidencia ya descontada por papeles difíciles.
    const f = { ...fila, confianza: confianzaEfectiva(fila.confianzaBase, fila.estadoDoc).confianza };
    const objeto = corto(f.objeto);

    if (f.confianza >= 70 && ahora.getTime() - f.creado.getTime() <= 24 * HORA) {
      nuevas.push({ tipo: 'nuevo_match', titulo: `Nueva licitación para vos: ${objeto}`, cuerpo: `Coincidencia ${f.confianza} de 100 con lo que vendés. Cierra el ${fechaHora(f.tope?.toISOString() ?? null)}.`, idCompra: f.idCompra, clave: `nuevo_match:${f.idCompra}:${dia(f.creado)}` });
    }

    if (f.tope && f.tope.getTime() - ahora.getTime() <= 48 * HORA) {
      nuevas.push({ tipo: 'cierre_proximo', titulo: `Cierra ${cuandoCierra(f.tope, ahora)}: ${objeto}`, cuerpo: `Podés ofertar hasta el ${fechaHora(f.tope.toISOString())}.`, idCompra: f.idCompra, clave: `cierre_proximo:${f.idCompra}:${dia(f.tope)}` });
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

    // Acá va la coincidencia sin descontar: el papel que falta es justo lo que el descuento castiga.
    if (f.confianzaBase >= 70 && f.tope) {
      // Solo papeles que hay que presentar para ofertar: ni el pliego ni lo que se pide después de ganar.
      const faltantes = (f.gap ?? []).filter((g) => g.obligatorio && !g.tiene && g.alcanzableAntesCierre === true && !esDocumentoDeLaLicitacion(g.documento));
      if (faltantes.length) {
        const otros = faltantes.length - 1;
        const dias = Math.max(0, ...faltantes.map((g) => g.diasEstimados ?? 0));
        nuevas.push({
          tipo: 'doc_alcanzable',
          titulo: otros ? `Te faltan ${faltantes.length} papeles para ${objeto}` : `Te falta un papel para ${objeto}`,
          cuerpo: `${faltantes.map((g) => g.documento).join(', ')}. Llegás a conseguir${otros ? 'los' : 'lo'} antes del cierre (${fechaCorta(f.tope.toISOString())})${dias ? `: el trámite tarda ${dias === 1 ? 'un día hábil' : `unos ${dias} días hábiles`}` : ''}.`, idCompra: f.idCompra, clave: `doc_alcanzable:${f.idCompra}:${dia(f.tope)}`,
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

  if (!nuevas.length) return resueltas;
  const creadas = await db.insert(schema.notificaciones)
    .values(nuevas.map((n) => ({ empresaId, tipo: n.tipo, titulo: n.titulo, cuerpo: n.cuerpo, idCompra: n.idCompra, claveDedupe: n.clave })))
    .onConflictDoNothing({ target: [schema.notificaciones.empresaId, schema.notificaciones.claveDedupe] })
    .returning({ id: schema.notificaciones.id });
  return resueltas + creadas.length;
}
