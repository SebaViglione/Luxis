import { FileSearch, Info, TriangleAlert } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { AnalisisPliego, Condiciones, DetalleLicitacion } from '@/lib/types';

const CONDICIONES: { clave: keyof Condiciones; etiqueta: string }[] = [
  { clave: 'plazoEntrega', etiqueta: 'Plazo de entrega' },
  { clave: 'lugarEntrega', etiqueta: 'Lugar de entrega' },
  { clave: 'formaPago', etiqueta: 'Forma de pago' },
  { clave: 'mantenimientoOferta', etiqueta: 'Mantenimiento de oferta' },
  { clave: 'garantia', etiqueta: 'Garantía' },
  { clave: 'muestras', etiqueta: 'Muestras' },
  { clave: 'moneda', etiqueta: 'Moneda' },
];

function valorCondicion(c: Condiciones, clave: keyof Condiciones) {
  const v = c[clave];
  if (v === undefined || v === null || v === '') return null;
  return typeof v === 'boolean' ? (v ? 'Sí' : 'No') : v;
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-base font-semibold">{titulo}</h3>
      {children}
    </section>
  );
}

export function ResumenIa({ analisis, match, accionAnalizar }: { analisis: AnalisisPliego | null; match: DetalleLicitacion['match']; accionAnalizar?: React.ReactNode }) {
  if (!analisis && !match) {
    return <EstadoVacio icono={FileSearch} titulo="Todavía no analizamos esta licitación" descripcion="Cuando leamos el pliego vas a ver acá el resumen, lo que piden, los riesgos y por qué te conviene o no." accion={accionAnalizar} />;
  }
  const condiciones = analisis ? CONDICIONES.map((c) => ({ ...c, valor: valorCondicion(analisis.condiciones, c.clave) })).filter((c) => c.valor) : [];
  const conIva = analisis?.condiciones.cotizarConIva;

  return (
    <div className="max-w-3xl">
      <div className="space-y-6">
        {!analisis && (
          <div className="space-y-3 rounded-md border border-dashed bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Todavía no leímos el pliego: el motivo de abajo sale solo de los datos publicados en ARCE.</p>
            {accionAnalizar}
          </div>
        )}
        {analisis?.basadoEn === 'metadata' && (
          <p className="flex items-start gap-2 rounded-md bg-alerta-suave px-3 py-2 text-sm text-alerta-fuerte">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-alerta" />
            Este resumen sale solo de lo publicado en ARCE: no pudimos leer el pliego, así que puede faltar información.
          </p>
        )}
        {analisis && (
          <>
            <Bloque titulo="En pocas palabras"><p className="leading-relaxed">{analisis.resumen}</p></Bloque>
            <Bloque titulo="Qué compran"><p className="leading-relaxed">{analisis.quePiden}</p></Bloque>
          </>
        )}
        {match && <Bloque titulo="Por qué te la mostramos"><p className="leading-relaxed">{match.razon}</p></Bloque>}
        {analisis && analisis.riesgos.length > 0 && (
          <Bloque titulo="Ojo con esto">
            <ul className="space-y-1.5">
              {analisis.riesgos.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm"><TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-alerta" />{r}</li>
              ))}
            </ul>
          </Bloque>
        )}
        {(condiciones.length > 0 || typeof conIva === 'boolean') && (
          <Bloque titulo="Condiciones de la compra">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {condiciones.map((c) => (
                <div key={c.clave}><dt className="text-xs text-muted-foreground">{c.etiqueta}</dt><dd className="text-sm">{c.valor}</dd></div>
              ))}
              {typeof conIva === 'boolean' && (
                <div><dt className="text-xs text-muted-foreground">Cotizar con IVA</dt><dd className="text-sm">{conIva ? 'Sí' : 'No'}</dd></div>
              )}
            </dl>
          </Bloque>
        )}
      </div>

    </div>
  );
}
