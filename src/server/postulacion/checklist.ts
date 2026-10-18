// Checklist de postulación: qué hace falta para presentarse a una licitación, sin IA.
// Cruza el gap documental (seba) con lo que exige el proceso de ARCE (RUPE, SICE, visita, muestras…).
import { fecha, fechaHora, monto } from '@/components/licitaciones/formato';
import type { DetalleLicitacion, GapDocumental, PerfilEmpresa } from '@/lib/types';
import { diasHabilesHasta } from '@/server/ia/gap-documental';
import { ajusteConfianza, textoAjuste } from './preparacion';
import type { ItemChecklist, ResumenPreparacion } from './tipos';

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();

// Lo que arma Luxis en el paso de documentos o en la planilla.
const LO_ARMA_LUXIS =
  /FORMULARIO|IDENTIFICACION DEL OFERENTE|DATOS (DE LA EMPRESA|DEL OFERENTE|IDENTIFICATORIOS)|DECLARACION JURADA|DECLARACION DE|PLANILLA|COTIZACION|PROPUESTA ECONOMICA|OFERTA ECONOMICA|ESPECIFICA|TOTALIDAD DE LA INFORMACION|CARTA DE PRESENTACION|NOTA DE PRESENTACION|MONEDA/;
// Presentar la oferta es el envío, no un papel: lo cubre el ítem del canal (ARCE en línea o mail/papel).
const ENVIO_DE_OFERTA =
  /^(?!.*(FORMULARIO|CARTA|NOTA|PLANILLA|DECLARACION|ANEXO)).*(OFERTA ENVIADA|OFERTA POR CORREO|OFERTA EN LINEA|PRESENTACION DE (LA )?OFERTA|CARGAR? (DE )?(LA )?OFERTA)/;
// Se exige recién si te adjudican: no frena la oferta.
const POST_ADJUDICACION = /FIEL CUMPLIMIENTO|CUMPLIMIENTO DE CONTRATO|GARANTIA DE CUMPLIMIENTO/;
// Se pide al entregar la mercadería.
const AL_ENTREGAR = /\bREMITO|\bFACTURA/;
const SIN_MUESTRAS = /^no\b|no se (exigen|piden|requieren|solicitan)|no corresponde/i;
// DGI/BPS/BSE: el organismo los verifica en RUPE, no se adjuntan.
const VERIFICADO_EN_RUPE = /^(DGI|BPS|BSE)$/;

interface Opciones {
  aperturaElectronica: boolean;
  ahora?: Date;
}

export function armarChecklist(
  d: DetalleLicitacion,
  perfil: PerfilEmpresa,
  { aperturaElectronica, ahora = new Date() }: Opciones,
): { checklist: ItemChecklist[]; resumen: ResumenPreparacion } {
  const l = d.licitacion;
  const items: ItemChecklist[] = [];
  const seccionDe = new Map((d.analisis?.requisitosDocumentales ?? []).map((r) => [r.documento, r.seccion]));
  const cierre = l.fechaTopeOfertas ? new Date(l.fechaTopeOfertas) : null;
  const habilesAlCierre = cierre ? diasHabilesHasta(cierre, ahora) : null;

  // 1. Plazo y canal de presentación
  if (cierre && cierre.getTime() < ahora.getTime()) {
    items.push({
      id: 'cierre',
      titulo: 'La recepción de ofertas ya cerró',
      detalle: `Cerró el ${fechaHora(l.fechaTopeOfertas)}. Podés usar esta página para practicar, pero ARCE ya no recibe ofertas.`,
      estado: 'riesgo',
    });
  } else if (habilesAlCierre !== null) {
    items.push({
      id: 'cierre',
      titulo: `Tenés ${habilesAlCierre} ${habilesAlCierre === 1 ? 'día hábil' : 'días hábiles'} hasta el cierre`,
      detalle: aperturaElectronica
        ? 'En SICE vale lo que esté guardado al cierre: no hay botón de enviar. Cargá con tiempo, el portal puede trabarse a último momento.'
        : 'Entregá con tiempo: las ofertas que llegan tarde no se reciben.',
      plazo: fechaHora(l.fechaTopeOfertas),
      estado: habilesAlCierre <= 1 ? 'riesgo' : 'info',
    });
  }

  items.push(
    aperturaElectronica
      ? {
          id: 'canal',
          titulo: 'Se oferta en línea en ARCE (SICE)',
          detalle:
            'Entrás con el documento de la empresa tal como figura en RUPE y la contraseña de SICE (es distinta de la de RUPE; se pide desde el mismo portal). Cargás el precio de cada ítem y adjuntás los archivos.',
          estado: 'info',
        }
      : {
          id: 'canal',
          titulo: 'Esta compra no tiene oferta en línea',
          detalle: `Revisá en el pliego cómo se entrega (mail, sobre o en mano).${
            l.contacto.email ? ` Contacto: ${l.contacto.email}.` : ''
          }${l.lugarApertura ? ` Lugar de apertura: ${l.lugarApertura}.` : ''}`,
          estado: 'pendiente',
        },
  );

  // 2. RUPE (habilita a ofertar; activo para que te adjudiquen)
  const rupe = perfil.documentacion.find((x) => x.tipo === 'RUPE')?.estado ?? 'desconocido';
  const seccionRupe = [...seccionDe].find(([doc]) => /RUPE/.test(normalizar(doc)))?.[1] ?? null;
  // Si el gap (que descuenta la confianza) dice que el RUPE no llega, el ítem lo muestra como riesgo: si no, la página
  // diría "te falta 1 cosa" al lado de "baja 25 puntos: hay papeles que no llegás a tener".
  const rupeNoLlega = (d.match?.gapDocumental ?? []).some(
    (g) => (g.tipo === 'RUPE' || /\bRUPE\b/.test(normalizar(g.documento))) && !g.tiene && g.obligatorio && g.alcanzableAntesCierre === false,
  );
  items.push(
    rupe === 'vigente'
      ? { id: 'rupe', titulo: 'RUPE activo', detalle: 'Podés ofertar y te pueden adjudicar.', estado: 'listo', seccion: seccionRupe }
      : rupe === 'en_tramite'
        ? {
            id: 'rupe',
            titulo: 'RUPE en ingreso',
            detalle: 'Alcanza para ofertar. Para que te adjudiquen tiene que estar ACTIVO: pedí la validación al escribano del organismo.',
            estado: 'pendiente',
            plazo: '1 a 5 días hábiles',
            seccion: seccionRupe,
          }
        : {
            id: 'rupe',
            titulo: 'Inscribite en RUPE',
            detalle:
              'Es gratis y en línea (comprasestatales.gub.uy → RUPE). Con quedar EN INGRESO ya podés ofertar; para que te adjudiquen tiene que estar ACTIVO.',
            estado: rupeNoLlega || (habilesAlCierre !== null && habilesAlCierre < 2) ? 'riesgo' : 'pendiente',
            plazo: '1 a 5 días hábiles',
            seccion: seccionRupe,
          },
  );

  // 3. Requisitos documentales del pliego (gap de seba, reinterpretado para el momento de ofertar)
  // Si no hay gap (el match no era relevante) pero el pliego se leyó, listamos los requisitos tal cual.
  const requisitos: GapDocumental[] = d.match?.gapDocumental?.length
    ? d.match.gapDocumental
    : (d.analisis?.requisitosDocumentales ?? []).map((r) => ({
        documento: r.documento,
        tipo: r.tipo,
        obligatorio: r.obligatorio,
        tiene: false,
        estadoEmpresa: 'desconocido',
        diasEstimados: null,
        alcanzableAntesCierre: null,
        nota: r.detalle,
      }));
  for (const g of requisitos) {
    const item = itemDeGap(g, seccionDe.get(g.documento) ?? null);
    if (item) items.push(item);
  }
  if (!requisitos.length) {
    items.push({
      id: 'sin-requisitos',
      titulo: 'Todavía no leímos los requisitos de este pliego',
      detalle: 'Analizá la licitación desde el detalle para ver qué papeles piden. Mientras tanto, igual podés armar la cotización y los formularios estándar.',
      estado: 'info',
    });
  }

  // 4. Fechas que pueden dejarte afuera: visita y muestras
  for (const f of d.analisis?.fechasClave ?? []) {
    if (f.tipo === 'visita') items.push(itemVisita(f.fecha, f.obligatoria, f.descripcion, f.fuente, ahora));
    if (f.tipo === 'muestras' && !SIN_MUESTRAS.test(f.descripcion)) {
      items.push({
        id: `muestras-${f.fecha ?? 'sf'}`,
        titulo: 'Entrega de muestras',
        detalle: f.descripcion,
        plazo: f.fecha ? fechaLegible(f.fecha) : null,
        seccion: f.fuente,
        estado: f.fecha && Date.parse(f.fecha) < ahora.getTime() ? 'riesgo' : 'pendiente',
        obligatorio: f.obligatoria,
      });
    }
  }
  const muestras = d.analisis?.condiciones?.muestras;
  if (muestras && !SIN_MUESTRAS.test(muestras) && !items.some((i) => i.id.startsWith('muestras'))) {
    items.push({ id: 'muestras', titulo: 'Muestras', detalle: muestras, estado: 'pendiente' });
  }

  // 5. Costo del pliego y consultas
  if (l.precioPliego && l.precioPliego > 0) {
    items.push({
      id: 'pliego-pago',
      titulo: `Comprá el pliego (${monto(l.precioPliego)})`,
      detalle: 'Si el pliego tiene costo y no lo compraste, la oferta queda afuera.',
      estado: 'pendiente',
    });
  }
  if (l.fechaSolAclar && Date.parse(l.fechaSolAclar) > ahora.getTime()) {
    items.push({
      id: 'consultas',
      titulo: 'Podés hacer consultas al organismo',
      detalle: `Si algo del pliego no está claro, preguntá antes de cotizar${l.contacto.email ? ` a ${l.contacto.email}` : ''}.`,
      plazo: `hasta el ${fecha(l.fechaSolAclar)}`,
      estado: 'info',
    });
  }

  return { checklist: items, resumen: resumir(items, d.match) };
}

function itemDeGap(g: GapDocumental, seccion: string | null): ItemChecklist | null {
  const nombre = normalizar(g.documento);
  const base = { id: `doc-${nombre}`, titulo: g.documento, seccion, obligatorio: g.obligatorio };

  if (ENVIO_DE_OFERTA.test(nombre)) return null;
  // Primero lo que arma Luxis: "Formulario de identificación… validado en RUPE" es un formulario, no el RUPE.
  if (LO_ARMA_LUXIS.test(nombre)) {
    return { ...base, estado: 'luxis', detalle: 'Lo armamos con tus datos en el paso de documentos o en la planilla. Revisalo y firmalo.' };
  }
  if (g.tipo === 'RUPE' || /\bRUPE\b/.test(nombre)) return null; // ya lo cubre el ítem de RUPE
  if (AL_ENTREGAR.test(nombre)) {
    return { ...base, estado: 'info', detalle: 'Se pide al entregar la mercadería, no para ofertar.' };
  }
  if (POST_ADJUDICACION.test(nombre)) {
    return {
      ...base,
      estado: 'info',
      detalle: 'Se pide recién si te adjudican (en general, 5 % del monto adjudicado dentro de los días que fije el pliego). No frena la oferta.',
    };
  }
  if (VERIFICADO_EN_RUPE.test(g.tipo)) {
    // Mismo criterio que el ajuste de confianza: si no llega antes del cierre es un riesgo, no algo pendiente.
    return g.tiene
      ? { ...base, estado: 'listo', detalle: 'El organismo lo verifica en RUPE: no hace falta adjuntarlo.' }
      : {
          ...base,
          estado: g.alcanzableAntesCierre === false ? 'riesgo' : 'pendiente',
          detalle: `Ponelo al día: el organismo lo verifica en RUPE. ${g.nota}`,
          plazo: plazoGap(g),
        };
  }
  if (g.tiene) return { ...base, estado: 'listo', detalle: g.nota || 'Ya lo tenés.' };
  if (g.alcanzableAntesCierre === false) return { ...base, estado: 'riesgo', detalle: g.nota, plazo: plazoGap(g) };
  return { ...base, estado: g.obligatorio ? 'pendiente' : 'info', detalle: g.nota, plazo: plazoGap(g) };
}

/** Fechas sin hora (00:00) se muestran solo con el día. */
function fechaLegible(iso: string) {
  const conHora = fechaHora(iso);
  return conHora.endsWith(' 00:00') ? fecha(iso) : conHora;
}

function plazoGap(g: GapDocumental) {
  return g.diasEstimados != null ? `~${g.diasEstimados} ${g.diasEstimados === 1 ? 'día hábil' : 'días hábiles'}` : null;
}

function itemVisita(fechaVisita: string | null, obligatoria: boolean, descripcion: string, fuente: string | null, ahora: Date): ItemChecklist {
  const paso = fechaVisita ? Date.parse(fechaVisita) < ahora.getTime() : false;
  if (!obligatoria) {
    return { id: 'visita', titulo: 'Visita (opcional)', detalle: descripcion, plazo: fechaVisita ? fechaLegible(fechaVisita) : null, seccion: fuente, estado: 'info' };
  }
  return {
    id: 'visita',
    titulo: paso ? 'La visita obligatoria ya pasó' : 'Visita obligatoria',
    detalle: paso
      ? `${descripcion} Si no fuiste, la oferta se rechaza.`
      : `${descripcion} Pedí la constancia de visita: hay que adjuntarla.`,
    plazo: fechaVisita ? fechaLegible(fechaVisita) : null,
    seccion: fuente,
    estado: paso ? 'riesgo' : 'pendiente',
    obligatorio: true,
  };
}

function resumir(items: ItemChecklist[], match: DetalleLicitacion['match']): ResumenPreparacion {
  const riesgos = items.filter((i) => i.estado === 'riesgo').length;
  const pendientes = items.filter((i) => i.estado === 'pendiente').length;
  const nivel = riesgos > 0 ? 'dificil' : pendientes > 0 ? 'falta-poco' : 'lista';
  // El ajuste es el mismo que ya descuenta la confianza del match en el dashboard y el detalle.
  const estadoDocumental = match?.estadoDocumental ?? null;
  const ajuste = match?.ajusteDocumental ?? ajusteConfianza(estadoDocumental);
  const explicacionAjuste = textoAjuste(estadoDocumental, ajuste);
  const titulo =
    nivel === 'lista'
      ? 'Estás para presentarte'
      : nivel === 'falta-poco'
        ? `Te ${pendientes === 1 ? 'falta 1 cosa' : `faltan ${pendientes} cosas`} para presentarte`
        : riesgos === 1 ? 'Hay 1 punto que puede dejarte afuera' : `Hay ${riesgos} puntos que pueden dejarte afuera`;
  const descripcion =
    nivel === 'lista'
      ? 'Armá la cotización y los documentos, y cargalos en ARCE.'
      : 'Revisá la lista: al lado de cada cosa está qué hacer y cuánto tarda.';

  return {
    nivel,
    titulo,
    descripcion: explicacionAjuste ? `${descripcion} ${explicacionAjuste}` : descripcion,
    pendientes,
    riesgos,
    estadoDocumental,
    ajusteConfianza: ajuste,
  };
}
