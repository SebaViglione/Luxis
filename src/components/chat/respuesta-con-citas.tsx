'use client';

import { ChevronRight, FileText } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

export interface Cita {
  archivo: string;
  parrafo: number | null; // null = datos del portal ARCE
  /** Cómo mostrarla: "p12" o "p7–10" si el modelo citó un rango. */
  etiqueta?: string;
}

const GRUPO_ENTRE_CORCHETES = /\[([^[\]]+)\]/g;
const REFERENCIA_PARRAFO = /\bp\.?\s*(\d+)(?:\s*[-–]\s*p?\.?\s*(\d+))?/gi;

/**
 * Interpreta "[archivo, p12]", "[a.pdf, p3; b.pdf, p5]", "[a.pdf, p7-10]", "[a.pdf, p12, p13]",
 * "[a.pdf, p8 / sección 10.3]" o "[Datos ARCE]". Devuelve null si no es una cita.
 */
function parsearCitas(contenido: string): Cita[] | null {
  if (/^datos arce$/i.test(contenido.trim())) return [{ archivo: 'Datos ARCE', parrafo: null }];
  if (/^perfil de (tu|la) empresa$/i.test(contenido.trim())) return [{ archivo: 'Perfil de tu empresa', parrafo: null }];
  if (/^precios hist[oó]ricos$/i.test(contenido.trim())) return [{ archivo: 'Precios históricos', parrafo: null }];
  const citas: Cita[] = [];
  for (const parte of contenido.split(';')) {
    const m = /^\s*(.+?),\s*(p\.?\s*\d+.*)$/i.exec(parte);
    if (!m) {
      if (/^\s*(datos arce|perfil de (tu|la) empresa|precios hist[oó]ricos)\s*$/i.test(parte)) continue;
      return null;
    }
    const archivo = m[1].trim();
    for (const ref of m[2].matchAll(REFERENCIA_PARRAFO)) {
      const desde = Number(ref[1]);
      citas.push({ archivo, parrafo: desde, etiqueta: ref[2] ? `p${desde}–${ref[2]}` : `p${desde}` });
    }
  }
  return citas.length ? citas : null;
}

function clave(c: Cita) {
  return `${c.archivo}#${c.parrafo ?? ''}`;
}

/** Todas las citas de una respuesta, sin repetir. */
export function extraerCitas(texto: string): Cita[] {
  const citas = new Map<string, Cita>();
  for (const m of texto.matchAll(GRUPO_ENTRE_CORCHETES)) {
    parsearCitas(m[1])?.forEach((c) => citas.set(clave(c), c));
  }
  return [...citas.values()];
}

/** Texto con **negritas** y citas marcadas como etiquetas. */
function TextoEnLinea({ texto }: { texto: string }) {
  const piezas: React.ReactNode[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(GRUPO_ENTRE_CORCHETES)) {
    const citas = parsearCitas(m[1]);
    if (!citas) continue;
    piezas.push(<Negritas key={`t${ultimo}`} texto={texto.slice(ultimo, m.index)} />);
    citas.forEach((c) => {
      piezas.push(
        <span
          key={`c${m.index}-${clave(c)}`}
          className="mx-0.5 inline-flex items-center rounded-sm border bg-muted px-1 align-baseline font-mono text-[0.7rem] text-muted-foreground"
        >
          {c.parrafo ? `${c.archivo} · ${c.etiqueta ?? `p${c.parrafo}`}` : c.archivo}
        </span>,
      );
    });
    ultimo = (m.index ?? 0) + m[0].length;
  }
  piezas.push(<Negritas key={`t${ultimo}-fin`} texto={texto.slice(ultimo)} />);
  return <>{piezas}</>;
}

function Negritas({ texto }: { texto: string }) {
  const partes = texto.split(/\*\*([^*]+)\*\*/g);
  return (
    <>
      {partes.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

/** Respuesta del asistente: párrafos, viñetas, citas en línea y lista plegable de fuentes al pie. */
export function RespuestaConCitas({ texto, idCompra }: { texto: string; idCompra: string }) {
  const bloques: React.ReactNode[] = [];
  let lista: string[] = [];
  const cerrarLista = () => {
    if (!lista.length) return;
    const items = lista;
    bloques.push(
      <ul key={`ul${bloques.length}`} className="ml-4 list-disc space-y-1">
        {items.map((item, i) => (
          <li key={i}>
            <TextoEnLinea texto={item} />
          </li>
        ))}
      </ul>,
    );
    lista = [];
  };

  for (const linea of texto.split('\n')) {
    const vineta = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(linea);
    if (vineta) {
      lista.push(vineta[1]);
      continue;
    }
    cerrarLista();
    if (!linea.trim()) continue;
    const titulo = /^#{1,4}\s+(.*)$/.exec(linea);
    bloques.push(
      <p key={`p${bloques.length}`} className={titulo ? 'font-semibold' : undefined}>
        <TextoEnLinea texto={titulo ? titulo[1] : linea} />
      </p>,
    );
  }
  cerrarLista();

  const fuentes = extraerCitas(texto).filter((c) => c.parrafo !== null);

  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {bloques}
      {fuentes.length > 0 && (
        <details className="group mt-1 rounded-md border bg-muted/40 text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-1 px-2 py-1.5 text-muted-foreground select-none">
            <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden />
            Ver fuentes citadas ({fuentes.length})
          </summary>
          <ul className="flex flex-col gap-1 px-2 pb-2">
            {fuentes.map((c) => (
              <li key={clave(c)}>
                <FuentePlegable cita={c} idCompra={idCompra} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function FuentePlegable({ cita, idCompra }: { cita: Cita; idCompra: string }) {
  const [estado, setEstado] = useState<'cerrado' | 'cargando' | 'listo' | 'error'>('cerrado');
  const [texto, setTexto] = useState<string | null>(null);
  const [archivoReal, setArchivoReal] = useState<string | null>(null);

  const cargar = async () => {
    if (estado === 'listo' || estado === 'cargando') return;
    setEstado('cargando');
    try {
      const params = new URLSearchParams({ idCompra, archivo: cita.archivo, p: String(cita.parrafo) });
      const respuesta = await fetch(`/api/chat/pliego?${params}`);
      const cuerpo = (await respuesta.json()) as { texto?: string | null; archivo?: string | null };
      setTexto(cuerpo.texto ?? null);
      setArchivoReal(cuerpo.archivo ?? null);
      setEstado(respuesta.ok ? 'listo' : 'error');
    } catch {
      setEstado('error');
    }
  };

  return (
    <details onToggle={(e) => (e.currentTarget.open ? void cargar() : undefined)} className="rounded-sm border bg-background">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-1 font-mono select-none">
        <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{cita.archivo}</span>
        <span className="text-muted-foreground">· {cita.etiqueta ?? `p${cita.parrafo}`}</span>
      </summary>
      <div className="border-t px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
        {estado === 'cargando' && (
          <span className="flex items-center gap-1.5">
            <Spinner className="size-3" /> Buscando el párrafo…
          </span>
        )}
        {estado === 'listo' && archivoReal && archivoReal !== cita.archivo && (
          <span className="mb-1 block font-mono text-[0.7rem]">Archivo: {archivoReal}</span>
        )}
        {estado === 'listo' && (texto ?? 'No encontramos ese párrafo en el archivo (la cita puede estar mal numerada).')}
        {estado === 'error' && 'No pudimos cargar el párrafo.'}
      </div>
    </details>
  );
}
