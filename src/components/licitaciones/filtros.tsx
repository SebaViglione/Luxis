'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, ChevronsUpDown, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CONFIANZA_POR_DEFECTO } from './filtros-url';
import { BarraBuscando, useEstadoFiltros } from './estado-filtros';
import { Segmentado, type OpcionSegmentada } from './segmentado';

/** Tipos de compra en lenguaje llano: qué son y qué esperar de cada uno. */
const TIPOS: { valor: string; nombre: string; ayuda: string }[] = [
  { valor: 'CD', nombre: 'Compra directa', ayuda: 'Montos chicos, pocos papeles y cierre rápido.' },
  { valor: 'CR', nombre: 'Concurso de precios', ayuda: 'Montos chicos o medianos: gana el mejor precio.' },
  { valor: 'LA', nombre: 'Licitación abreviada', ayuda: 'Montos medianos, con pliego y algo más de papeles.' },
  { valor: 'LP', nombre: 'Licitación pública', ayuda: 'Las más grandes: más requisitos y plazos más largos.' },
  { valor: 'CE', nombre: 'Compra por excepción', ayuda: 'Casos especiales o urgentes.' },
];

const MOSTRAR: OpcionSegmentada<string>[] = [
  { valor: 'nuevas', texto: 'Para revisar', ayuda: 'Todas menos las que marcaste como "No me interesa"' },
  { valor: 'guardadas', texto: 'Guardadas', ayuda: 'Las que guardaste o marcaste como presentadas' },
  { valor: 'descartadas', texto: 'No me interesan' },
  { valor: 'todas', texto: 'Todas' },
];

/** Mismos cortes que nivelConfianza: media ≥ 50, alta ≥ 75. */
const CALCE: OpcionSegmentada<string>[] = [
  { valor: '40', texto: 'Todas', ayuda: 'Incluye las que te calzan poco' },
  { valor: '50', texto: 'Buenas y muy buenas', ayuda: 'Puntaje 50 o más' },
  { valor: '75', texto: 'Solo muy buenas', ayuda: 'Puntaje 75 o más' },
];

const CIERRE: OpcionSegmentada<string>[] = [
  { valor: 'cualquiera', texto: 'Cuando sea' },
  { valor: '7', texto: 'Esta semana', ayuda: 'Cierran en los próximos 7 días' },
  { valor: '15', texto: '2 semanas', ayuda: 'Cierran en los próximos 15 días' },
  { valor: '30', texto: 'Este mes', ayuda: 'Cierran en los próximos 30 días' },
];

const ORDENES = [
  { value: 'cierre', label: 'Las que cierran antes' },
  { value: 'confianza', label: 'Las que mejor te calzan' },
  { value: 'monto', label: 'Las de mayor monto' },
];

/** Lleva cualquier valor viejo de la URL (p. ej. 60 del slider) al corte más cercano por debajo. */
const corteCalce = (v: number) => (v >= 75 ? '75' : v >= 50 ? '50' : '40');

function Pregunta({ children, id }: { children: React.ReactNode; id?: string }) {
  return <span id={id} className="text-sm font-medium text-foreground">{children}</span>;
}

export function Filtros({ organismos }: { organismos: string[] }) {
  const { params: sp, pendiente, aplicar } = useEstadoFiltros();
  const [abiertoOrganismo, setAbiertoOrganismo] = useState(false);

  const calce = corteCalce(Number(sp.get('confianza') ?? CONFIANZA_POR_DEFECTO));
  const tipos = sp.get('tipo')?.split(',').filter(Boolean) ?? [];
  const organismo = sp.get('organismo') ?? '';
  const cierre = sp.get('cierre') ?? 'cualquiera';
  const estado = sp.get('estado') ?? 'nuevas';
  const orden = sp.get('orden') ?? 'cierre';
  const [masAbierto, setMasAbierto] = useState(tipos.length > 0 || organismo !== '');
  const extras = tipos.length + (organismo ? 1 : 0);

  const alternarTipo = (t: string) => {
    const nuevos = tipos.includes(t) ? tipos.filter((x) => x !== t) : [...tipos, t];
    aplicar({ tipo: nuevos.length ? nuevos.join(',') : null });
  };

  // Pastillas de lo que está aplicado (lo que no es el valor por defecto), cada una se saca con ✕.
  const activos: { clave: string; texto: string; quitar: () => void }[] = [
    ...(calce !== '40' ? [{ clave: 'calce', texto: CALCE.find((c) => c.valor === calce)!.texto, quitar: () => aplicar({ confianza: null }) }] : []),
    ...(cierre !== 'cualquiera' ? [{ clave: 'cierre', texto: `Cierran ${CIERRE.find((c) => c.valor === cierre)?.texto.toLowerCase() ?? ''}`, quitar: () => aplicar({ cierre: null }) }] : []),
    ...tipos.map((t) => ({ clave: `tipo-${t}`, texto: TIPOS.find((x) => x.valor === t)?.nombre ?? t, quitar: () => alternarTipo(t) })),
    ...(organismo ? [{ clave: 'org', texto: organismo, quitar: () => aplicar({ organismo: null }) }] : []),
  ];

  return (
    <section aria-label="Filtros" aria-busy={pendiente} className="relative space-y-4 rounded-md border bg-card p-4 sm:p-5">
      <BarraBuscando activa={pendiente} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmentado id="mostrar" etiqueta="Qué licitaciones mostrar" opciones={MOSTRAR} valor={estado}
          onCambio={(v) => aplicar({ estado: v !== 'nuevas' ? v : null })} />
        <div className="flex items-center gap-2">
          <span id="f-orden" className="text-sm text-muted-foreground">Ordenar por</span>
          <Select items={ORDENES} value={orden} onValueChange={(v) => aplicar({ orden: v && v !== 'cierre' ? v : null })}>
            <SelectTrigger size="sm" aria-labelledby="f-orden" className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>{ORDENES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Pregunta>¿Qué tan bien te calzan?</Pregunta>
          <Segmentado id="calce" etiqueta="Qué tan bien te calzan" opciones={CALCE} valor={calce}
            onCambio={(v) => aplicar({ confianza: v !== '40' ? v : null })} />
        </div>
        <div className="flex flex-col gap-2">
          <Pregunta>¿Cuándo cierran?</Pregunta>
          <Segmentado id="cierre" etiqueta="Cuándo cierran" opciones={CIERRE} valor={cierre}
            onCambio={(v) => aplicar({ cierre: v !== 'cualquiera' ? v : null })} />
        </div>
      </div>

      <div>
        <Button variant="ghost" size="sm" onClick={() => setMasAbierto((a) => !a)} aria-expanded={masAbierto} className="-ml-2">
          <SlidersHorizontal aria-hidden /> Tipo de compra y quién compra
          {extras > 0 && <span className="rounded-full bg-secondary px-1.5 font-mono text-xs">{extras}</span>}
          <ChevronDown aria-hidden className={cn('transition-transform duration-200', masAbierto && 'rotate-180')} />
        </Button>
        <AnimatePresence initial={false}>
          {masAbierto && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
            >
              <div className="grid gap-4 pt-3 lg:grid-cols-[1fr_18rem]">
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2"><Pregunta>¿Qué tipo de compra?</Pregunta> <span className="text-sm text-muted-foreground">Podés elegir varios.</span></legend>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {TIPOS.map((t) => {
                      const activo = tipos.includes(t.valor);
                      return (
                        <button key={t.valor} type="button" role="checkbox" aria-checked={activo} onClick={() => alternarTipo(t.valor)}
                          className={cn('flex items-start gap-2.5 rounded-md border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            activo ? 'border-foreground/40 bg-secondary' : 'bg-background hover:bg-secondary/60')}>
                          <span aria-hidden className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors', activo && 'border-primary bg-primary text-primary-foreground')}>
                            {activo && <Check className="size-3" />}
                          </span>
                          <span className="space-y-0.5">
                            <span className="block text-sm font-medium">{t.nombre}</span>
                            <span className="block text-xs text-muted-foreground">{t.ayuda}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="flex flex-col gap-2">
                  <Pregunta id="f-organismo">¿Quién compra?</Pregunta>
                  <Popover open={abiertoOrganismo} onOpenChange={setAbiertoOrganismo}>
                    <PopoverTrigger render={<Button variant="outline" aria-labelledby="f-organismo" className="w-full justify-between font-normal" />}>
                      <span className="truncate">{organismo || 'Cualquier organismo del Estado'}</span>
                      <ChevronsUpDown aria-hidden className="text-muted-foreground" />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Buscar: Intendencia, ANEP, OSE…" />
                        <CommandList>
                          <CommandEmpty>No hay organismos con ese nombre.</CommandEmpty>
                          <CommandItem value="__todos" data-checked={!organismo} onSelect={() => { setAbiertoOrganismo(false); aplicar({ organismo: null }); }}>
                            Cualquier organismo del Estado
                          </CommandItem>
                          {organismos.map((o) => (
                            <CommandItem key={o} value={o} data-checked={o === organismo} onSelect={() => { setAbiertoOrganismo(false); aplicar({ organismo: o }); }}>
                              {o}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Intendencias, ministerios, entes y empresas públicas que tienen licitaciones para vos.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-sm text-muted-foreground">Filtrando por:</span>
          <AnimatePresence initial={false} mode="popLayout">
            {activos.map((a) => (
              <motion.button key={a.clave} type="button" layout onClick={a.quitar}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="inline-flex max-w-64 items-center gap-1 rounded-full border bg-background py-0.5 pr-1.5 pl-2.5 text-sm hover:bg-secondary"
                aria-label={`Quitar filtro ${a.texto}`}>
                <span className="truncate">{a.texto}</span><X aria-hidden className="size-3.5 text-muted-foreground" />
              </motion.button>
            ))}
          </AnimatePresence>
          <Button variant="link" size="sm" onClick={() => aplicar('limpiar')} className="h-auto px-1">Limpiar todo</Button>
        </div>
      )}
    </section>
  );
}
