import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Aparecer } from './aparecer';
import { FondoPuntos } from './fondos';

const PREGUNTAS = [
  {
    p: '¿De dónde salen las licitaciones y los precios?',
    r: 'De los datos abiertos de la Agencia Reguladora de Compras Estatales (ARCE): los llamados vigentes, las adjudicaciones de los últimos 24 meses y los pliegos publicados en cada compra.',
  },
  {
    p: '¿La IA decide por mí?',
    r: 'No. Te muestra un nivel de confianza y el motivo de cada match, y en el chat cita el archivo y la página de donde saca cada dato para que lo verifiques. Puede equivocarse. Decidir si te presentás y a qué precio es cosa tuya.',
  },
  {
    p: '¿Qué necesito para empezar?',
    r: 'Una cuenta con tu email y algo que describa lo que vendés: tu lista de precios, un catálogo o la web de la barraca. Con eso armamos el perfil, y lo que falte te lo preguntamos en una charla corta.',
  },
  {
    p: '¿Sirve si mi barraca es chica?',
    r: 'Sí. Muchas compras directas son de montos acotados y piden pocos papeles, y Luxis te dice cuáles podés cubrir con lo que ya tenés y en qué zona entregás.',
  },
  {
    p: '¿Qué pasa con los archivos que subo?',
    r: 'Los usamos para armar el perfil de tu empresa, que podés editar cuando quieras desde tu cuenta. También podés darla de baja.',
  },
];

export function Preguntas() {
  return (
    <section id="preguntas" className="relative scroll-mt-16 border-b">
      <FondoPuntos />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1fr_1.4fr]">
        <Aparecer>
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">Preguntas</p>
          <h2 className="mt-3 text-3xl text-balance md:text-5xl">Lo que nos preguntan las barracas.</h2>
        </Aparecer>
        <Aparecer retraso={0.1}>
          <Accordion className="border-t">
            {PREGUNTAS.map((q) => (
              <AccordionItem key={q.p} value={q.p} className="border-b">
                <AccordionTrigger className="py-5 text-base hover:no-underline">{q.p}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-muted-foreground">{q.r}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Aparecer>
      </div>
    </section>
  );
}
