import { Suspense } from 'react';
import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fechaHora } from '@/components/licitaciones/formato';
import { Cargando } from '@/components/ui/cargando';
import { nombreModeloFuerte, nombreModeloRapido } from '@/lib/ia/modelos';
import { coberturaDatos } from '@/server/consultas/cobertura';

export const metadata: Metadata = { title: 'Cómo funciona la IA · Luxis' };

const COMPONENTES = [
  {
    titulo: 'Perfil de tu empresa',
    texto: 'Lee tu lista de precios, tu carta y tu web (o te entrevista por chat o voz) y arma tu perfil: qué vendés, dónde entregás, tu capacidad y tu documentación. Solo pregunta lo que falta y vos confirmás todo antes de guardarlo.',
    modelo: 'fuerte',
  },
  {
    titulo: 'Matching',
    texto: 'Compara tu perfil con cada licitación vigente del rubro: ítems que vendés, zona de entrega, volumen y papeles. Devuelve una confianza de 0 a 100 y el motivo. Nunca descarta sola: si tiene dudas, te la muestra con confianza baja.',
    modelo: 'rápido',
  },
  {
    titulo: 'Lectura del pliego',
    texto: 'Descarga los archivos de ARCE (pdf, doc, docx, xls, zip, rar), extrae el texto y resume qué piden, los requisitos documentales, las fechas clave (consultas, visita, apertura, entrega), las condiciones y los riesgos.',
    modelo: 'rápido (fuerte al reanalizar)',
  },
  {
    titulo: 'Precio ganador histórico',
    texto: 'Lo calcula la base de datos, no la IA: percentiles de los precios adjudicados del mismo artículo, en la misma unidad y moneda, en los últimos 24 meses, más quién ganó y quién compite. La IA solo escribe la explicación del precio sugerido.',
    modelo: 'cálculo SQL + rápido para el texto',
  },
  {
    titulo: 'Chat con el pliego',
    texto: 'Responde tus preguntas usando solo el pliego, con la cita del archivo y el párrafo. Si algo no está en el pliego, te lo dice en lugar de inventarlo.',
    modelo: 'fuerte',
  },
];

const LIMITACIONES = [
  'Los precios son sin IVA: ARCE publica el precio unitario adjudicado sin impuestos.',
  'ARCE no publica las ofertas que perdieron, por eso mostramos el precio ganador histórico y no una probabilidad de ganar.',
  'Los pliegos escaneados (imágenes sin texto) no se pueden leer: lo marcamos y el análisis se basa solo en los datos publicados.',
  'Las compras directas que se publican ya adjudicadas, sin llamado abierto, no aparecen como oportunidad.',
  'Las monedas no se convierten: el historial se agrupa por moneda y unidad.',
  'La IA puede equivocarse. Por eso cada resultado trae su confianza y su motivo, y nada se descarta solo.',
];

const fmt = new Intl.NumberFormat('es-UY');
const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)} %`);

interface Evaluacion {
  fecha: string;
  casos: number;
  errores: number;
  porUmbral: { umbral: number; precision: number | null; recall: number | null; f1: number | null }[];
}

async function leerEvaluacion(): Promise<Evaluacion | null> {
  try {
    const crudo = await readFile(path.join(process.cwd(), 'demo-assets', 'eval-resultado.json'), 'utf8');
    const e = JSON.parse(crudo) as Evaluacion;
    return Array.isArray(e.porUmbral) ? e : null;
  } catch {
    return null;
  }
}

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg">{titulo}</h2>
      {children}
    </section>
  );
}

async function Cobertura() {
  const c = await coberturaDatos();
  const datos = [
    { etiqueta: 'Licitaciones vigentes del rubro', valor: c.licitacionesRubro },
    { etiqueta: 'Adjudicaciones históricas', valor: c.adjudicaciones },
    { etiqueta: 'Artículos con historial de precio', valor: c.articulosConHistorial },
    { etiqueta: 'Licitaciones con pliego leído', valor: c.pliegosLeidos },
  ];
  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {datos.map((d) => (
          <div key={d.etiqueta} className="rounded-md border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{d.etiqueta}</dt>
            <dd className="mt-1 text-2xl font-semibold">{fmt.format(d.valor)}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        Números leídos de la base en este momento. Última actualización desde ARCE: <span className="font-mono">{fechaHora(c.ultimaIngesta ? new Date(c.ultimaIngesta).toISOString() : null)}</span>.
      </p>
    </div>
  );
}

async function Calidad() {
  const e = await leerEvaluacion();
  if (!e) {
    return <p className="text-sm text-muted-foreground">La evaluación con casos etiquetados todavía no se corrió en este entorno.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">
        Etiquetamos a mano <span className="font-medium">{e.casos + e.errores} llamados reales de ARCE</span>: 10 que una barraca puede ofertar y 10 que no, incluidos 3 tramposos (una obra llave en mano, un servicio de albañilería y una compra de maquinaria). Después corrimos el matching contra la empresa demo y medimos.
      </p>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">Precisión, recall y F1 del matching según el umbral de confianza</caption>
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Mostrar desde confianza</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Precisión</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Recall</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">F1</th>
            </tr>
          </thead>
          <tbody>
            {e.porUmbral.map((m) => (
              <tr key={m.umbral} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono">{m.umbral}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{pct(m.precision)}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{pct(m.recall)}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{pct(m.f1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Precisión: de lo que mostramos, cuánto era realmente para la barraca. Recall: de lo que era para la barraca, cuánto encontramos. {e.casos} casos evaluados{e.errores ? `, ${e.errores} con error` : ''}, corrida del <span className="font-mono">{fechaHora(e.fecha)}</span>.
      </p>
    </div>
  );
}

export default function ComoFuncionaPage() {
  return (
    <div className="max-w-4xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl">Cómo funciona la IA</h1>
        <p className="text-muted-foreground">
          Qué hace cada parte, con qué datos, qué no puede hacer y qué tan bien funciona. La IA interpreta textos; los números (precios, percentiles, competidores) los calcula la base de datos.
        </p>
      </header>

      <Seccion id="componentes" titulo="Qué hace cada parte">
        <ol className="grid gap-3 md:grid-cols-2">
          {COMPONENTES.map((c, i) => (
            <li key={c.titulo} className="space-y-1.5 rounded-md border bg-card p-4">
              <h3 className="text-base"><span className="mr-2 font-mono text-muted-foreground">{i + 1}</span>{c.titulo}</h3>
              <p className="text-sm leading-relaxed">{c.texto}</p>
              <p className="text-xs text-muted-foreground">Modelo: {c.modelo}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground">
          Modelos en uso: rápido <span className="font-mono">{nombreModeloRapido}</span> para lo masivo; fuerte <span className="font-mono">{nombreModeloFuerte}</span> para el chat, la entrevista y los reanálisis.
        </p>
      </Seccion>

      <Seccion id="datos" titulo="Qué datos usa">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>Los llamados vigentes y las adjudicaciones de la interfaz XML pública de ARCE, con sus ítems, oferentes y precios.</li>
          <li>Las páginas de detalle y los archivos de pliego publicados en comprasestatales.gub.uy.</li>
          <li>Los documentos y la web que cargás vos al crear tu perfil, y lo que contestás en la entrevista.</li>
        </ul>
        <p className="text-xs text-muted-foreground">Datos: Agencia Reguladora de Compras Estatales (ARCE), Uruguay — Licencia de Datos Abiertos.</p>
      </Seccion>

      <Seccion id="limitaciones" titulo="Limitaciones">
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          {LIMITACIONES.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </Seccion>

      <Seccion id="cobertura" titulo="Cobertura">
        <Suspense fallback={<Cargando texto="Contando lo que hay en la base…" className="py-6" />}>
          <Cobertura />
        </Suspense>
      </Seccion>

      <Seccion id="calidad" titulo="Qué tan bien funciona el matching">
        <Suspense fallback={<Cargando texto="Leyendo la evaluación…" className="py-6" />}>
          <Calidad />
        </Suspense>
      </Seccion>
    </div>
  );
}
