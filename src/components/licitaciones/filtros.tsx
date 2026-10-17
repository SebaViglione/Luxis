'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronsUpDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TIPOS_COMPRA } from '@/lib/types';
import { CONFIANZA_POR_DEFECTO } from './filtros-url';
import { BarraBuscando, useEstadoFiltros } from './estado-filtros';

const TIPOS = ['LA', 'LP', 'CR', 'CD', 'CE'];
const ESTADOS = [
  { value: 'nuevas', label: 'Nuevas' },
  { value: 'guardadas', label: 'Guardadas' },
  { value: 'descartadas', label: 'Descartadas' },
  { value: 'todas', label: 'Todas' },
];
const CIERRES = [
  { value: 'cualquiera', label: 'Cualquier fecha' },
  { value: '7', label: 'Próximos 7 días' },
  { value: '15', label: 'Próximos 15 días' },
  { value: '30', label: 'Próximos 30 días' },
];
const ORDENES = [
  { value: 'cierre', label: 'Cierre más próximo' },
  { value: 'confianza', label: 'Mayor confianza' },
  { value: 'monto', label: 'Mayor monto estimado' },
];

function Etiqueta({ children, id }: { children: React.ReactNode; id?: string }) {
  return <span id={id} className="text-xs font-medium text-muted-foreground">{children}</span>;
}

export function Filtros({ organismos }: { organismos: string[] }) {
  const urlReal = useSearchParams();
  const { params: sp, pendiente, aplicar: actualizar } = useEstadoFiltros();
  // Valor local SOLO mientras se arrastra; se suelta recién cuando la URL real ya tiene el valor nuevo (sin rebote).
  const [arrastre, setArrastre] = useState<number | null>(null);
  const [abierto, setAbierto] = useState(false);
  const confianzaUrl = urlReal.get('confianza');
  useEffect(() => { setArrastre(null); }, [confianzaUrl]);

  const confianza = arrastre ?? Number(sp.get('confianza') ?? CONFIANZA_POR_DEFECTO);
  const tipos = sp.get('tipo')?.split(',').filter(Boolean) ?? [];
  const organismo = sp.get('organismo') ?? '';
  const cierre = sp.get('cierre') ?? 'cualquiera';
  const estado = sp.get('estado') ?? 'nuevas';
  const orden = sp.get('orden') ?? 'cierre';
  const hayFiltros = sp.size > 0;

  return (
    <section aria-label="Filtros" aria-busy={pendiente} className="relative flex flex-wrap items-end gap-x-6 gap-y-4 rounded-md border bg-card p-4">
      <BarraBuscando activa={pendiente} />
      <div className="flex w-44 flex-col gap-2">
        <Etiqueta id="f-confianza">Confianza mínima: <span className="font-mono text-foreground">{confianza}</span></Etiqueta>
        <Slider aria-labelledby="f-confianza" min={0} max={100} step={5} value={[confianza]}
          onValueChange={(v) => setArrastre(Array.isArray(v) ? v[0] : v)}
          onValueCommitted={(v) => actualizar({ confianza: String(Array.isArray(v) ? v[0] : v) })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Etiqueta id="f-tipo">Tipo de compra</Etiqueta>
        <ToggleGroup aria-labelledby="f-tipo" multiple variant="outline" size="sm" spacing={0} value={tipos}
          onValueChange={(v) => actualizar({ tipo: v.length ? v.join(',') : null })}>
          {TIPOS.map((t) => (
            <ToggleGroupItem key={t} value={t} title={TIPOS_COMPRA[t]} aria-label={TIPOS_COMPRA[t]} className="font-mono">{t}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Etiqueta id="f-organismo">Organismo</Etiqueta>
        <Popover open={abierto} onOpenChange={setAbierto}>
          <PopoverTrigger render={<Button variant="outline" size="sm" aria-labelledby="f-organismo" className="w-56 justify-between font-normal" />}>
            <span className="truncate">{organismo || 'Todos los organismos'}</span>
            <ChevronsUpDown aria-hidden className="text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command>
              <CommandInput placeholder="Buscar organismo…" />
              <CommandList>
                <CommandEmpty>No hay organismos con ese nombre.</CommandEmpty>
                <CommandItem value="__todos" data-checked={!organismo} onSelect={() => { setAbierto(false); actualizar({ organismo: null }); }}>
                  Todos los organismos
                </CommandItem>
                {organismos.map((o) => (
                  <CommandItem key={o} value={o} data-checked={o === organismo} onSelect={() => { setAbierto(false); actualizar({ organismo: o }); }}>
                    {o}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-1.5">
        <Etiqueta id="f-cierre">Cierre</Etiqueta>
        <Select items={CIERRES} value={cierre} onValueChange={(v) => actualizar({ cierre: v && v !== 'cualquiera' ? v : null })}>
          <SelectTrigger size="sm" aria-labelledby="f-cierre" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{CIERRES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Etiqueta id="f-estado">Estado</Etiqueta>
        <ToggleGroup aria-labelledby="f-estado" variant="outline" size="sm" spacing={0} value={[estado]}
          onValueChange={(v) => actualizar({ estado: v[0] && v[0] !== 'nuevas' ? v[0] : null })}>
          {ESTADOS.map((e) => <ToggleGroupItem key={e.value} value={e.value}>{e.label}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Etiqueta id="f-orden">Ordenar por</Etiqueta>
        <Select items={ORDENES} value={orden} onValueChange={(v) => actualizar({ orden: v && v !== 'cierre' ? v : null })}>
          <SelectTrigger size="sm" aria-labelledby="f-orden" className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{ORDENES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {hayFiltros && (
        <Button variant="ghost" size="sm" onClick={() => actualizar('limpiar')}>
          <RotateCcw aria-hidden /> Limpiar filtros
        </Button>
      )}
    </section>
  );
}
