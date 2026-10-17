# Datos de ARCE: fuentes verificadas, campos, ingesta y filtro de rubro

> Fuente de verdad para todo lo que toque datos de licitaciones. Verificado el 17/10/2026 contra el portal en vivo. Si algo no coincide con el portal, gana el portal y se actualiza este doc.

## 1. Fuentes, en orden de uso

| # | Fuente | Para qué | Auth | Formato |
|---|---|---|---|---|
| 1 | **Interfaz XML de consulta de publicaciones** (`generarReporte`) | Carga masiva de llamados vigentes (con ítems) y de adjudicaciones (con ganador, precio, oferentes) | No | XML ISO-8859-1 |
| 2 | **Página de detalle del llamado** (HTML) | Completar ítems/adjuntos cuando el XML viene incompleto; "Analizar por URL" (el jurado pega cualquier licitación) | No | HTML |
| 3 | **Archivos de pliegos** (`/Pliegos/...`) | Texto del pliego para resumen, requisitos, fechas y chat | No | pdf, doc, docx, xls(x), zip, rar |
| 4 | Codigueras XML | Nombres de organismos, tipos de compra, monedas, estados | No | XML ISO-8859-1 |
| 5 | RSS de búsqueda | Solo como verificación manual; tope de 1000 ítems | No | RSS |
| 6 | OCDS / datos abiertos (fallback) | Si la interfaz XML cae: `http://www.comprasestatales.gub.uy/ocds/rss` (últimas 500), `/ocds/release/{id}`, espejo `https://data.open-contracting.org/en/publication/43/download?name=full.jsonl.gz` (2017→hoy, 189 MB) | No | JSON |
| 7 | Catálogo de artículos (fallback para familias) | `http://www.comprasestatales.gub.uy/datos_abiertos/imp_catalogo.tgz` (SQL inserts latin1; familia 2 = "MATERIALES Y SUMINISTROS") | No | SQL |

## 2. Interfaz XML (`generarReporte`)

**URL (GET):** `https://www.comprasestatales.gub.uy/comprasenlinea/jboss/generarReporte`

| Parámetro | Valores | Nota |
|---|---|---|
| `tipo_publicacion` | `lv` llamados vigentes · `l` todos los llamados · `a` adjudicaciones | obligatorio |
| `tipo_compra` | código de 2 letras (`LA`, `LP`, `CD`, `CR`, `CE`, …) | opcional; vacío = todas |
| `anio_inicial, mes_inicial, dia_inicial, hora_inicial` | `NNNN, NN, NN, HH` | obligatorios |
| `anio_final, mes_final, dia_final, hora_final` | ídem | **ventana máxima 10 días** |

- Para `lv`/`l` el rango filtra por **fecha de publicación o última modificación** del llamado. Para `a`, por **fecha de publicación de la adjudicación**.
- Ejemplo vigentes (4 días): `...generarReporte?tipo_publicacion=lv&anio_inicial=2026&mes_inicial=10&dia_inicial=14&hora_inicial=00&anio_final=2026&mes_final=10&dia_final=17&hora_final=23` → HTTP 200, 1,5 MB, 445 compras, 2.419 ítems, 413 con pliego, en 3,7 s.
- Ejemplo adjudicaciones (3 días, fin de semana largo): `tipo_publicacion=a` 10→12/10/2026 → 49 KB, 16 compras, 70 adjudicaciones, 22 oferentes, 1,4 s.
- La respuesta empieza con `<?xml version="1.0" encoding="ISO-8859-1"?>` y un DOCTYPE. **Decodificar como ISO-8859-1** (`new TextDecoder('iso-8859-1').decode(await res.arrayBuffer())`), nunca como UTF-8.
- Parsear con `fast-xml-parser` (`ignoreAttributes: false`, `attributeNamePrefix: ''`). Todo viene en **atributos**.

### Estructura
```
reporte
├─ reporte_cabezal @fecha_generado @cant_compras
└─ reporte_dato
   └─ compra* (@id_compra @id_inciso @id_ue @id_ucc @id_tipocompra @subtipo_compra @num_compra @anio_compra
   │          @nro_ampliacion @estado_compra @objeto @nombre_pliego @fecha_publicacion @fecha_ult_mod_llamado
   │          @fecha_hora_apertura @lugar_apertura @fecha_sol_prorr @fecha_sol_aclar @fecha_hora_tope_entrega
   │          @lugar_entrega @precio_pliego @id_moneda_pliego @lugar_compra_pliego @nombre_contacto @fax_contacto
   │          @email_contacto @fecha_pub_adj @fecha_compra @fondos_rotatorios @apel @arch_adj @monto_adj
   │          @id_moneda_monto_adj @id_tipo_resol @num_resol @es_reiteracion @arch_reiteracion)
      ├─ items/item* (@nro_item @cant_pedida @id_articulo @desc_articulo @id_unidad @unidad @id_moneda_cotiz
      │              @variante @presentacion @medida_presentacion @id_marca @desc_marca …)
      │   └─ atributos_item/atributo_item* (@desc_prop_atributo @valor_texto @valor_numerico @requerido …)
      ├─ aclaraciones_lla/aclaracion* (@texto @fecha @nom_archivo)
      ├─ hist_mod_llamado/mod_llamado* (@fecha @campo @valor_anterior @valor_nuevo)
      ├─ oferentes/oferente* (@tipo_doc_prov @nro_doc_prov @nombre_comercial)        ← solo en adjudicaciones
      ├─ adjudicaciones/adjudicacion* (@nro_item @tipo_doc_prov @nro_doc_prov @nombre_comercial @cant_adj
      │              @precio_unit @precio_tot_imp @id_moneda @id_articulo @desc_articulo @id_unidad @unidad …)
      └─ aclaraciones_adj/aclaracion*
```

Ejemplo real de adjudicación (17/10/2026): `nombre_comercial="BARRACA LIMA SAS" cant_adj="10.00" precio_unit="803.2800" precio_tot_imp="9800.02" id_moneda="0" id_articulo="0" desc_articulo="CHAPA GALV ACANALADA CAL24 1,08X1,83M" unidad="UNIDAD"`.

### Detalles que muerden
- `id_compra` puede ser numérico (`1378793`) o con prefijo (`i503494`, `a133289`). Guardarlo como **texto**.
- **Fechas** en `DD/MM/YYYY HH:MM` (o `DD/MM/YYYY HH:MM:SS`), hora local de Montevideo. Guardar como `timestamptz` con zona `America/Montevideo`. Hay fechas basura (años 2203, 2205): descartar si > hoy + 3 años.
- **Precios sin IVA** (`precio_unit`). El IVA depende del artículo (22 %, 10 % o exento). Mostrar siempre "sin IVA".
- `id_articulo="0"` = ítem sin código de catálogo (texto libre). Muy común en Compras Directas. Normalizar `desc_articulo` (sin tildes, mayúsculas, espacios colapsados) para agrupar precios.
- Un llamado puede aparecer en varias ventanas (modificaciones): **upsert por `id_compra`**.
- `nombre_pliego` → `https://www.comprasestatales.gub.uy/Pliegos/{nombre_pliego}` (`pliego_1378949.pdf`, `pliego_i503494.pdf`, `pedido_1378696.pdf`, `pliego_802903.zip`, también `.rar`, `.doc`, `.docx`). `arch_adj` → `/Resoluciones/{arch_adj}`. Aclaraciones `nom_archivo` → `/Aclaraciones/{nom_archivo}`.
- Estados: `4` EN TRÁMITE (PUBLICADA) · `5` EN TRÁMITE (ESTUDIO) · `7` ADJUDICADA · `11` EN TRÁMITE (OFERTAS PREPARADAS) · `17` ADJUDICADA (CON AMPLIACIÓN) · `19` LLAMADO ANULADO · `27` ADJUDICADA (CON RENOVACIÓN).
- Tipos de compra (4 días de vigentes): `CD` Compra Directa 235 · `LA` Licitación Abreviada 104 · `CR` Concurso de Precios 56 · `LP` Licitación Pública 26 · `CE` Compra por Excepción 17 · otros (`CM` Convenio Marco, `PR` Pregón, `PE`, `VA`, `VL`…). La `CD` suele publicarse ya adjudicada (sin llamado abierto).
- Monedas (`id_moneda`): `0` PESOS URUGUAYOS · `1` DÓLAR PIZARRA VENDEDOR (dado de baja 2025) · `2` DÓLAR INTERBANCARIO VENDEDOR · `4` UNIDAD INDEXADA · `5` UNIDAD REAJUSTABLE. Agrupar precios **por moneda**, no convertir (hoy).
- El portal es lento a veces (3–10 s por ventana) y puede devolver 5xx: reintentar 3 veces con espera creciente; `timeout` 90 s.

## 3. Codigueras (XML, ISO-8859-1, sin parámetros)

Base `https://www.comprasestatales.gub.uy/comprasenlinea/jboss/`: `reporteTiposCompra.do` (`<tipo-compra id="LA" descripcion="Licitación Abreviada" …/>`), `reporteSubTiposCompra.do`, `reporteEstadosCompra.do`, `reporteMonedas.do`, `reporteIncisos.do` (`<inciso id-inciso="1" nom-inciso="Poder Legislativo"/>`), `reporteUnidadesEjecutoras.do`, `reporteUnidadesMedida.do`, `reporteTiposResolucion.do`. Cargarlas una vez a tablas `cod_*` o a un JSON en `src/config/`.

## 4. Página de detalle (scraping con `fetch` + `cheerio`)

- URL: `https://www.comprasestatales.gub.uy/consultas/detalle/mostrar-llamado/1/id/{id_compra}` (también responde `/consultas/detalle/id/{id}`). Oferta en línea: `/sice/login/{id}`.
- Headers obligatorios: `User-Agent` de navegador real **sin ninguna URL adentro** (el WAF bloquea UAs con URL), `Referer: https://www.comprasestatales.gub.uy/consultas`, `Accept-Language: es-UY,es;q=0.9`.
- Qué extraer: organismo y unidad ejecutora, tipo y número, objeto, fechas (publicación, recepción de ofertas/apertura, prórrogas hasta, aclaraciones hasta, visita si aparece), lugar de apertura y de entrega, precio del pliego, contacto, **ítems** (nro, descripción, código de artículo, cantidad, unidad, características), **archivos adjuntos** (pliego, anexos, aclaraciones) y **aclaraciones** (fecha, texto, link).
- Pistas de selectores a **verificar contra el HTML real** antes de confiar: adjuntos en `ul.buy-detail-list a[href]`; ítems en `.row.item .desc-item h3` (solo título; cantidad/unidad en nodos hermanos); aclaraciones en `.aclaration-container tr`. Si cambian, buscar por texto de etiquetas ("Ítem", "Recepción de ofertas hasta", "Archivos adjuntos").
- Caso especial: algunos organismos (Intendencia de Montevideo) publican como "pliego" un `.html` de 263 bytes con un link a su propia web (Lotus Notes, ISO-8859-1 sin meta charset) donde están los PDF reales. Si el adjunto es `.html` y pesa < 2 KB, seguir el link y tomar los `.pdf` que linkea (máx. 10).
- Fechas en el listado tipo "15/12/2205": descartar.

## 5. Archivos de pliego

- Descargar con los mismos headers; límite 40 MB; 2 reintentos. Tipos: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.odt`, `.rtf`, `.zip`, `.rar`, `.html`.
- Extracción (pure JS, corre en Vercel): PDF → `unpdf`; DOCX → `mammoth`; DOC → `word-extractor`; XLS/XLSX → `xlsx` (celdas a texto por hoja); ZIP → `adm-zip` (recursivo, 2 niveles); **RAR → `node-unrar-js`** (WASM, sin contraseña); HTML → `cheerio` texto visible. Si el texto resultante tiene < 200 caracteres y es PDF → marcar `no_soportado` ("probablemente escaneado"). `.7z`, `.dwg`, imágenes → `no_soportado`.
- **Quedarse con lo importante** (clasificación por nombre y primeras 1.500 letras):
  | categoría | pistas en el nombre | ¿va al LLM? |
  |---|---|---|
  | `pliego_particular` | `particular`, `pcp`, `pliego`, `bases`, `condiciones`, `pedido_` | sí, primero |
  | `memoria` | `memoria`, `especificac`, `tecnic` | sí |
  | `aclaracion` | `aclarac`, `consulta`, `respuesta` | sí |
  | `formulario` | `anexo`, `formulario`, `form`, `declaraci`, `identificaci` | sí (solo nombres y campos) |
  | `planilla` | `planilla`, `cotiz`, `.xls` | sí (resumen de columnas) |
  | `pliego_general` | `general`, `pcg`, `unico`, `decreto` | no (es estándar); solo si no hay particular |
  | `plano` | `plano`, `.dwg`, `.dxf`, `.jpg`, `.png` | no |
  | `otro` | resto | no, salvo que sea el único |
  Presupuesto al LLM: máx. 350.000 caracteres por licitación, en el orden de la tabla.

## 6. Estrategia de ingesta

1. **Backfill vigentes**: desde hoy−60 días hasta hoy, ventanas de 10 días con `tipo_publicacion=lv`. Upsert `licitaciones` + `licitacion_items` + `licitacion_aclaraciones`. Marcar `es_rubro` si algún ítem o el objeto matchea el filtro de rubro. Solo descargar y extraer pliegos de las `es_rubro = true`.
2. **Backfill adjudicaciones**: desde 2024-01-01 hasta hoy, ventanas de 10 días con `tipo_publicacion=a` (~100 requests). Guardar en `adjudicaciones` **solo las filas del rubro** (match por `desc_articulo`) y en `oferentes` todos los oferentes de esas compras. Es el histórico de precios y de competencia.
3. **Refresh** (`POST /api/ingesta/refresh?dias=2`): últimas 48 h de `lv` y de `a`; después recalcular matches de todas las empresas y generar notificaciones. Lo dispara un cron diario de Vercel y el botón "Actualizar".
4. Registrar cada corrida en `ingesta_corridas` (tipo, rango, cantidades, duración, error).
5. Correr el backfill desde la máquina de seba o en una sandbox de Tenki (`npm run ingest:vigentes` y `npm run ingest:adjudicaciones -- --desde 2024-01-01`) apuntando a la DB compartida. Tiempo estimado: vigentes 1–2 min; adjudicaciones 10–20 min (correr en segundo plano).

## 7. Filtro de rubro (lista inicial; maxi la valida y la entrega en `src/config/rubro-barraca.ts`)

Coincidencia por **palabra completa**, sin tildes, en mayúsculas, sobre `desc_articulo` y `objeto`.

**Incluir:** PORTLAND · CEMENTO · CAL (sola, no "CALIDAD"/"CALLE") · CAL HIDRATADA · ARENA · ARENA FINA · ARENA TERCIADA · ARENA GRUESA · PEDREGULLO · BALASTO · TOSCA · PIEDRA PARTIDA · GRAVILLA · LADRILLO · LADRILLOS · TICHOLO · TICHOLOS · BLOQUE · BLOQUES · HORMIGON · PREMEZCLADO · HIERRO (ver exclusiones) · VARILLA · VARILLAS · MALLA ELECTROSOLDADA · MALLA · ALAMBRE · CLAVO · CLAVOS · TORNILLO · CHAPA · CHAPAS · CHAPA GALVANIZADA · ZINC · CAÑO PVC · CAÑO · CAÑOS · TUBO PVC · PERFIL · PERFILES · VIGA · VIGAS · TIRANTE · TIRANTES · TABLA · TABLAS · MADERA · COMPENSADO · FENOLICO · YESO · PLACA DE YESO · DURLOCK · MEMBRANA · IMPERMEABILIZANTE · AISLANTE · LANA DE VIDRIO · ISODEC · TEJA · TEJAS · BALDOSA · BALDOSAS · CERAMICA · CERAMICAS · PORCELANATO · REVESTIMIENTO · ADHESIVO · PASTINA · PINTURA · CORDON · CORDONES · CAÑERIA · ABERTURA · ABERTURAS · PUERTA · VENTANA · MATERIALES DE CONSTRUCCION · MATERIAL DE CONSTRUCCION · ARTICULOS DE FERRETERIA · FERRETERIA · CONSTRUCCION (solo en `objeto`).

**Excluir** (si aparece en la misma descripción, no cuenta): SALES DE HIERRO · HIERRO (III) · HIERRO (II) · CARBOXIMALTOSA · POLIMALTOSADO · ACIDO FOLICO · AGAR · SULFATO · COMPRIMIDO · INYECTABLE · GOTAS · JARABE · CEMENTO QUIRURGICO · CEMENTO DENTAL · CEMENTO OSEO · IONOMERO · ODONTOL · ARENA PARA GATOS · PIEDRA SANITARIA · PLEGADORA · MAQUINA · EQUIPO · REPUESTO · SERVICIO DE · MANO DE OBRA · ALQUILER · ARRENDAMIENTO · CONSULTORIA · OBRA LLAVE EN MANO · CONSTRUCCION DE (en `objeto`, cuando no hay ítems de materiales).

Regla: una licitación es **del rubro** si ≥ 1 ítem matchea incluir y no excluir, o si `objeto` matchea incluir y no excluir. El LLM después decide relevancia fina por empresa.

## 8. Volúmenes medidos (17/10/2026)

| Medición | Valor |
|---|---|
| Llamados vigentes publicados/modificados en 4 días | 445 (2.419 ítems, 413 con pliego) |
| Ítems del rubro en esos 4 días | ~15 (CEMENTO PORTLAND ×2, ARENA TERCIADA ×2, VARILLA DE HIERRO ×2, CAÑO DE HIERRO ×2, PEDREGULLO, LADRILLO DE CAMPO, ARENA FINA, CHAPA DE COMPENSADO, CEMENTO ADHESIVO ×3) |
| Adjudicaciones en 3 días (feriado) | 16 compras, 70 líneas, 22 oferentes |
| Estimación de adjudicaciones del rubro 2024→hoy | 3.000–8.000 líneas (cabe de sobra en Supabase Free) |

## 9. Licencia y atribución

Datos publicados por ARCE bajo Licencia de Datos Abiertos – Uruguay. Poner en el footer: "Datos: Agencia Reguladora de Compras Estatales (ARCE), Uruguay".
