import { ExternalLink, FileText } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { ArchivoLicitacion, DetalleLicitacion, EstadoExtraccion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CATEGORIA_ARCHIVO, fechaHora, tamano } from './formato';

const ESTADO: Record<EstadoExtraccion, { texto: string; clase: string }> = {
  ok: { texto: 'Leído', clase: 'bg-exito-suave text-exito' },
  no_soportado: { texto: 'No se pudo leer', clase: 'bg-alerta-suave text-alerta-fuerte' },
  error: { texto: 'Error al leer', clase: 'bg-error-suave text-error' },
  pendiente: { texto: 'Pendiente', clase: 'bg-muted text-muted-foreground' },
};

function FilaArchivo({ a }: { a: ArchivoLicitacion }) {
  const e = ESTADO[a.estadoExtraccion];
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
      <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{a.nombre}</p>
        <p className="text-xs text-muted-foreground">
          {CATEGORIA_ARCHIVO[a.categoria]} · {a.extension.toUpperCase()} · {tamano(a.tamano)}
          {a.contenedor && <> · dentro de {a.contenedor}</>}
          {a.caracteres !== null && a.estadoExtraccion === 'ok' && <> · <span className="font-mono">{a.caracteres.toLocaleString('es-UY')}</span> caracteres</>}
        </p>
        {a.error && <p className="text-xs text-muted-foreground">{a.error}</p>}
      </div>
      <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', e.clase)}>{e.texto}</span>
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
        Ver original <ExternalLink aria-hidden className="size-3.5" /><span className="sr-only">(abre ARCE en otra pestaña)</span>
      </a>
    </li>
  );
}

export function ListaArchivos({ archivos, aclaraciones }: { archivos: ArchivoLicitacion[]; aclaraciones: DetalleLicitacion['aclaraciones'] }) {
  return (
    <div className="space-y-6">
      {archivos.length ? (
        <ul className="divide-y rounded-md border bg-card">{archivos.map((a) => <FilaArchivo key={a.id} a={a} />)}</ul>
      ) : (
        <EstadoVacio icono={FileText} titulo="Esta licitación no tiene archivos adjuntos" descripcion="El análisis se hace solo con los datos publicados en ARCE." />
      )}
      {aclaraciones.length > 0 && (
        <section className="space-y-2" aria-labelledby="titulo-aclaraciones">
          <h2 id="titulo-aclaraciones" className="text-base">Aclaraciones publicadas</h2>
          <ul className="divide-y rounded-md border bg-card">
            {aclaraciones.map((a, i) => (
              <li key={i} className="space-y-1 p-3">
                <p className="font-mono text-xs text-muted-foreground">{fechaHora(a.fecha)}</p>
                <p className="text-sm">{a.texto}</p>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
                    Ver documento <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
