'use client';

import { useState, useSyncExternalStore } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RUTA = '/api/mcp';
const sinSuscripcion = () => () => {};

/** URL pública del servidor MCP: el origen del navegador más la ruta. En el servidor todavía no se conoce. */
function useUrlMcp() {
  const origen = useSyncExternalStore(sinSuscripcion, () => window.location.origin, () => '');
  return origen ? `${origen}${RUTA}` : null;
}

function useCopiar(texto: string | null) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      // Sin permiso de portapapeles: el texto queda visible para seleccionarlo a mano.
    }
  };
  return { copiado, copiar };
}

function CajaCopiable({ texto, visible, etiqueta }: { texto: string | null; visible: string; etiqueta: string }) {
  const { copiado, copiar } = useCopiar(texto);
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background py-1.5 pr-1.5 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-sm" title={visible}>{visible}</code>
      <Button type="button" variant="outline" size="sm" onClick={copiar} disabled={!texto} aria-label={`Copiar ${etiqueta}`}>
        {copiado ? <Check className="text-exito" /> : <Copy />}
        <span aria-live="polite">{copiado ? 'Copiada' : 'Copiar'}</span>
      </Button>
    </div>
  );
}

/** Dirección del servidor MCP con botón para copiarla. */
export function UrlMcp() {
  const url = useUrlMcp();
  return <CajaCopiable texto={url} visible={url ?? RUTA} etiqueta="la dirección del servidor" />;
}

/** El comando para agregarlo en Claude Code, con la dirección real. */
export function ComandoClaudeCode() {
  const url = useUrlMcp();
  const comando = `claude mcp add --transport http luxis ${url ?? RUTA}`;
  return <CajaCopiable texto={url ? comando : null} visible={comando} etiqueta="el comando" />;
}
