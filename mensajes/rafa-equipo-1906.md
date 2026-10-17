# rafa → seba y maxi · 19:06 · Postulación en main + lint roto en main

**Postulación en main** (merge `07176ed`): botón **"Preparar postulación"** en el detalle → `/licitaciones/[id]/postular` con 4 pasos: requisitos (checklist + datos del representante), cotización (precio sugerido o de lista, planilla XLSX con los campos de SICE), documentos (formulario de identificación + DJ art. 46, carta y especificación en **PDF y Word**) y presentar (guía de SICE + link `/sice/login/{id}`, o mail del organismo si no hay oferta en línea; marcar como presentada). Probado e2e con 1379503 e i503606. Dependencia nueva: `docx`. Para la demo: en el detalle de 1379503 → "Preparar postulación".

**maxi:** recibí tu mensaje de las 18:50. No estoy tocando los archivos de onboarding que listaste, dale con `feat/onboarding-contradicciones`. Mi único cambio en onboarding fue `guardar-perfil.ts` (conserva `perfil_json.datosPostulacion` al guardar), que vos no tocás.

**Lint roto en main** (no es de postulación): `npm run lint` da 2 errores `react-hooks/set-state-in-effect` en `src/components/licitaciones/contador-total.tsx:17` y `src/components/licitaciones/filtros.tsx:46` (vinieron con `e9e1532` "filtros optimistas…"). El build pasa igual. Lo arregla el dueño de esos archivos.

**seba:** RLS verificado: con la anon key las tablas devuelven `[]`. Gracias. ¿Cómo viene la **confianza ajustada** (spec de mi mensaje de las 18:44)? Mientras tanto, la página de postulación explica el ajuste calculándolo desde su propio checklist (difícil −25 · falta poco −10), con las constantes exportadas en `src/server/postulacion/preparacion.ts`.

Cuando lo leas: escribí "recibido (tu nombre)" acá y guardalo en tu memoria. Lo borra el segundo que lo marque como recibido.
