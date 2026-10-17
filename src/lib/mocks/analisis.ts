// Datos de prueba hasta que existan los datos reales (M2 los elimina). Basados en llamados y adjudicaciones reales de ARCE (oct. 2026).
import type { AnalisisPliego } from '@/lib/types';

export const ANALISIS: Record<string, AnalisisPliego> = {
  "1375519": {
    "resumen": "Licitación abreviada del Instituto Nacional de Rehabilitación para comprar los materiales de la obra del sector femenino de la Unidad N.º 22 (Rocha): áridos, portland, ladrillos, bloques, hierro, caños y accesorios de PVC y herramientas.",
    "quePiden": "71 ítems: materiales gruesos de obra, sanitaria en PVC, herramientas y elementos de seguridad.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado del BSE (accidentes de trabajo)",
        "tipo": "BSE",
        "obligatorio": true,
        "seccion": "Documentación a presentar",
        "detalle": "Póliza vigente al momento de la apertura."
      },
      {
        "documento": "Garantía de mantenimiento de oferta",
        "tipo": "OTRO",
        "obligatorio": false,
        "seccion": "Garantías",
        "detalle": "Solo si la oferta supera el tope de la licitación abreviada."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-27T11:00:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      },
      {
        "tipo": "visita",
        "fecha": "2026-10-22T10:00:00-03:00",
        "descripcion": "Visita a la Unidad N.º 22 coordinada con Proveeduría",
        "obligatoria": false,
        "fuente": "pliego_1375519.pdf, p. 3"
      }
    ],
    "condiciones": {
      "lugarEntrega": "Unidad N.º 22, Rocha",
      "plazoEntrega": "10 días hábiles",
      "mantenimientoOferta": "60 días",
      "formaPago": "Crédito SIIF",
      "cotizarConIva": true
    },
    "riesgos": [
      "Rocha está fuera de tus zonas de entrega: sumá el flete o descartala.",
      "Incluye herramientas y elementos de seguridad que no vendés."
    ],
    "confianza": 70,
    "basadoEn": "pliego"
  },
  "1377159": {
    "resumen": "La Dirección Nacional de Vialidad (MTOP) compra cordones de hormigón prefabricados según planilla adjunta. Se publicó un comunicado con cambios.",
    "quePiden": "Cordones y escalones de hormigón prefabricado.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Ficha técnica del prefabricado",
        "tipo": "OTRO",
        "obligatorio": true,
        "seccion": "Especificaciones",
        "detalle": "Dimensiones y resistencia del hormigón."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-23T13:30:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      }
    ],
    "condiciones": {
      "cotizarConIva": true
    },
    "riesgos": [
      "No es un producto de tu lista."
    ],
    "confianza": 66,
    "basadoEn": "pliego"
  },
  "1377866": {
    "resumen": "Compra directa del Instituto Nacional de Rehabilitación de 33 ítems de construcción, sanitaria y electricidad con entrega inmediata en Río Negro.",
    "quePiden": "Materiales de construcción, termofusión, eléctricos y aberturas de aluminio.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-19T10:00:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      }
    ],
    "condiciones": {
      "lugarEntrega": "Río Negro",
      "plazoEntrega": "Inmediata",
      "cotizarConIva": true
    },
    "riesgos": [
      "Entrega inmediata en Río Negro: difícil con tu flota.",
      "Cierra en menos de 48 horas."
    ],
    "confianza": 76,
    "basadoEn": "pliego"
  },
  "1379503": {
    "resumen": "El Instituto Nacional de Rehabilitación compra materiales para refaccionar columnas de la Unidad N.º 7 (Canelones): pedregullo, arena fina, fleje de acero, hebillas y una pala pocera.",
    "quePiden": "Pedregullo y arena fina a granel, más fleje de acero, hebillas y una pala pocera.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-20T11:00:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      }
    ],
    "condiciones": {
      "lugarEntrega": "Unidad N.º 7, Canelones",
      "formaPago": "Crédito SIIF",
      "cotizarConIva": true
    },
    "riesgos": [
      "Podés cotizar solo los ítems que vendés: confirmá que el pedido admite cotización parcial."
    ],
    "confianza": 74,
    "basadoEn": "pliego"
  },
  "1379506": {
    "resumen": "El Instituto Nacional de Rehabilitación compra materiales para el perímetro de la Unidad N.º 14 (Colonia): concertina, alambre de púa, alambre galvanizado, tejido y columnas de hormigón. El precio de referencia es excluyente.",
    "quePiden": "Materiales de cerco perimetral de seguridad.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-20T13:30:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      }
    ],
    "condiciones": {
      "lugarEntrega": "Unidad N.º 14, Colonia",
      "cotizarConIva": true
    },
    "riesgos": [
      "Precio de referencia excluyente: si cotizás por encima, la oferta queda afuera.",
      "Colonia está fuera de tus zonas de entrega."
    ],
    "confianza": 68,
    "basadoEn": "pliego"
  },
  "1380047": {
    "resumen": "El MTOP compra materiales de barraca según una planilla adjunta: baldes, fratachos, lápices de carpintero, compensado fenólico y puente de adherencia epoxi. El pliego parece escaneado y no se pudo leer.",
    "quePiden": "7 ítems de herramientas de albañilería y un compensado fenólico.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-22T11:00:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      }
    ],
    "condiciones": {},
    "riesgos": [
      "El pliego no se pudo leer: el análisis se basa solo en los datos publicados en ARCE."
    ],
    "confianza": 45,
    "basadoEn": "metadata"
  },
  "i503606": {
    "resumen": "La Intendencia de Canelones compra 30 camiones de balasto para reparar caminos dañados por el evento climático \"El Niño\". La entrega es en el Municipio de Las Piedras.",
    "quePiden": "30 camiones de balasto puestos en el Municipio de Las Piedras.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-20T10:00:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      }
    ],
    "condiciones": {
      "lugarEntrega": "Municipio de Las Piedras",
      "plazoEntrega": "A coordinar con el Municipio",
      "formaPago": "Crédito SIIF",
      "cotizarConIva": true,
      "moneda": "Pesos uruguayos"
    },
    "riesgos": [
      "30 camiones con 4 camiones por semana son casi 8 semanas: cotizá un plazo de entrega realista."
    ],
    "confianza": 80,
    "basadoEn": "pliego"
  },
  "i503656": {
    "resumen": "La Intendencia de Montevideo (Conservación del Palacio) compra membrana líquida impermeabilizante con caucho. Las especificaciones están en un anexo y hay que adjuntar ficha técnica.",
    "quePiden": "Membrana líquida impermeabilizante con caucho; cantidad según anexo.",
    "requisitosDocumentales": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "El oferente debe estar ACTIVO en el Registro Único de Proveedores del Estado."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "seccion": "Requisitos del oferente",
        "detalle": "Se verifica en RUPE al momento de adjudicar."
      },
      {
        "documento": "Ficha técnica del producto",
        "tipo": "OTRO",
        "obligatorio": true,
        "seccion": "Objeto",
        "detalle": "Adjuntar ficha técnica con la oferta."
      }
    ],
    "fechasClave": [
      {
        "tipo": "apertura",
        "fecha": "2026-10-20T12:00:00-03:00",
        "descripcion": "Recepción de ofertas hasta",
        "obligatoria": true,
        "fuente": "ARCE"
      }
    ],
    "condiciones": {
      "lugarEntrega": "Palacio Municipal, 2.º subsuelo, ala sur",
      "cotizarConIva": true
    },
    "riesgos": [
      "La cantidad está en un anexo: revisá el pliego antes de cotizar."
    ],
    "confianza": 72,
    "basadoEn": "pliego"
  }
};
