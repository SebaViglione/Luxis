'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fechaHora, suavizarMayusculas } from '@/components/licitaciones/formato';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Cotizacion, DatosPagina, DatosPostulacion } from '@/server/postulacion/tipos';
import { lineasIniciales } from './cotizacion';
import { PasoCotizacion } from './paso-cotizacion';
import { PasoDocumentos } from './paso-documentos';
import { PasoPresentar } from './paso-presentar';
import { PasoRequisitos } from './paso-requisitos';

const PASOS = ['Qué piden', 'Tus precios', 'Formularios', 'Presentar'] as const;

// Las condiciones del análisis a veces son párrafos: solo las usamos de valor inicial si son cortas.
const corto = (texto: string | undefined) => (texto && texto.length <= 80 ? texto : '');

export function AsistentePostulacion({ datos }: { datos: DatosPagina }) {
  const l = datos.licitacion;
  const clave = `luxis:postulacion:${l.idCompra}`;
  const [paso, setPaso] = useState(0);
  const [datosEmpresa, setDatosEmpresa] = useState<DatosPostulacion>({
    ...datos.datosPostulacion,
    emailNotificaciones: datos.datosPostulacion.emailNotificaciones ?? datos.empresa.emailContacto,
  });
  const [cotizacion, setCotizacion] = useState<Cotizacion>(() => ({
    lineas: lineasIniciales(datos),
    plazoEntrega: corto(datos.condiciones?.plazoEntrega),
    mantenimientoOferta: corto(datos.condiciones?.mantenimientoOferta),
  }));

  // Borrador de la cotización por licitación, en este navegador.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(clave);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se restaura después de hidratar para no desfasar el HTML del servidor
      if (guardado) setCotizacion(JSON.parse(guardado) as Cotizacion);
    } catch {
      // Sin acceso a localStorage: se trabaja sin borrador.
    }
  }, [clave]);
  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(cotizacion));
    } catch {
      // idem
    }
  }, [clave, cotizacion]);

  const irA = (n: number) => {
    setPaso(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <Link href={`/licitaciones/${encodeURIComponent(l.idCompra)}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" /> Volver a la licitación
      </Link>

      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Preparar mi oferta</p>
        <h1 className="text-2xl leading-tight font-semibold text-balance">{suavizarMayusculas(l.objeto)}</h1>
        <p className="text-sm text-muted-foreground">
          {l.tipoCompraNombre} N° <span className="font-mono">{l.numero}</span> de {l.organismo} · cierra el{' '}
          <span className="font-mono">{fechaHora(l.fechaTopeOfertas)}</span>
        </p>
      </header>

      <nav aria-label="Pasos de la postulación" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PASOS.map((nombre, i) => (
          <button
            key={nombre}
            type="button"
            onClick={() => irA(i)}
            aria-current={i === paso ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2 border-t-2 pt-2 text-left text-sm transition-colors',
              i === paso ? 'border-primary font-medium text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('font-mono text-xs tabular-nums', i === paso && 'text-primary')}>{String(i + 1).padStart(2, '0')}</span>
            {nombre}
          </button>
        ))}
      </nav>

      {paso === 0 && <PasoRequisitos datos={datos} datosEmpresa={datosEmpresa} onDatosEmpresa={setDatosEmpresa} />}
      {paso === 1 && <PasoCotizacion datos={datos} cotizacion={cotizacion} onCotizacion={setCotizacion} />}
      {paso === 2 && <PasoDocumentos datos={datos} datosEmpresa={datosEmpresa} cotizacion={cotizacion} onIrA={irA} />}
      {paso === 3 && <PasoPresentar datos={datos} />}

      <div className="flex justify-between border-t pt-4">
        <Button variant="ghost" onClick={() => irA(paso - 1)} disabled={paso === 0}>
          <ArrowLeft aria-hidden /> Anterior
        </Button>
        {paso < PASOS.length - 1 && (
          <Button variant="outline" onClick={() => irA(paso + 1)}>
            {PASOS[paso + 1]} <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
