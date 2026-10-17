import { db } from '@/db';
import { empresaArchivos } from '@/db/schema';
import { obtenerSesion } from '@/server/auth/sesion';
import { extraerPerfil, type FuenteTexto } from '@/server/ia/perfil';
import { EXTENSIONES_PERMITIDAS, MAX_ARCHIVOS, MAX_BYTES_ARCHIVO } from '@/server/onboarding/constantes';
import type { EventoExtraccion } from '@/server/onboarding/tipos';
import { extensionDe, extraerTexto } from '@/server/onboarding/extraer-texto';
import { fetchWeb, normalizarUrl, WebNoDisponibleError } from '@/server/onboarding/fetch-web';
import { guardarPerfil, leerPerfil } from '@/server/onboarding/guardar-perfil';
import { fusionarPerfil } from '@/server/onboarding/perfil';

export const maxDuration = 120;

/**
 * POST multipart: `archivos` (0–5), `url` (opcional) y/o `texto` (transcript de la entrevista por voz).
 * Responde un stream NDJSON de EventoExtraccion con el progreso real y el perfil parcial al final.
 */
export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return Response.json({ error: 'Tu sesión venció. Ingresá de nuevo.' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'No pudimos leer lo que mandaste. Probá de nuevo.' }, { status: 400 });
  }

  const archivos = formData.getAll('archivos').filter((a): a is File => a instanceof File && a.size > 0);
  const url = String(formData.get('url') ?? '').trim();
  const texto = String(formData.get('texto') ?? '').trim();

  const invalido = validar(archivos, url, texto);
  if (invalido) return Response.json({ error: invalido }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enviar = (evento: EventoExtraccion) => controller.enqueue(encoder.encode(`${JSON.stringify(evento)}\n`));
      try {
        const fuentes: FuenteTexto[] = [];

        for (const archivo of archivos) {
          enviar({ tipo: 'progreso', mensaje: `Leyendo ${archivo.name}…` });
          try {
            const extraido = await extraerTexto(archivo.name, Buffer.from(await archivo.arrayBuffer()));
            if (!extraido.texto) {
              enviar({ tipo: 'aviso', mensaje: `${archivo.name} no tiene texto legible (¿es un escaneo?). Lo salteamos.` });
              continue;
            }
            fuentes.push({ fuente: archivo.name, texto: extraido.texto });
            await db.insert(empresaArchivos).values({
              empresaId: sesion.empresaId,
              nombre: archivo.name,
              mime: archivo.type || null,
              tamano: archivo.size,
              textoExtraido: extraido.texto,
            });
          } catch (error) {
            console.error(`[extraer] ${archivo.name}`, error);
            enviar({ tipo: 'aviso', mensaje: `No pudimos leer ${archivo.name}. Lo salteamos.` });
          }
        }

        if (url) {
          enviar({ tipo: 'progreso', mensaje: 'Leyendo tu página web…' });
          try {
            const paginas = await fetchWeb(url);
            paginas.forEach((p) => fuentes.push({ fuente: p.url, texto: p.texto }));
            if (paginas.length === 0) enviar({ tipo: 'aviso', mensaje: 'Tu web no tiene texto que podamos leer.' });
          } catch (error) {
            const mensaje = error instanceof WebNoDisponibleError ? error.message : 'No pudimos abrir tu web.';
            enviar({ tipo: 'aviso', mensaje: `${mensaje} Seguimos con lo demás.` });
          }
        }

        if (texto) fuentes.push({ fuente: 'Entrevista por voz', texto });

        if (fuentes.length === 0) {
          enviar({ tipo: 'error', mensaje: 'No pudimos leer ninguna de las fuentes. Probá con otros archivos o seguí con la entrevista.' });
          return;
        }

        enviar({ tipo: 'progreso', mensaje: 'Extrayendo productos y documentación con IA…' });
        const base = await leerPerfil(sesion.empresaId);
        const soloTranscript = archivos.length === 0 && !url;
        const { perfil: nuevo, faltantes } = await extraerPerfil(fuentes, base, soloTranscript ? 'entrevista' : 'documento');
        const perfil = fusionarPerfil(base, nuevo, faltantes);

        enviar({ tipo: 'progreso', mensaje: 'Guardando tu perfil…' });
        await guardarPerfil(sesion.empresaId, perfil, { completo: false });
        enviar({ tipo: 'listo', perfil });
      } catch (error) {
        console.error('[extraer]', error);
        enviar({ tipo: 'error', mensaje: 'La IA no pudo armar el perfil esta vez. Probá de nuevo en unos segundos.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function validar(archivos: File[], url: string, texto: string): string | null {
  if (archivos.length === 0 && !url && !texto) return 'Subí al menos un archivo o pegá la dirección de tu web.';
  if (archivos.length > MAX_ARCHIVOS) return `Podés subir hasta ${MAX_ARCHIVOS} archivos.`;
  for (const archivo of archivos) {
    if (archivo.size > MAX_BYTES_ARCHIVO) return `${archivo.name} pesa más de 10 MB.`;
    if (!(EXTENSIONES_PERMITIDAS as readonly string[]).includes(extensionDe(archivo.name))) {
      return `${archivo.name}: formato no soportado. Usá PDF, Word (.docx), Excel, HTML o texto.`;
    }
  }
  if (url) {
    try {
      normalizarUrl(url);
    } catch {
      return 'La dirección web no es válida.';
    }
  }
  if (texto.length > 200_000) return 'El texto es demasiado largo.';
  return null;
}
