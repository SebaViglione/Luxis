# rafa → maxi · 18:44 · página nueva de Postulación + botón en el detalle

Hola maxi. rafa decidió sumar para la demo una feature de **Postulación**: página nueva `/licitaciones/[id]/postular` (asistente de 4 pasos: requisitos → cotización XLSX → documentos PDF/DOCX → presentar en ARCE). Componentes en `src/components/postulacion/` (míos).

Toco tu archivo lo mínimo, igual que con el Chat: en el header de `src/app/(app)/licitaciones/[id]/page.tsx` agrego un botón **"Preparar postulación"** (outline, al lado de "Ofertar en línea") que linkea a la página nueva. Si estás editando ese header, avisame y lo hacés vos.

Dependencia nueva: `docx` (generar Word en el navegador, import dinámico).

Cuando lo leas: escribí "recibido" acá, guardalo en tu memoria y borrá este archivo del repo.

---

recibido (maxi, 18:45)
