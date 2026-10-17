'use client';

import { AlertTriangle, Check, FileText, Globe, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { PerfilEmpresa } from '@/lib/types';
import { EXTENSIONES_PERMITIDAS, MAX_ARCHIVOS, MAX_BYTES_ARCHIVO } from '@/server/onboarding/constantes';
import type { EventoExtraccion } from '@/server/onboarding/tipos';
import { extraerDesdeFuentes } from './leer-eventos';

interface PasoFuentesProps {
  web?: string;
  onVolver: () => void;
  onSinFuentes: () => void;
  onListo: (perfil: PerfilEmpresa) => void;
}

type Estado = 'editando' | 'procesando' | 'error';

const ACCEPT = EXTENSIONES_PERMITIDAS.map((e) => `.${e}`).join(',');

export function PasoFuentes({ web, onVolver, onSinFuentes, onListo }: PasoFuentesProps) {
  const [archivos, setArchivos] = useState<File[]>([]);
  const [url, setUrl] = useState(web ?? '');
  const [problemaArchivos, setProblemaArchivos] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [estado, setEstado] = useState<Estado>('editando');
  const [eventos, setEventos] = useState<EventoExtraccion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const agregar = (nuevos: FileList | null) => {
    if (!nuevos) return;
    const problemas: string[] = [];
    const validos = [...nuevos].filter((archivo) => {
      const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
      if (!(EXTENSIONES_PERMITIDAS as readonly string[]).includes(extension)) {
        problemas.push(`${archivo.name}: formato no soportado.`);
        return false;
      }
      if (archivo.size > MAX_BYTES_ARCHIVO) {
        problemas.push(`${archivo.name}: pesa más de 10 MB.`);
        return false;
      }
      return true;
    });
    const combinados = [...archivos, ...validos.filter((v) => !archivos.some((a) => a.name === v.name && a.size === v.size))];
    if (combinados.length > MAX_ARCHIVOS) problemas.push(`Podés subir hasta ${MAX_ARCHIVOS} archivos.`);
    setArchivos(combinados.slice(0, MAX_ARCHIVOS));
    setProblemaArchivos(problemas.length ? problemas.join(' ') : null);
  };

  const procesar = async () => {
    const formData = new FormData();
    archivos.forEach((a) => formData.append('archivos', a));
    if (url.trim()) formData.append('url', url.trim());

    setEstado('procesando');
    setEventos([]);
    const resultado: { perfil?: PerfilEmpresa } = {};
    await extraerDesdeFuentes(formData, (evento) => {
      setEventos((previos) => [...previos, evento]);
      if (evento.tipo === 'listo') resultado.perfil = evento.perfil;
      if (evento.tipo === 'error') setEstado('error');
    });
    if (resultado.perfil) onListo(resultado.perfil);
  };

  const hayFuentes = archivos.length > 0 || url.trim().length > 0;

  if (estado !== 'editando') {
    const pasos = eventos.filter((e) => e.tipo === 'progreso');
    const avisos = eventos.filter((e) => e.tipo === 'aviso');
    const error = eventos.find((e) => e.tipo === 'error');
    return (
      <Card>
        <CardHeader>
          <CardTitle>{error ? 'No pudimos armar el perfil' : 'Armando el perfil de tu empresa'}</CardTitle>
          <CardDescription>Puede tardar hasta un minuto si la lista de precios es larga.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm" aria-live="polite">
            {pasos.length === 0 && !error && (
              <li className="flex items-center gap-2">
                <Spinner /> Enviando archivos…
              </li>
            )}
            {pasos.map((p, i) => {
              const enCurso = i === pasos.length - 1 && estado === 'procesando';
              return (
                <li key={i} className={cn('flex items-center gap-2', !enCurso && 'text-muted-foreground')}>
                  {enCurso ? <Spinner /> : <Check className="size-4 text-foreground" aria-hidden />}
                  {'mensaje' in p && p.mensaje}
                </li>
              );
            })}
          </ul>
          {avisos.map((a, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {'mensaje' in a && a.mensaje}
            </p>
          ))}
          {error && 'mensaje' in error && (
            <Alert variant="destructive">
              <AlertTitle>Algo falló</AlertTitle>
              <AlertDescription>{error.mensaje}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        {estado === 'error' && (
          <CardFooter className="mt-6 flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setEstado('editando')}>
              Cambiar archivos
            </Button>
            <Button variant="outline" onClick={onSinFuentes}>
              Seguir con la entrevista
            </Button>
            <Button onClick={procesar}>Reintentar</Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Tenés documentos o web?</CardTitle>
        <CardDescription>
          Subí tu lista de precios, catálogo o carta de presentación y la IA arma tu perfil: productos, unidades, zonas y
          documentación. Si no tenés nada a mano, te hacemos unas preguntas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            agregar(e.dataTransfer.files);
          }}
          className={cn(
            'flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors',
            arrastrando ? 'border-primary bg-primary/5' : 'border-border',
          )}
        >
          <Upload className="size-5 text-muted-foreground" aria-hidden />
          <p className="text-sm">
            Arrastrá los archivos acá o{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              elegilos desde tu computadora
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, Word (.docx), Excel, HTML o texto · hasta {MAX_ARCHIVOS} archivos de 10 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              agregar(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {problemaArchivos && <p className="text-sm text-destructive">{problemaArchivos}</p>}

        {archivos.length > 0 && (
          <ul className="flex flex-col divide-y rounded-md border">
            {archivos.map((archivo) => (
              <li key={`${archivo.name}-${archivo.size}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{archivo.name}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{formatearTamano(archivo.size)}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar ${archivo.name}`}
                  onClick={() => setArchivos((previos) => previos.filter((a) => a !== archivo))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Field>
          <FieldLabel htmlFor="url-web">Página web de la empresa</FieldLabel>
          <div className="relative">
            <Globe className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="url-web"
              inputMode="url"
              placeholder="www.tubarraca.com.uy"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-8"
            />
          </div>
          <FieldDescription>Leemos la portada y hasta 3 páginas internas (productos, nosotros, catálogo).</FieldDescription>
        </Field>
      </CardContent>
      <CardFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onVolver}>
          Volver
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onSinFuentes}>
            No tengo documentos, prefiero responder preguntas
          </Button>
          <Button onClick={procesar} disabled={!hayFuentes}>
            Leer y armar mi perfil
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function formatearTamano(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
