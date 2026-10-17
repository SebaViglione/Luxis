// Datos de prueba hasta que existan los datos reales (M2 los elimina). Basados en llamados y adjudicaciones reales de ARCE (oct. 2026).
import type { DetalleLicitacion } from '@/lib/types';

export const MATCHES: Record<string, NonNullable<DetalleLicitacion['match']>> = {
  "1375519": {
    "confianza": 64,
    "razon": "Vendés buena parte de los materiales (áridos, portland, ladrillo, bloques, hierro, tabla para encofrado), pero la entrega es en la Unidad N.º 22 de Rocha, fuera de tus zonas de reparto.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "ARENA GRUESA",
        "puedeOfertar": true,
        "productoEmpresa": "Arena gruesa",
        "nota": "En tu lista: Arena gruesa."
      },
      {
        "nroItem": 2,
        "descripcion": "ARENA TERCIADA",
        "puedeOfertar": true,
        "productoEmpresa": "Arena terciada",
        "nota": "En tu lista: Arena terciada."
      },
      {
        "nroItem": 3,
        "descripcion": "ARENA FINA",
        "puedeOfertar": true,
        "productoEmpresa": "Arena fina",
        "nota": "En tu lista: Arena fina."
      },
      {
        "nroItem": 4,
        "descripcion": "BALASTO",
        "puedeOfertar": true,
        "productoEmpresa": "Balasto",
        "nota": "En tu lista: Balasto."
      },
      {
        "nroItem": 5,
        "descripcion": "PIEDRA PARTIDA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 6,
        "descripcion": "PEDREGULLO",
        "puedeOfertar": true,
        "productoEmpresa": "Pedregullo",
        "nota": "En tu lista: Pedregullo."
      },
      {
        "nroItem": 7,
        "descripcion": "CEMENTO PORTLAND",
        "puedeOfertar": true,
        "productoEmpresa": "Cemento portland bolsa 25 kg",
        "nota": "En tu lista: Cemento portland bolsa 25 kg."
      },
      {
        "nroItem": 8,
        "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
        "puedeOfertar": true,
        "productoEmpresa": "Hierro en varilla (6 a 12 mm)",
        "nota": "En tu lista: Hierro en varilla (6 a 12 mm)."
      },
      {
        "nroItem": 9,
        "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
        "puedeOfertar": true,
        "productoEmpresa": "Hierro en varilla (6 a 12 mm)",
        "nota": "En tu lista: Hierro en varilla (6 a 12 mm)."
      },
      {
        "nroItem": 10,
        "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
        "puedeOfertar": true,
        "productoEmpresa": "Hierro en varilla (6 a 12 mm)",
        "nota": "En tu lista: Hierro en varilla (6 a 12 mm)."
      },
      {
        "nroItem": 11,
        "descripcion": "HIDROFUGO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 12,
        "descripcion": "TABLA PARA ENCOFRADO",
        "puedeOfertar": true,
        "productoEmpresa": "Tabla pino 1\"x15 cm (3,30 m)",
        "nota": "En tu lista: Tabla pino 1\"x15 cm (3,30 m)."
      },
      {
        "nroItem": 13,
        "descripcion": "ALAMBRE DE HIERRO NEGRO RECOCIDO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 14,
        "descripcion": "CLAVO DE HIERRO (PUNTA PARIS)",
        "puedeOfertar": true,
        "productoEmpresa": "Clavos de 2 1/2\"",
        "nota": "En tu lista: Clavos de 2 1/2\"."
      },
      {
        "nroItem": 15,
        "descripcion": "CLAVO DE HIERRO (PUNTA PARIS)",
        "puedeOfertar": true,
        "productoEmpresa": "Clavos de 2 1/2\"",
        "nota": "En tu lista: Clavos de 2 1/2\"."
      },
      {
        "nroItem": 16,
        "descripcion": "BLOQUE DE HORMIGON VIBRADO",
        "puedeOfertar": true,
        "productoEmpresa": "Bloque de hormigón 12x19x39 cm",
        "nota": "En tu lista: Bloque de hormigón 12x19x39 cm."
      },
      {
        "nroItem": 17,
        "descripcion": "BLOQUE DE HORMIGON VIBRADO",
        "puedeOfertar": true,
        "productoEmpresa": "Bloque de hormigón 12x19x39 cm",
        "nota": "En tu lista: Bloque de hormigón 12x19x39 cm."
      },
      {
        "nroItem": 18,
        "descripcion": "LADRILLO DE CAMPO",
        "puedeOfertar": true,
        "productoEmpresa": "Ladrillo de campo",
        "nota": "En tu lista: Ladrillo de campo."
      },
      {
        "nroItem": 19,
        "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
        "puedeOfertar": true,
        "productoEmpresa": "Caño PVC sanitario 110 mm",
        "nota": "En tu lista: Caño PVC sanitario 110 mm."
      },
      {
        "nroItem": 20,
        "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
        "puedeOfertar": true,
        "productoEmpresa": "Caño PVC sanitario 110 mm",
        "nota": "En tu lista: Caño PVC sanitario 110 mm."
      },
      {
        "nroItem": 21,
        "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
        "puedeOfertar": true,
        "productoEmpresa": "Caño PVC sanitario 110 mm",
        "nota": "En tu lista: Caño PVC sanitario 110 mm."
      },
      {
        "nroItem": 22,
        "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
        "puedeOfertar": true,
        "productoEmpresa": "Caño PVC sanitario 110 mm",
        "nota": "En tu lista: Caño PVC sanitario 110 mm."
      },
      {
        "nroItem": 23,
        "descripcion": "CUPLA DE PVC",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 24,
        "descripcion": "CUPLA DE PVC",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 25,
        "descripcion": "RAMAL DE PVC DE 45º HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 26,
        "descripcion": "RAMAL DE PVC DE 45º HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 27,
        "descripcion": "CODO DE PVC DE 45 HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 28,
        "descripcion": "CODO DE PVC DE 45 HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 29,
        "descripcion": "CODO DE PVC DE 90 HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 30,
        "descripcion": "CODO DE PVC DE 90 HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 31,
        "descripcion": "CODO DE PVC DE 90 HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 32,
        "descripcion": "SOMBRERETE DE VENTILACION EN PVC",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 33,
        "descripcion": "ADHESIVO PARA PVC",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 34,
        "descripcion": "TANZA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 35,
        "descripcion": "CHAURA DE ALBAÑIL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 36,
        "descripcion": "FRATACHO DE MADERA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 37,
        "descripcion": "MANGUERA PARA NIVEL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 38,
        "descripcion": "LLANA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 39,
        "descripcion": "LLANA DENTADA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 40,
        "descripcion": "PICO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 41,
        "descripcion": "CUCHARA DE ALBAÑIL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 42,
        "descripcion": "NIVEL DE ALBAÑIL (CUERPO DE ALUMINIO)",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 43,
        "descripcion": "REGLA DE ALUMINIO PARA ALBAÑIL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 44,
        "descripcion": "JUEGO DE TRINCHETA INDUSTRIAL CON REPUESTO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 45,
        "descripcion": "ALICATE DE CORTE DIAGONAL CON AISLACION",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 46,
        "descripcion": "PLOMADA DE LATON TIPO BARRIL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 47,
        "descripcion": "PLOMADA DE PUNTA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 48,
        "descripcion": "PALA DE CORTE (RECTA)",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 49,
        "descripcion": "PALA DE BOLEO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 50,
        "descripcion": "COMPACTADOR DE SUELOS",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 51,
        "descripcion": "CARRETILLA DE HIERRO CALIBRADA CON RUEDA DE GOMA MACIZA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 52,
        "descripcion": "BALDE DE ALBAÑIL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 53,
        "descripcion": "MARTILLO DE UÑA (CARPINTERO)",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 54,
        "descripcion": "CORTADORA MANUAL DE CERAMICA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 55,
        "descripcion": "ANDAMIO TUBULAR",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 56,
        "descripcion": "ACCESORIO PARA ANDAMIOS TUBULARES",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 57,
        "descripcion": "CASCO DE SEGURIDAD",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 58,
        "descripcion": "LLAVE PARA VARILLA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 59,
        "descripcion": "LLAVE PARA VARILLA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 60,
        "descripcion": "LLAVE PARA VARILLA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 61,
        "descripcion": "AMOLADORA ANGULAR ELECTRICA PORTATIL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 62,
        "descripcion": "HORMIGONERA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 63,
        "descripcion": "SIERRA CIRCULAR DE MANO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 64,
        "descripcion": "CIZALLA PARA HIERRO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 65,
        "descripcion": "MAMELUCO DE MANGA LARGA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 66,
        "descripcion": "GUANTE ANTICORTE RECUBIERTO DE NITRILO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 67,
        "descripcion": "ZAPATO DE SEGURIDAD CON PUNTERA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 68,
        "descripcion": "ARNES COMPLETO CON CABO DE VIDA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 69,
        "descripcion": "DISCO DE CORTE PARA HIERRO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 70,
        "descripcion": "DISCO DE CORTE DIAMANTADO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 71,
        "descripcion": "HOJA DE SIERRA BIMETAL PARA ARCO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado del BSE (accidentes de trabajo)",
        "tipo": "BSE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Póliza vigente."
      },
      {
        "documento": "Garantía de mantenimiento de oferta",
        "tipo": "OTRO",
        "obligatorio": false,
        "tiene": false,
        "estadoEmpresa": "no_tiene",
        "diasEstimados": 3,
        "alcanzableAntesCierre": true,
        "nota": "Banco o aseguradora: 1 a 3 días hábiles. Llegás antes del cierre."
      }
    ],
    "estadoDocumental": "alcanzable",
    "estadoUsuario": "nuevo"
  },
  "1377159": {
    "confianza": 41,
    "razon": "Pide cordones de hormigón prefabricados: no están en tu lista. Si conseguís un proveedor de prefabricados podrías revenderlos.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "ESCALON DE HORMIGON RPREFABRICADO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Ficha técnica del prefabricado",
        "tipo": "OTRO",
        "obligatorio": true,
        "tiene": false,
        "estadoEmpresa": "no_tiene",
        "diasEstimados": 3,
        "alcanzableAntesCierre": true,
        "nota": "La provee el fabricante: 1 a 3 días hábiles."
      }
    ],
    "estadoDocumental": "alcanzable",
    "estadoUsuario": "nuevo"
  },
  "1377866": {
    "confianza": 45,
    "razon": "Hay portland, arena terciada, varilla, cerámica, adhesivo y pintura que vendés, pero piden entrega inmediata en Río Negro, fuera de tu zona, y cierra en 2 días.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "PUERTA INTERIOR DE MADERA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 2,
        "descripcion": "DUCTO METALICO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 3,
        "descripcion": "LAMPARA LED",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 4,
        "descripcion": "CABLE BAJO GOMA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 5,
        "descripcion": "INTERRUPTOR BIPOLAR EXTERIOR",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 6,
        "descripcion": "MODULO TOMACORRIENTE SCHUKO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 7,
        "descripcion": "MODULO TOMACORRIENTE 3 EN LINEA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 8,
        "descripcion": "COLILLA DE MALLA DE ACERO HEMBRA HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 9,
        "descripcion": "CODO DE PVC DE 45 HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 10,
        "descripcion": "CODO DE PVC DE 90 MACHO-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 11,
        "descripcion": "ELECTRODO RUTILICO AWS E-6013 (TIPO R11)",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 12,
        "descripcion": "PLANCHUELA DE HIERRO PERFORADA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 13,
        "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
        "puedeOfertar": true,
        "productoEmpresa": "Hierro en varilla (6 a 12 mm)",
        "nota": "En tu lista: Hierro en varilla (6 a 12 mm)."
      },
      {
        "nroItem": 14,
        "descripcion": "ARENA TERCIADA",
        "puedeOfertar": true,
        "productoEmpresa": "Arena terciada",
        "nota": "En tu lista: Arena terciada."
      },
      {
        "nroItem": 15,
        "descripcion": "CEMENTO PORTLAND",
        "puedeOfertar": true,
        "productoEmpresa": "Cemento portland bolsa 25 kg",
        "nota": "En tu lista: Cemento portland bolsa 25 kg."
      },
      {
        "nroItem": 16,
        "descripcion": "CEMENTO ADHESIVO PARA CERAMICA",
        "puedeOfertar": true,
        "productoEmpresa": "Adhesivo para cerámica bolsa 25 kg",
        "nota": "En tu lista: Adhesivo para cerámica bolsa 25 kg."
      },
      {
        "nroItem": 17,
        "descripcion": "ENDUIDO PLASTICO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 18,
        "descripcion": "PINTURA DE LATEX PLASTICA",
        "puedeOfertar": true,
        "productoEmpresa": "Pintura látex interior balde 20 L",
        "nota": "En tu lista: Pintura látex interior balde 20 L."
      },
      {
        "nroItem": 19,
        "descripcion": "PILETA DE PLASTICO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 20,
        "descripcion": "INODORO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 21,
        "descripcion": "CISTERNA DE PLASTICO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 22,
        "descripcion": "LLAVE DE PASO PARA TERMOFUSION",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 23,
        "descripcion": "TEE DE COMPRESION PARA SISTEMA DE RIEGO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 24,
        "descripcion": "CODO 90 GRADOS PARA TERMOFUSION HEMBRA-HEMBRA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 25,
        "descripcion": "CODO 90 DE TERMOFUSION CON INSERTO METALICO MACHO (TF HEMBRA)",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 26,
        "descripcion": "CODO 90 DE TERMOFUSION CON INSERTO METALICO HEMBRA (TF HEMBRA)",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 27,
        "descripcion": "CAÑO DE TERMOFUSION",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 28,
        "descripcion": "GRIFERIA MONOCOMANDO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 29,
        "descripcion": "CERAMICA PARA PARED",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 30,
        "descripcion": "BANDEROLA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 31,
        "descripcion": "ABERTURA DE ALUMINIO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 32,
        "descripcion": "CERAMICA PARA PISO",
        "puedeOfertar": true,
        "productoEmpresa": "Cerámica piso básica 33x33 cm",
        "nota": "En tu lista: Cerámica piso básica 33x33 cm."
      },
      {
        "nroItem": 33,
        "descripcion": "MEMBRANA ASFALTICA PLASTICA",
        "puedeOfertar": true,
        "productoEmpresa": "Membrana asfáltica 4 mm (rollo 10 m²)",
        "nota": "En tu lista: Membrana asfáltica 4 mm (rollo 10 m²)."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      }
    ],
    "estadoDocumental": "cumple",
    "estadoUsuario": "nuevo"
  },
  "1379503": {
    "confianza": 77,
    "razon": "Pedregullo y arena fina para refaccionar columnas en la Unidad N.º 7 de Canelones, dentro de tu zona. Fleje, hebillas y pala pocera no están en tu lista.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "PEDREGULLO",
        "puedeOfertar": true,
        "productoEmpresa": "Pedregullo",
        "nota": "En tu lista: Pedregullo."
      },
      {
        "nroItem": 2,
        "descripcion": "ARENA FINA",
        "puedeOfertar": true,
        "productoEmpresa": "Arena fina",
        "nota": "En tu lista: Arena fina."
      },
      {
        "nroItem": 3,
        "descripcion": "PALA POCERA CON CABO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 4,
        "descripcion": "FLEJE DE ACERO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 5,
        "descripcion": "HEBILLA PARA FLEJE DE ACERO INOXIDABLE",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      }
    ],
    "estadoDocumental": "cumple",
    "estadoUsuario": "guardada"
  },
  "1379506": {
    "confianza": 52,
    "razon": "Alambre de púa y alambre galvanizado los vendés, pero el tejido, las columnas de hormigón y la concertina no; y la entrega es en Colonia, fuera de tu zona.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "CONCERTINA DE GANCHOS (BARRERA DE CUCHILLAS)",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 2,
        "descripcion": "ALAMBRE DE PUA",
        "puedeOfertar": true,
        "productoEmpresa": "Alambre de púa",
        "nota": "En tu lista: Alambre de púa."
      },
      {
        "nroItem": 3,
        "descripcion": "ALAMBRE GALVANIZADO OVALADO ALTO CARBONO",
        "puedeOfertar": true,
        "productoEmpresa": "Alambre galvanizado liso N.° 14",
        "nota": "En tu lista: Alambre galvanizado liso N.° 14."
      },
      {
        "nroItem": 4,
        "descripcion": "COLUMNA DE HORMIGON INTERMEDIA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 5,
        "descripcion": "TEJIDO DE ALAMBRE GALVANIZADO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      }
    ],
    "estadoDocumental": "cumple",
    "estadoUsuario": "nuevo"
  },
  "1380047": {
    "confianza": 55,
    "razon": "El objeto dice \"Materiales de Barraca\", pero de los 7 ítems solo el compensado fenólico está en tu lista; el resto son herramientas de albañilería.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "BALDE DE ALBAÑIL",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 2,
        "descripcion": "LAPIZ CARPINTERO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 3,
        "descripcion": "FRATACHO DE MADERA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 4,
        "descripcion": "FRATACHO DE PVC CON ESPUMA POLIURETANO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 5,
        "descripcion": "FRATACHO DE MADERA",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 6,
        "descripcion": "PUENTE DE ADHERENCIA EPOXICO",
        "puedeOfertar": false,
        "productoEmpresa": null,
        "nota": "No está en tu lista de productos."
      },
      {
        "nroItem": 7,
        "descripcion": "CHAPA DE COMPENSADO FENOLICO",
        "puedeOfertar": true,
        "productoEmpresa": "Compensado fenólico 18 mm",
        "nota": "En tu lista: Compensado fenólico 18 mm."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      }
    ],
    "estadoDocumental": "desconocido",
    "estadoUsuario": "nuevo"
  },
  "i503606": {
    "confianza": 86,
    "razon": "Pide 30 camiones de balasto con entrega en el Municipio de Las Piedras, tu misma localidad. El único punto a confirmar es el plazo: declaraste 4 camiones por semana.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "BALASTO (30 CAMIONES)",
        "puedeOfertar": true,
        "productoEmpresa": "Balasto",
        "nota": "En tu lista: Balasto."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      }
    ],
    "estadoDocumental": "cumple",
    "estadoUsuario": "nuevo"
  },
  "i503656": {
    "confianza": 81,
    "razon": "Pide membrana líquida impermeabilizante con caucho para el Palacio Municipal: la vendés en balde de 20 L y entregás en Montevideo. Piden ficha técnica del producto.",
    "itemsOfertables": [
      {
        "nroItem": 1,
        "descripcion": "MEMBRANA LIQUIDA IMPERMEABILIZANTE C/CAUCHO",
        "puedeOfertar": true,
        "productoEmpresa": "Impermeabilizante líquido balde 20 L",
        "nota": "En tu lista: Impermeabilizante líquido balde 20 L."
      }
    ],
    "gapDocumental": [
      {
        "documento": "Inscripción en RUPE en estado Activo",
        "tipo": "RUPE",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Tenés RUPE activo."
      },
      {
        "documento": "Certificado único de DGI vigente",
        "tipo": "DGI",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Certificado común de BPS vigente",
        "tipo": "BPS",
        "obligatorio": true,
        "tiene": true,
        "estadoEmpresa": "vigente",
        "diasEstimados": 0,
        "alcanzableAntesCierre": true,
        "nota": "Al día."
      },
      {
        "documento": "Ficha técnica del producto",
        "tipo": "OTRO",
        "obligatorio": true,
        "tiene": false,
        "estadoEmpresa": "no_tiene",
        "diasEstimados": 3,
        "alcanzableAntesCierre": true,
        "nota": "La pedís al fabricante: 1 a 3 días hábiles."
      }
    ],
    "estadoDocumental": "alcanzable",
    "estadoUsuario": "nuevo"
  }
};
