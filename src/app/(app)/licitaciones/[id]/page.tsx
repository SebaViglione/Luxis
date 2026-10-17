import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ChatPliego } from '@/components/chat/chat-pliego';
import { AccionesMatch } from '@/components/licitaciones/acciones-match';
import { BadgeDocumentacion } from '@/components/licitaciones/badge-documentacion';
import { fecha, fechaHora, suavizarMayusculas, textoCierre } from '@/components/licitaciones/formato';
import { ListaArchivos } from '@/components/licitaciones/lista-archivos';
import { PanelDocumentacion } from '@/components/licitaciones/panel-documentacion';
import { PanelFechas } from '@/components/licitaciones/panel-fechas';
import { PanelPrecio } from '@/components/licitaciones/panel-precio';
import { ResumenIa } from '@/components/licitaciones/resumen-ia';
import { TablaItems } from '@/components/licitaciones/tabla-items';
import { buttonVariants } from '@/components/ui/button';
import { Cargando } from '@/components/ui/cargando';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { empresaActual, obtenerDetalle } from '@/lib/mocks/consultas';
import { cn } from '@/lib/utils';

function Dato({ etiqueta, children, destacado }: { etiqueta: string; children: React.ReactNode; destacado?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className={cn('text-sm', destacado && 'font-medium')}>{children}</dd>
    </div>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empresa = await empresaActual();
  const d = await obtenerDetalle(empresa.id, id);
  if (!d) notFound();

  // eslint-disable-next-line react-hooks/purity -- Server Component dinámico: se renderiza una vez por request.
  const ahora = Date.now();
  const l = d.licitacion;
  const diasCierre = l.fechaTopeOfertas ? Math.ceil((Date.parse(l.fechaTopeOfertas) - ahora) / 864e5) : null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" /> Licitaciones
      </Link>

      <header className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{l.organismo}{l.unidadEjecutora && ` · ${l.unidadEjecutora}`}</p>
          <h1 className="text-2xl leading-tight">{suavizarMayusculas(l.objeto)}</h1>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          <Dato etiqueta="Tipo y número">{l.tipoCompraNombre} <span className="font-mono">{l.numero}</span></Dato>
          <Dato etiqueta="Estado">{l.estado}</Dato>
          <Dato etiqueta="Publicada"><span className="font-mono">{fecha(l.fechaPublicacion)}</span></Dato>
          <Dato etiqueta="Consultas hasta"><span className="font-mono">{fechaHora(l.fechaSolAclar)}</span></Dato>
          <Dato etiqueta="Recepción de ofertas" destacado>
            <span className="font-mono">{fechaHora(l.fechaTopeOfertas)}</span>
            <span className="block text-xs font-normal text-muted-foreground">{textoCierre(diasCierre)}</span>
          </Dato>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          {d.match && <AccionesMatch idCompra={l.idCompra} estado={d.match.estadoUsuario} conPresentada />}
          {d.match && <BadgeDocumentacion estado={d.match.estadoDocumental} />}
          <span className="flex-1" />
          <a href={l.urlDetalle} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Ver en ARCE <ExternalLink aria-hidden />
          </a>
          <a href={l.urlOfertar} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Ofertar en línea <ExternalLink aria-hidden />
          </a>
        </div>
      </header>

      <Tabs defaultValue="resumen">
        <div className="overflow-x-auto overflow-y-hidden border-b pb-[5px]">
          <TabsList variant="line" className="h-10">
            <TabsTrigger value="resumen">Resumen IA</TabsTrigger>
            <TabsTrigger value="items">Ítems y precio</TabsTrigger>
            <TabsTrigger value="documentacion">Documentación</TabsTrigger>
            <TabsTrigger value="fechas">Fechas</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="archivos">Archivos ({d.archivos.length})</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="resumen" className="pt-4">
          <ResumenIa analisis={d.analisis} match={d.match} />
        </TabsContent>
        <TabsContent value="items" className="space-y-8 pt-4">
          <PanelPrecio precios={d.precios} items={d.items} />
          <TablaItems items={d.items} ofertables={d.match?.itemsOfertables ?? []} />
        </TabsContent>
        <TabsContent value="documentacion" className="pt-4">
          <PanelDocumentacion gap={d.match?.gapDocumental ?? []} requisitos={d.analisis?.requisitosDocumentales ?? []} diasCierre={diasCierre} />
        </TabsContent>
        <TabsContent value="fechas" className="pt-4">
          <PanelFechas detalle={d} ahora={ahora} />
        </TabsContent>
        <TabsContent value="chat" className="pt-4">
          <div data-slot="chat-pliego" className="min-h-64">
            <ChatPliego idCompra={l.idCompra} />
          </div>
        </TabsContent>
        <TabsContent value="archivos" className="pt-4">
          <ListaArchivos archivos={d.archivos} aclaraciones={d.aclaraciones} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DetalleLicitacionPage({ params }: PageProps<'/licitaciones/[id]'>) {
  return (
    <Suspense fallback={<Cargando texto="Cargando la licitación…" />}>
      <Detalle params={params} />
    </Suspense>
  );
}
