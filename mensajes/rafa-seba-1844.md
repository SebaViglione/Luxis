# rafa → seba · 18:44 · seguridad (RLS) + feature Postulación + confianza ajustada

Recibí tus mensajes de las 17:37, 18:09, 18:30 y 18:35. Gracias por meter la búsqueda híbrida en el chat.

## 1. URGENTE · seguridad: RLS desactivado
Con la `NEXT_PUBLIC_SUPABASE_ANON_KEY` (es pública, viaja al navegador) se pueden leer **todas** las tablas por la API REST de Supabase (`/rest/v1/empresas`, `empresa_documentos`, `matches`…): lo comprobó un agente mío con GETs. Arreglo sin tocar la app (el servidor entra con `DATABASE_URL` como `postgres` y saltea RLS):
```sql
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
```
Sin políticas = la API REST no devuelve nada. Verificalo con un GET con la anon key después.

## 2. Feature nueva: Postulación (decisión de rafa, para la demo)
Página `/licitaciones/[id]/postular` con 4 pasos: requisitos (checklist sobre tu `gapDocumental` + canal/visita/muestras/garantía/RUPE), cotización (planilla XLSX con los campos de SICE, precios desde `precioSugerido`), documentos (formulario de identificación + DJ art. 46, carta, especificación; PDF y DOCX) y presentar (link `urlOfertar` + guía de SICE + marcar presentada). Carpetas mías nuevas: `src/server/postulacion/` y `src/components/postulacion/`. Dependencia nueva: `docx` (generar Word en el navegador). No toco schema ni types: los datos extra de la empresa (domicilio, representante, CI) van en `perfil_json.datosPostulacion`.

## 3. Pedido a tu carril: confianza ajustada por postulación (decisión de rafa)
Que la dificultad para presentarse baje la confianza, **calculado al leer** (no se guarda, no se acumula):
- confianza efectiva = `confianza − ajuste`, con ajuste por `estado_documental`: **dificil 25 · alcanzable 10 · cumple/desconocido 0**. En SQL: `confianza - case estado_documental when 'dificil' then 25 when 'alcanzable' then 10 else 0 end`.
- Aplicarlo en `listarMatches` (filtro de confianza mínima y orden) y en `obtenerDetalle`; si podés, exponer el ajuste (p. ej. `match.ajusteDocumental: number`) para que la UI explique "−25 por documentación".
- Yo exporto las mismas constantes en `src/server/postulacion/preparacion.ts` (`AJUSTE_DOCUMENTAL`) para explicarlo en la página de postulación.

**Antes hay que arreglar el gap**, si no penaliza de más (hoy 0 matches "cumple", 67 "difícil"):
1. `config/plazos-documentales.ts`: el patrón de RUPE va antes que el de formularios → "Formulario de identificación… validado en RUPE" queda como RUPE "lo tenés". Formularios/declaraciones/planilla primero.
2. "Garantía de cumplimiento de contrato" (sin "fiel") cae en genérico y cuenta como faltante obligatorio.
3. Para **ofertar**: garantía de fiel cumplimiento es post-adjudicación (no debería contar) y RUPE "EN INGRESO" alcanza (o sea `en_tramite` = tiene para ofertar).
4. Formularios, declaraciones juradas, planilla de cotización y especificación → **los arma Luxis en Postulación**: `tiene=true` con nota "Lo prepara Luxis en Postulación".
5. Visita con fecha ya pasada → no alcanzable (docs/06 #18).

Si estás con la marca y preferís que lo haga yo en una branch aparte, decime y lo hago con tu OK. Avisame por acá cuando esté en main y lo verifico.

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.
