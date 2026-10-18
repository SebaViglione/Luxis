'use client';

import { useState, useSyncExternalStore } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RUTA = '/api/mcp';
const sinSuscripcion = () => () => {};

type Copiable = { etiqueta: string; texto: string; bloque?: boolean };
type Guia = { id: string; nombre: string; pasos: string[]; copiable: (url: string) => Copiable; nota?: string };

/** Una guía por cliente. Pasos cortos y lo que hay que pegar, con la dirección real ya puesta. */
const GUIAS: Guia[] = [
  {
    id: 'claude',
    nombre: 'Claude',
    pasos: ['Ajustes, Conectores, Agregar conector personalizado.', 'Nombre «Luxis», pegá la dirección, sin autenticación.', 'En el chat, activalo desde el menú de herramientas.'],
    copiable: (url) => ({ etiqueta: 'Dirección del servidor', texto: url }),
    nota: 'claude.ai y Claude Desktop. Planes Pro, Max, Team y Enterprise.',
  },
  {
    id: 'chatgpt',
    nombre: 'ChatGPT',
    pasos: ['Ajustes, Seguridad e inicio de sesión, activá Modo desarrollador.', 'Plugins, botón +, pegá la dirección, nombre «Luxis», Crear.', 'En un chat nuevo, elegilo desde el botón + y Más.'],
    copiable: (url) => ({ etiqueta: 'Dirección del servidor', texto: url }),
    nota: 'Planes Plus, Pro, Business y Enterprise.',
  },
  {
    id: 'claude-code',
    nombre: 'Claude Code',
    pasos: ['Pegá el comando en la terminal.', 'En la próxima sesión ya tenés las herramientas.'],
    copiable: (url) => ({ etiqueta: 'Comando', texto: `claude mcp add --transport http luxis ${url}` }),
  },
  {
    id: 'codex',
    nombre: 'Codex',
    pasos: ['Pegá el comando en la terminal.', 'Queda en ~/.codex/config.toml para todos tus proyectos.'],
    copiable: (url) => ({ etiqueta: 'Comando', texto: `codex mcp add luxis --url ${url}` }),
  },
  {
    id: 'cursor',
    nombre: 'Cursor',
    pasos: ['Ajustes, MCP, Add new MCP server, o editá el archivo a mano.', 'Guardá: Luxis aparece en la lista con sus tres herramientas.'],
    copiable: (url) => ({ etiqueta: '~/.cursor/mcp.json', texto: JSON.stringify({ mcpServers: { luxis: { url } } }, null, 2), bloque: true }),
  },
  {
    id: 'vscode',
    nombre: 'VS Code',
    pasos: ['Creá .vscode/mcp.json en tu proyecto con este contenido.', 'En el chat de Copilot, modo Agente, aparecen las herramientas.'],
    copiable: (url) => ({ etiqueta: '.vscode/mcp.json', texto: JSON.stringify({ servers: { luxis: { type: 'http', url } } }, null, 2), bloque: true }),
  },
  {
    id: 'gemini',
    nombre: 'Gemini CLI',
    pasos: ['Pegá el comando en la terminal.', 'Con /mcp dentro de Gemini ves las herramientas conectadas.'],
    copiable: (url) => ({ etiqueta: 'Comando', texto: `gemini mcp add --transport http luxis ${url}` }),
  },
];

/** URL pública del servidor MCP: el origen del navegador más la ruta. En el servidor todavía no se conoce. */
function useUrlMcp() {
  const origen = useSyncExternalStore(sinSuscripcion, () => window.location.origin, () => '');
  return origen ? `${origen}${RUTA}` : null;
}

function BotonCopiar({ texto, etiqueta }: { texto: string | null; etiqueta: string }) {
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
  return (
    <Button type="button" variant="outline" size="sm" onClick={copiar} disabled={!texto} aria-label={`Copiar ${etiqueta}`}>
      {copiado ? <Check className="text-exito" /> : <Copy />}
      <span aria-live="polite">{copiado ? 'Copiado' : 'Copiar'}</span>
    </Button>
  );
}

function Copiable({ c, listo }: { c: Copiable; listo: boolean }) {
  if (c.bloque) {
    return (
      <div className="relative rounded-lg border bg-background">
        <div className="flex items-center justify-between gap-2 border-b py-1.5 pr-1.5 pl-3">
          <span className="font-mono text-xs text-muted-foreground">{c.etiqueta}</span>
          <BotonCopiar texto={listo ? c.texto : null} etiqueta={c.etiqueta} />
        </div>
        <pre className="overflow-x-auto px-3 py-2.5 font-mono text-sm leading-relaxed">{c.texto}</pre>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-1.5 font-mono text-xs text-muted-foreground">{c.etiqueta}</p>
      <div className="flex items-center gap-2 rounded-lg border bg-background py-1.5 pr-1.5 pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-sm" title={c.texto}>{c.texto}</code>
        <BotonCopiar texto={listo ? c.texto : null} etiqueta={c.etiqueta} />
      </div>
    </div>
  );
}

export function GuiaMcp() {
  const url = useUrlMcp();
  const [activa, setActiva] = useState(GUIAS[0].id);
  const guia = GUIAS.find((g) => g.id === activa) ?? GUIAS[0];
  const copiable = guia.copiable(url ?? RUTA);

  return (
    <MotionConfig reducedMotion="user">
      <div className="rounded-2xl border bg-card/90 p-6 shadow-[0_40px_80px_-40px_rgba(27,27,27,0.3)] backdrop-blur-[2px] md:p-8">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Instalalo en tu cliente</p>
        <div role="tablist" aria-label="Cliente" className="mt-4 flex flex-wrap gap-1">
          {GUIAS.map((g) => {
            const on = g.id === activa;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`guia-${g.id}`}
                onClick={() => setActiva(g.id)}
                className={cn('relative rounded-full px-3.5 py-1.5 text-sm transition-colors duration-300', on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {on && <motion.span layoutId="guia-mcp-resaltado" className="absolute inset-0 rounded-full bg-secondary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{g.nombre}</span>
              </button>
            );
          })}
        </div>

        <div id={`guia-${guia.id}`} role="tabpanel" className="mt-6">
          <ol className="space-y-2.5">
            {guia.pasos.map((p, i) => (
              <li key={p} className="grid grid-cols-[2rem_1fr] gap-2 text-sm">
                <span className="font-mono text-xs leading-5 text-primary">{String(i + 1).padStart(2, '0')}</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5"><Copiable c={copiable} listo={url !== null} /></div>
          {guia.nota && <p className="mt-3 text-xs text-muted-foreground">{guia.nota}</p>}
        </div>
      </div>
    </MotionConfig>
  );
}
