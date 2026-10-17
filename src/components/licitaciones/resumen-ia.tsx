import { FileSearch, Info, TriangleAlert } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/estado-vacio';
import type { AnalisisPliego, Condiciones, DetalleLicitacion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BadgeConfianza } from './badge-confianza';

const ESCALA = [
  { desde: 90, texto: '90–100: vendés todos los ítems principales y la zona es alcanzable' },
  { desde: 70, texto: '70–89: vendés la mayoría de los ítems' },
  { desde: 40, texto: '40–69: coincidencia parcial o dudas de zona o capacidad' },
  { desde: 0, texto: 'Menos de 40: no parece para tu empresa' },
];

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
      <h3 className="text-sm text-muted-foreground">{titulo}</h3>
      {children}
    </section>
  );
}

export function ResumenIa({ analisis, match }: { analisis: AnalisisPliego | null; match: DetalleLicitacion['match'] }) {
  if (!analisis && !match) {
    return <EstadoVacio icono={FileSearch} titulo="Todavía no analizamos esta licitación" descripcion="Cuando leamos el pliego vas a ver acá el resumen, lo que piden, los riesgos y por qué te conviene o no." />;
  }
  const escala = match ? ESCALA.find((e) => match.confianza >= e.desde) : null;
  const condiciones = analisis ? CONDICIONES.map((c) => ({ ...c, valor: valorCondicion(analisis.condiciones, c.clave) })).filter((c) => c.valor) : [];
  const conIva = analisis?.condiciones.cotizarConIva;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-6">
        {analisis?.basadoEn === 'metadata' && (
          <p className="flex items-start gap-2 rounded-md bg-alerta-suave px-3 py-2 text-sm text-alerta-fuerte">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-alerta" />
            Este análisis se basa solo en los datos publicados en ARCE: no pudimos leer el pliego, así que la confianza es menor.
          </p>
        )}
        {analisis && (
          <>
            <Bloque titulo="Resumen"><p className="text-sm leading-relaxed">{analisis.resumen}</p></Bloque>
            <Bloque titulo="Qué piden"><p className="text-sm leading-relaxed">{analisis.quePiden}</p></Bloque>
          </>
        )}
        {match && <Bloque titulo="Por qué te la mostramos"><p className="text-sm leading-relaxed">{match.razon}</p></Bloque>}
        {analisis && analisis.riesgos.length > 0 && (
          <Bloque titulo="Riesgos">
            <ul className="space-y-1.5">
              {analisis.riesgos.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm"><TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-alerta" />{r}</li>
              ))}
            </ul>
          </Bloque>
        )}
        {(condiciones.length > 0 || typeof conIva === 'boolean') && (
          <Bloque titulo="Condiciones">
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

      {match && (
        <aside className="h-fit space-y-3 rounded-md border bg-card p-4" aria-labelledby="titulo-confianza">
          <h3 id="titulo-confianza" className="text-sm text-muted-foreground">Confianza del match</h3>
          <BadgeConfianza valor={match.confianza} grande />
          <ul className="space-y-1 text-xs">
            {ESCALA.map((e) => (
              <li key={e.desde} className={cn(e === escala ? 'font-medium text-foreground' : 'text-muted-foreground')}>{e.texto}</li>
            ))}
          </ul>
          {analisis && (
            <p className="border-t pt-3 text-xs text-muted-foreground">
              Lectura del pliego: confianza <span className="font-mono text-foreground">{analisis.confianza}</span>
              {analisis.basadoEn === 'pliego' ? ', a partir del pliego.' : ', solo con datos de ARCE.'}
            </p>
          )}
        </aside>
      )}
    </div>
  );
}
