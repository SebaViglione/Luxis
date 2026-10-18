import { cache, Suspense } from 'react';
import { DetalleCargando } from '@/components/licitaciones/detalle-cargando';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ChatPliego } from '@/components/chat/chat-pliego';
import { BotonAnalizar } from '@/components/licitaciones/boton-analizar';
import { ListaArchivos } from '@/components/licitaciones/lista-archivos';
import { PanelDocumentacion } from '@/components/licitaciones/panel-documentacion';
import { PanelFechas } from '@/components/licitaciones/panel-fechas';
import { PanelPrecio } from '@/components/licitaciones/panel-precio';
import { ResumenIa } from '@/components/licitaciones/resumen-ia';
import { TablaItems } from '@/components/licitaciones/tabla-items';
import { buttonVariants } from '@/components/ui/button';
import { VistaLicitacion } from '@/components/licitaciones/vista-licitacion';
import { MontoPosible } from '@/components/licitaciones/panel-decision';
import { Skeleton } from '@/components/ui/skeleton';
import type { DetalleLicitacion } from '@/lib/types';
import { requerirSesion } from '@/server/auth/sesion';
import { obtenerDetalle } from '@/server/consultas/licitaciones';
import { historialPrecios, itemsDesdeOfertables, monedaDeTexto, precioDesdeHistorial } from '@/server/precios/historial';

export const metadata: Metadata = { title: 'Licitación · Luxis' };

function decodificar(id: string) {
  try { return decodeURIComponent(id); } catch { return id; }
}


// Precio e historial solo para los ítems que la empresa puede ofertar. Si ARCE no publicó ítems (p. ej. IM), se arman desde el pliego (maxi).
// Un solo cálculo por request: lo usan el panel de decisión y la pestaña Precios.
const preciosDelDetalle = cache(async (d: DetalleLicitacion) => {
  const ofertables = d.match?.itemsOfertables ?? [];
  const vendibles = new Set(ofertables.filter((o) => o.puedeOfertar).map((o) => o.nroItem));
  const segunPliego = d.items.length === 0 && ofertables.length > 0;
  const monedaPliego = monedaDeTexto(d.analisis?.condiciones.moneda);
  const items = segunPliego ? itemsDesdeOfertables(ofertables, monedaPliego ?? 'UYU') : d.items;
  const conPrecio = new Map(d.precios.map((p) => [p.nroItem, p]));
  // Sin precio guardado: ítems del pliego, o ítems de ARCE a los que todavía no se les calculó.
  const calcularAca = (nroItem: number) => segunPliego || !conPrecio.has(nroItem);
  const aConsultar = items.filter((i) => vendibles.has(i.nroItem) && (calcularAca(i.nroItem) || (conPrecio.get(i.nroItem)?.n ?? 0) > 0));
  const historial = await historialPrecios(d.licitacion.idCompra, aConsultar);
  const precios = items
    .filter((i) => vendibles.has(i.nroItem))
    .map((i) => (calcularAca(i.nroItem) ? precioDesdeHistorial(i, historial[i.nroItem]) : conPrecio.get(i.nroItem)!));
  return { ofertables, segunPliego, monedaPliego, items, historial, precios };
});

async function ItemsYPrecio({ d }: { d: DetalleLicitacion }) {
  const { ofertables, segunPliego, monedaPliego, items, historial, precios } = await preciosDelDetalle(d);
  return (
    <div className="space-y-8">
      <PanelPrecio precios={precios} items={items} historial={historial} monedaSupuesta={segunPliego && !monedaPliego} />
      <TablaItems items={items} ofertables={ofertables} segunPliego={segunPliego} />
    </div>
  );
}

async function MontoDecision({ d }: { d: DetalleLicitacion }) {
  const { items, precios } = await preciosDelDetalle(d);
  const cantidad = new Map(items.map((i) => [i.nroItem, i.cantidad]));
  const total = precios.reduce((t, p) => {
    const c = cantidad.get(p.nroItem);
    return p.precioSugerido !== null && c !== undefined && Number.isFinite(c) ? t + p.precioSugerido * c : t;
  }, 0);
  return <MontoPosible total={total} moneda={precios[0]?.moneda ?? 'UYU'} />;
}

function ItemsYPrecioCargando() {
  return (
    <div aria-hidden className="space-y-3">
      <Skeleton className="h-6 w-64" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  const { empresaId } = await requerirSesion();
  const d = await obtenerDetalle(empresaId, decodificar(id));
  if (!d) notFound();

  // eslint-disable-next-line react-hooks/purity -- Server Component dinámico: se renderiza una vez por request.
  const ahora = Date.now();
  const l = d.licitacion;
  const diasCierre = l.fechaTopeOfertas ? Math.ceil((Date.parse(l.fechaTopeOfertas) - ahora) / 864e5) : null;

  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" /> Volver a licitaciones
      </Link>
      <VistaLicitacion
        d={d}
        diasCierre={diasCierre}
        montoPrecio={
          <Suspense fallback={<div aria-hidden className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-44" /></div>}>
            <MontoDecision d={d} />
          </Suspense>
        }
        contenido={{
          resumen: <ResumenIa analisis={d.analisis} match={d.match} accionAnalizar={<BotonAnalizar idCompra={l.idCompra} />} />,
          precios: (
            <Suspense fallback={<ItemsYPrecioCargando />}>
              <ItemsYPrecio d={d} />
            </Suspense>
          ),
          papeles: <PanelDocumentacion gap={d.match?.gapDocumental ?? []} requisitos={d.analisis?.requisitosDocumentales ?? []} />,
          fechas: <PanelFechas detalle={d} ahora={ahora} />,
          archivos: (
            <div className="space-y-4">
              <a href={l.urlOfertar} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Ofertar en línea en el sistema del Estado (SICE) <ExternalLink aria-hidden />
              </a>
              <ListaArchivos archivos={d.archivos} aclaraciones={d.aclaraciones} />
            </div>
          ),
        }}
        chat={<ChatPliego idCompra={l.idCompra} enPanel />}
      />
    </div>
  );
}

export default function DetalleLicitacionPage({ params }: PageProps<'/licitaciones/[id]'>) {
  return (
    <Suspense fallback={<DetalleCargando />}>
      <Detalle params={params} />
    </Suspense>
  );
}
