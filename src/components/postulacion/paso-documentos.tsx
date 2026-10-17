'use client';

import { ChevronRight, FileDown, FileText } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  cartaPresentacion,
  especificacionOferta,
  formularioIdentificacion,
  type DocumentoPostulacion,
} from '@/server/postulacion/documentos';
import type { Cotizacion, DatosPagina, DatosPostulacion } from '@/server/postulacion/tipos';
import { descargarDocx, descargarPdf } from './exportar';
import { VistaDocumento } from './vista-documento';

interface Props {
  datos: DatosPagina;
  datosEmpresa: DatosPostulacion;
  cotizacion: Cotizacion;
  onIrA: (paso: number) => void;
}

const DESCRIPCION: Record<DocumentoPostulacion['id'], string> = {
  formulario: 'Datos de la empresa y declaración jurada (art. 46 del TOCAF, aceptación del pliego). Lo pidieron 27 de los 57 pliegos que leímos.',
  carta: 'Presentación breve de la oferta con el total cotizado, plazo de entrega y mantenimiento.',
  especificacion: 'Detalle por ítem de lo que ofrecés, con precios sin impuestos y totales. Sirve como adjunto en SICE.',
};

export function PasoDocumentos({ datos, datosEmpresa, cotizacion, onIrA }: Props) {
  const documentos = [
    formularioIdentificacion(datos, datosEmpresa),
    cartaPresentacion(datos, datosEmpresa, cotizacion),
    especificacionOferta(datos, datosEmpresa, cotizacion),
  ];
  const faltanDatos = !datosEmpresa.domicilio || !datosEmpresa.representante || !datosEmpresa.ciRepresentante;
  const sinCotizacion = !cotizacion.lineas.some((l) => l.incluir && l.precioUnitario != null);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold">Documentos listos para firmar</h2>
        <p className="text-sm text-muted-foreground">
          Los armamos con tus datos y tu cotización. Descargalos en PDF para firmar o en Word si querés retocarlos. Revisá los textos antes de
          firmar: si el pliego trae su propio modelo (por ejemplo, un anexo), ese manda.
        </p>
      </div>

      {faltanDatos && (
        <Alert>
          <AlertTitle>Faltan datos del representante o el domicilio</AlertTitle>
          <AlertDescription>Los documentos salen con líneas en blanco para completar a mano.</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => onIrA(0)}>
              Completarlos
            </Button>
          </AlertAction>
        </Alert>
      )}
      {sinCotizacion && (
        <Alert>
          <AlertTitle>Todavía no cargaste precios</AlertTitle>
          <AlertDescription>La carta y la especificación toman los ítems y totales de tu cotización.</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => onIrA(1)}>
              Ir a la cotización
            </Button>
          </AlertAction>
        </Alert>
      )}

      {documentos.map((doc) => (
        <TarjetaDocumento key={doc.id} documento={doc} />
      ))}

      <p className="text-xs text-muted-foreground">
        Para firmar: firmá el PDF digitalmente (Abitab ID, cédula con chip) o imprimilo, firmalo y escanealo. SICE acepta PDF, Word y Excel de
        hasta 100 MB.
      </p>
    </div>
  );
}

function TarjetaDocumento({ documento }: { documento: DocumentoPostulacion }) {
  const [descargando, setDescargando] = useState<'pdf' | 'word' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const descargarComo = async (formato: 'pdf' | 'word') => {
    setDescargando(formato);
    setError(null);
    try {
      await (formato === 'pdf' ? descargarPdf(documento) : descargarDocx(documento));
    } catch (e) {
      console.error(e);
      setError(`No pudimos generar el ${formato === 'pdf' ? 'PDF' : 'Word'}. Probá de nuevo.`);
    } finally {
      setDescargando(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText aria-hidden className="size-4 text-muted-foreground" />
          {documento.titulo}
        </CardTitle>
        <CardDescription>{DESCRIPCION[documento.id]}</CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => descargarComo('pdf')} disabled={descargando !== null}>
            {descargando === 'pdf' ? <Spinner /> : <FileDown aria-hidden />} PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => descargarComo('word')} disabled={descargando !== null}>
            {descargando === 'word' ? <Spinner /> : <FileDown aria-hidden />} Word
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-2 text-sm text-error">{error}</p>}
        <details className="group rounded-md border">
          <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-sm text-muted-foreground select-none">
            <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" />
            Vista previa
          </summary>
          <div className="border-t p-4 sm:p-8">
            <VistaDocumento documento={documento} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
