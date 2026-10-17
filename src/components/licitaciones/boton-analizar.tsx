'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BotonAnalizar({ idCompra }: { idCompra: string }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const analizar = async () => {
    setError(null);
    setTrabajando(true);
    try {
      const res = await fetch(`/api/licitaciones/${encodeURIComponent(idCompra)}/analizar`, { method: 'POST' });
      const datos = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(datos.error ?? 'No se pudo analizar el pliego.');
      iniciar(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo analizar el pliego.');
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={analizar} disabled={trabajando}>
        <FileSearch aria-hidden /> {trabajando ? 'Leyendo y analizando el pliego…' : 'Analizar el pliego ahora'}
      </Button>
      <p aria-live="polite" className="text-xs text-muted-foreground">{trabajando ? 'Puede tardar hasta un minuto.' : ''}</p>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
    </div>
  );
}
