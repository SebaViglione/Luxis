import { cacheLife } from 'next/cache';
import { coberturaDatos } from '@/server/consultas/cobertura';
import { Aparecer } from './aparecer';
import { Cifras } from './cifras';
import { FondoTinta } from './fondos';

// Si la consulta falla tira y no se cachea; Cobertura lo atrapa y oculta la sección.
async function leerCobertura() {
  'use cache';
  cacheLife('hours');
  return coberturaDatos();
}

const fechaUy = (iso: string) =>
  new Intl.DateTimeFormat('es-UY', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Montevideo' }).format(new Date(iso));

export async function Cobertura() {
  let datos: Awaited<ReturnType<typeof coberturaDatos>>;
  try {
    datos = await leerCobertura();
  } catch {
    return null;
  }
  if (datos.adjudicaciones === 0 && datos.licitacionesRubro === 0) return null;

  const cifras = [
    { valor: datos.licitacionesRubro, etiqueta: 'licitaciones vigentes del rubro, ahora' },
    { valor: datos.adjudicaciones, etiqueta: 'adjudicaciones analizadas para precios' },
    { valor: datos.articulosConHistorial, etiqueta: 'artículos con historial de precio' },
    { valor: datos.pliegosLeidos, etiqueta: 'pliegos leídos por la IA' },
  ];

  return (
    <section id="datos" className="relative scroll-mt-16 overflow-hidden border-b bg-foreground text-background">
      <FondoTinta />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-24">
        <Aparecer className="max-w-2xl">
          <p className="font-mono text-xs tracking-wide text-background/60 uppercase">Datos reales, en vivo</p>
          <h2 className="mt-3 text-3xl text-balance md:text-5xl">Todo sale de los datos abiertos de ARCE.</h2>
          <p className="mt-4 text-background/70">
            Ingerimos los llamados y las adjudicaciones de compras estatales todos los días. Estos números son los de hoy, no una estimación.
          </p>
        </Aparecer>
        <Cifras cifras={cifras} />
        {datos.ultimaIngesta && (
          <p className="mt-10 font-mono text-xs text-background/50">Última actualización: {fechaUy(datos.ultimaIngesta)}</p>
        )}
      </div>
    </section>
  );
}
