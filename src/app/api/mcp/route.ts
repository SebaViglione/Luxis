import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { buscarLicitaciones, detalleLicitacion, precioGanador } from '@/server/mcp/herramientas';

export const maxDuration = 60;

/**
 * MCP de Luxis (Streamable HTTP, sin estado, sin autenticación: datos públicos de ARCE, solo lectura).
 * Se conecta desde claude.ai / Claude Desktop (conector personalizado), ChatGPT (modo desarrollador) o Claude Code:
 *   claude mcp add --transport http luxis https://<dominio>/api/mcp
 */
const texto = (datos: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(datos) }] });
/** Las tres herramientas solo leen: los clientes (claude.ai, Cursor…) pueden correrlas sin pedir confirmación por llamada. */
const SOLO_LECTURA = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const falla = (e: unknown) => ({ isError: true, content: [{ type: 'text' as const, text: `Error consultando Luxis: ${(e as Error).message}` }] });

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'precio_ganador',
      {
        title: 'Precio ganador histórico de un artículo',
        annotations: SOLO_LECTURA,
        description:
          'Devuelve a qué precio unitario se adjudicó un artículo en las compras del Estado uruguayo (ARCE): cantidad de adjudicaciones, '
          + 'entre qué precios estuvo la mitad de las ofertas que ganaron, precio del medio, precio sugerido para quedar en la zona ganadora, últimas adjudicaciones con ganador y organismo, y los '
          + 'proveedores que más ganan ese artículo. Busca por significado (embeddings) sobre las descripciones de ARCE: "portland", '
          + '"arena gruesa", "chapa galvanizada calibre 24", "varilla de hierro 8 mm". Precios sin IVA, agrupados por unidad.',
        inputSchema: z.object({
          articulo: z.string().min(2).max(200).describe('Descripción del artículo en texto libre, en español.'),
          moneda: z.enum(['UYU', 'USD', 'UI']).optional().describe('Moneda de las adjudicaciones a considerar. Por defecto UYU (pesos uruguayos).'),
          unidad: z.string().max(30).optional().describe('Unidad para filtrar (BOLSA, M3, KG, UNIDAD, M, TON…). Si se omite, se agrupa por unidad.'),
          meses: z.number().int().min(1).max(36).optional().describe('Ventana hacia atrás en meses. Por defecto 24.'),
        }),
      },
      async (args) => { try { return texto(await precioGanador(args)); } catch (e) { return falla(e); } },
    );

    server.registerTool(
      'buscar_licitaciones',
      {
        title: 'Buscar licitaciones abiertas',
        annotations: SOLO_LECTURA,
        description:
          'Lista licitaciones de ARCE con recepción de ofertas todavía abierta, ordenadas por cierre. Filtra por palabras (objeto, organismo, '
          + 'ítems y resumen del pliego) y por días hasta el cierre. Por defecto solo las del rubro materiales de construcción; con soloRubro=false '
          + 'busca en todas las abiertas. Cada resultado trae id, organismo, cierre, lugar de entrega, resumen hecho por IA y una muestra de ítems.',
        inputSchema: z.object({
          texto: z.string().max(200).optional().describe('Palabras a buscar, por ejemplo "balasto canelones" o "pintura".'),
          dias: z.number().int().min(1).max(120).optional().describe('Solo las que cierran dentro de estos días.'),
          soloRubro: z.boolean().optional().describe('true (por defecto) limita al rubro barraca / materiales de construcción.'),
          limite: z.number().int().min(1).max(50).optional().describe('Máximo de resultados, por defecto 15.'),
        }),
      },
      async (args) => { try { return texto(await buscarLicitaciones(args)); } catch (e) { return falla(e); } },
    );

    server.registerTool(
      'detalle_licitacion',
      {
        title: 'Detalle de una licitación',
        annotations: SOLO_LECTURA,
        description:
          'Ficha completa de una licitación ya ingestada por Luxis: datos del llamado, ítems con cantidades, lectura del pliego por IA '
          + '(resumen, qué piden, requisitos documentales como RUPE/DGI/BPS/BSE, fechas clave como visitas y consultas, condiciones, riesgos), '
          + 'precio ganador histórico por ítem con competidores (vacío si Luxis todavía no los calculó para esa licitación), y archivos del pliego. Acepta el id de compra o la URL de ARCE.',
        inputSchema: z.object({
          idCompra: z.string().min(1).max(300).describe('Id de la compra en ARCE (por ejemplo "1375519") o la URL del llamado.'),
        }),
      },
      async ({ idCompra }) => { try { return texto(await detalleLicitacion(idCompra)); } catch (e) { return falla(e); } },
    );
  },
  {
    serverInfo: { name: 'luxis', version: '0.1.0' },
    instructions:
      'Luxis analiza licitaciones públicas de Uruguay (ARCE) para barracas de materiales de construcción. Usá precio_ganador para saber a qué '
      + 'precio se adjudica un artículo y quién lo gana, buscar_licitaciones para ver qué llamados están abiertos y detalle_licitacion para leer '
      + 'uno en profundidad. Todos los precios son sin IVA y vienen de adjudicaciones publicadas; ARCE no publica ofertas perdedoras. '
      + 'Hablale al usuario como a quien atiende una barraca: "precio del medio" y "la mitad de las ofertas que ganaron estuvo entre X e Y"; no uses "mediana", "percentil", "p25" ni "p75".',
  },
);

export { handler as GET, handler as POST };
