import { Suspense } from 'react';
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
import { requerirSesion } from '@/server/auth/sesion';
import { obtenerDetalle } from '@/server/consultas/licitaciones';

export const metadata: Metadata = { title: 'Licitación · Luxis' };

function decodificar(id: string) {
  try { return decodeURIComponent(id); } catch { return id; }
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
        <ArrowLeft aria-hidden className="size-4" /> Volver a mis licitaciones
      </Link>
      <VistaLicitacion
        d={d}
        diasCierre={diasCierre}
        contenido={{
          resumen: <ResumenIa analisis={d.analisis} match={d.match} accionAnalizar={<BotonAnalizar idCompra={l.idCompra} />} />,
          precios: (
            <div className="space-y-8">
              <PanelPrecio precios={d.precios} items={d.items} />
              <TablaItems items={d.items} ofertables={d.match?.itemsOfertables ?? []} />
            </div>
          ),
          papeles: <PanelDocumentacion gap={d.match?.gapDocumental ?? []} requisitos={d.analisis?.requisitosDocumentales ?? []} />,
          fechas: <PanelFechas detalle={d} ahora={ahora} />,
          chat: <div data-slot="chat-pliego" className="min-h-64"><ChatPliego idCompra={l.idCompra} /></div>,
          archivos: (
            <div className="space-y-4">
              <a href={l.urlOfertar} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Ofertar en línea en el sistema del Estado (SICE) <ExternalLink aria-hidden />
              </a>
              <ListaArchivos archivos={d.archivos} aclaraciones={d.aclaraciones} />
            </div>
          ),
        }}
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
