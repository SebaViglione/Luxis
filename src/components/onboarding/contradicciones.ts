// Contradicciones entre lo que leímos en los documentos y lo que dijo el usuario (a mano, por chat o por voz).
// Sin IA ni DB: compara los datos crudos de cada fuente antes de que fusionarPerfil los resuelva en silencio.
import type { DocumentoEmpresa, EstadoDoc, PerfilEmpresa, ProductoEmpresa } from '@/lib/types';
import { NOMBRE_DOC } from '@/server/onboarding/constantes';
import { calcularFaltantes, normalizarTexto, normalizarZonas } from '@/server/onboarding/perfil';

export type OrigenUsuario = 'manual' | 'entrevista';
export type Eleccion = 'documentos' | 'usuario' | 'ambos';

export interface FuentesPerfil {
  manual?: Partial<PerfilEmpresa>;
  documentos?: Partial<PerfilEmpresa>;
  entrevista?: Partial<PerfilEmpresa>;
}

export interface Contradiccion {
  clave: string;
  etiqueta: string;
  documentos: string;
  usuario: string;
  origen: OrigenUsuario;
  permiteAmbos: boolean;
  aplicar: (perfil: PerfilEmpresa, eleccion: Eleccion) => PerfilEmpresa;
}

const ESTADO_DOC: Record<EstadoDoc, string> = {
  vigente: 'Vigente o al día', en_tramite: 'En trámite', no_tiene: 'No tiene', vencido: 'Vencido', desconocido: 'Sin dato',
};

const alfanumerico = (s: string) => normalizarTexto(s).replace(/[^A-Z0-9]/g, '');
const digitos = (s: string) => s.replace(/\D/g, '');
const host = (s: string) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
const fmtNumero = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 2 });

// Dos textos coinciden si son iguales sin tildes ni signos, o si uno contiene al otro ("Barraca Don Aurelio" ⊂ "... S.R.L.").
function textosCoinciden(a: string, b: string) {
  const x = alfanumerico(a), y = alfanumerico(b);
  return x === y || (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x)));
}

type CampoTexto = 'nombre' | 'razonSocial' | 'rut' | 'departamento' | 'localidad' | 'web' | 'telefono' | 'emailContacto' | 'capacidadNotas' | 'experienciaLicitaciones';

const CAMPOS_TEXTO: { campo: CampoTexto; etiqueta: string; iguales: (a: string, b: string) => boolean }[] = [
  { campo: 'nombre', etiqueta: 'Nombre de la empresa', iguales: textosCoinciden },
  { campo: 'razonSocial', etiqueta: 'Razón social', iguales: textosCoinciden },
  { campo: 'rut', etiqueta: 'RUT', iguales: (a, b) => digitos(a) === digitos(b) },
  { campo: 'departamento', etiqueta: 'Departamento', iguales: (a, b) => alfanumerico(a) === alfanumerico(b) },
  { campo: 'localidad', etiqueta: 'Localidad', iguales: textosCoinciden },
  { campo: 'web', etiqueta: 'Página web', iguales: (a, b) => host(a) === host(b) },
  { campo: 'telefono', etiqueta: 'Teléfono', iguales: (a, b) => digitos(a).slice(-8) === digitos(b).slice(-8) },
  { campo: 'emailContacto', etiqueta: 'Email de contacto', iguales: (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase() },
  { campo: 'capacidadNotas', etiqueta: 'Capacidad de entrega', iguales: textosCoinciden },
  { campo: 'experienciaLicitaciones', etiqueta: 'Experiencia en licitaciones', iguales: textosCoinciden },
];

function valorUsuario<K extends keyof PerfilEmpresa>(f: FuentesPerfil, campo: K): { valor: PerfilEmpresa[K] | undefined; origen: OrigenUsuario } {
  const deEntrevista = f.entrevista?.[campo];
  if (deEntrevista !== undefined && deEntrevista !== null && deEntrevista !== '') return { valor: deEntrevista, origen: 'entrevista' };
  return { valor: f.manual?.[campo], origen: 'manual' };
}

const clavesProducto = (p: ProductoEmpresa) => normalizarTexto(p.nombre);
const claveDoc = (d: DocumentoEmpresa) => (d.tipo === 'OTRO' ? `OTRO:${normalizarTexto(d.nombre)}` : d.tipo);

function conProducto(perfil: PerfilEmpresa, nombre: string, cambio: Partial<ProductoEmpresa>): PerfilEmpresa {
  const clave = normalizarTexto(nombre);
  return { ...perfil, productos: perfil.productos.map((p) => (clavesProducto(p) === clave ? { ...p, ...cambio } : p)) };
}

function conDocumento(perfil: PerfilEmpresa, doc: DocumentoEmpresa): PerfilEmpresa {
  const clave = claveDoc(doc);
  const existe = perfil.documentacion.some((d) => claveDoc(d) === clave);
  return {
    ...perfil,
    documentacion: existe ? perfil.documentacion.map((d) => (claveDoc(d) === clave ? { ...d, estado: doc.estado, vencimiento: doc.vencimiento } : d)) : [...perfil.documentacion, doc],
  };
}

export function detectarContradicciones(f: FuentesPerfil): Contradiccion[] {
  const docs = f.documentos;
  if (!docs || (!f.manual && !f.entrevista)) return [];
  const lista: Contradiccion[] = [];

  for (const { campo, etiqueta, iguales } of CAMPOS_TEXTO) {
    const deDocs = docs[campo];
    const { valor, origen } = valorUsuario(f, campo);
    if (!deDocs || !valor || iguales(String(deDocs), String(valor))) continue;
    lista.push({
      clave: campo, etiqueta, documentos: String(deDocs), usuario: String(valor), origen, permiteAmbos: false,
      aplicar: (perfil, eleccion) => ({ ...perfil, [campo]: eleccion === 'documentos' ? deDocs : valor }),
    });
  }

  const montoDocs = docs.montoMinimo;
  const monto = valorUsuario(f, 'montoMinimo');
  if (montoDocs != null && monto.valor != null && montoDocs !== monto.valor) {
    const valorMonto = monto.valor;
    lista.push({
      clave: 'montoMinimo', etiqueta: 'Monto mínimo que te vale la pena', documentos: `$ ${fmtNumero.format(montoDocs)}`, usuario: `$ ${fmtNumero.format(valorMonto)}`,
      origen: monto.origen, permiteAmbos: false,
      aplicar: (perfil, eleccion) => ({ ...perfil, montoMinimo: eleccion === 'documentos' ? montoDocs : valorMonto }),
    });
  }

  // Zonas: fusionarPerfil las une, así que solo es contradicción si el usuario dejó afuera zonas de los documentos.
  const zonasDocs = normalizarZonas(docs.zonasEntrega ?? []);
  const zonasUsuario = normalizarZonas(valorUsuario(f, 'zonasEntrega').valor ?? []);
  if (zonasDocs.length && zonasUsuario.length && zonasDocs.some((z) => !zonasUsuario.includes(z))) {
    lista.push({
      clave: 'zonasEntrega', etiqueta: 'Departamentos donde entregás', documentos: zonasDocs.join(', '), usuario: zonasUsuario.join(', '),
      origen: valorUsuario(f, 'zonasEntrega').origen, permiteAmbos: true,
      aplicar: (perfil, eleccion) => ({
        ...perfil,
        zonasEntrega: eleccion === 'documentos' ? zonasDocs : eleccion === 'usuario' ? zonasUsuario : normalizarZonas([...zonasDocs, ...zonasUsuario]),
      }),
    });
  }

  const docsUsuario = new Map((f.entrevista?.documentacion ?? []).filter((d) => d.estado !== 'desconocido').map((d) => [claveDoc(d), d]));
  for (const doc of docs.documentacion ?? []) {
    const delUsuario = docsUsuario.get(claveDoc(doc));
    if (doc.estado === 'desconocido' || !delUsuario || delUsuario.estado === doc.estado) continue;
    lista.push({
      clave: `doc:${claveDoc(doc)}`, etiqueta: doc.tipo === 'OTRO' ? doc.nombre : NOMBRE_DOC[doc.tipo],
      documentos: ESTADO_DOC[doc.estado], usuario: ESTADO_DOC[delUsuario.estado], origen: 'entrevista', permiteAmbos: false,
      aplicar: (perfil, eleccion) => conDocumento(perfil, eleccion === 'documentos' ? doc : delUsuario),
    });
  }

  const productosUsuario = new Map((f.entrevista?.productos ?? []).map((p) => [clavesProducto(p), p]));
  for (const p of docs.productos ?? []) {
    const delUsuario = productosUsuario.get(clavesProducto(p));
    if (!delUsuario) continue;
    if (p.precioReferencia != null && delUsuario.precioReferencia != null && Math.abs(p.precioReferencia - delUsuario.precioReferencia) > 0.005 * Math.max(p.precioReferencia, delUsuario.precioReferencia)) {
      const precioUsuario = delUsuario.precioReferencia;
      lista.push({
        clave: `precio:${clavesProducto(p)}`, etiqueta: `Precio de ${p.nombre}`,
        documentos: `${p.moneda === 'USD' ? 'US$' : '$'} ${fmtNumero.format(p.precioReferencia)} por ${p.unidad}`,
        usuario: `${delUsuario.moneda === 'USD' ? 'US$' : '$'} ${fmtNumero.format(precioUsuario)} por ${delUsuario.unidad || p.unidad}`,
        origen: 'entrevista', permiteAmbos: false,
        aplicar: (perfil, eleccion) => conProducto(perfil, p.nombre, eleccion === 'documentos'
          ? { precioReferencia: p.precioReferencia, moneda: p.moneda }
          : { precioReferencia: precioUsuario, moneda: delUsuario.moneda }),
      });
    }
    if (p.unidad && delUsuario.unidad && alfanumerico(p.unidad) !== alfanumerico(delUsuario.unidad)) {
      lista.push({
        clave: `unidad:${clavesProducto(p)}`, etiqueta: `Unidad de venta de ${p.nombre}`, documentos: p.unidad, usuario: delUsuario.unidad,
        origen: 'entrevista', permiteAmbos: false,
        aplicar: (perfil, eleccion) => conProducto(perfil, p.nombre, { unidad: eleccion === 'documentos' ? p.unidad : delUsuario.unidad }),
      });
    }
  }

  return lista;
}

export function aplicarElecciones(perfil: PerfilEmpresa, contradicciones: Contradiccion[], elecciones: Record<string, Eleccion>): PerfilEmpresa {
  const resuelto = contradicciones.reduce((p, c) => (elecciones[c.clave] ? c.aplicar(p, elecciones[c.clave]) : p), perfil);
  return { ...resuelto, camposFaltantes: calcularFaltantes(resuelto, perfil.camposFaltantes) };
}
