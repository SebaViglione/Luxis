// Datos de prueba hasta que existan los datos reales (M2 los elimina). Basados en llamados y adjudicaciones reales de ARCE (oct. 2026).
import type { PrecioHistorico } from '@/lib/types';

export const PRECIOS: Record<string, PrecioHistorico[]> = {
  "1375519": [
    {
      "nroItem": 1,
      "idArticulo": 5,
      "descripcion": "ARENA GRUESA",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 3,
      "p25": 1073.18,
      "mediana": 1098.36,
      "p75": 1520.49,
      "minimo": 1048,
      "maximo": 1942.62,
      "ultimoGanador": "MAAMATZ SAS",
      "ultimoPrecio": 1942.62,
      "ultimaFecha": "2026-10-05T09:40:00-03:00",
      "competidores": [
        {
          "nombre": "TICAMPA SOCIEDAD ANONIMA",
          "nroDoc": "216752970010",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "MAAMATZ SAS",
          "nroDoc": "219079460015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "DISTRIMORE SOCIEDAD POR ACCIONES SIMPLIFICADAS",
          "nroDoc": "020576520017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 1073.18,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 2,
      "idArticulo": 446,
      "descripcion": "ARENA TERCIADA",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 6,
      "p25": 966.5,
      "mediana": 1100,
      "p75": 1548.31,
      "minimo": 849,
      "maximo": 1829.51,
      "ultimoGanador": "VERALFIX S.A",
      "ultimoPrecio": 1100,
      "ultimaFecha": "2026-10-07T14:15:00-03:00",
      "competidores": [
        {
          "nombre": "VERALFIX S.A",
          "nroDoc": "215043630015",
          "vecesAdjudicado": 2,
          "vecesOferto": 0
        },
        {
          "nombre": "MAAMATZ SAS",
          "nroDoc": "219079460015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "SANQUILCO SOCIEDAD ANONIMA",
          "nroDoc": "217009690015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 966.5,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 3,
      "idArticulo": 8,
      "descripcion": "ARENA FINA",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 3,
      "p25": 936.72,
      "mediana": 980,
      "p75": 1493.5,
      "minimo": 893.44,
      "maximo": 2007,
      "ultimoGanador": "OSMARNICA SAS",
      "ultimoPrecio": 893.44,
      "ultimaFecha": "2026-10-06T13:35:00-03:00",
      "competidores": [
        {
          "nombre": "LIPIN S A",
          "nroDoc": "211476740019",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "BARRACA PANAMERICANA S A",
          "nroDoc": "213729280017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "OSMARNICA SAS",
          "nroDoc": "170358320019",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 936.72,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 4,
      "idArticulo": 445,
      "descripcion": "BALASTO",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 2,
      "p25": 1000,
      "mediana": 1100,
      "p75": 1200,
      "minimo": 900,
      "maximo": 1300,
      "ultimoGanador": "MARQUEZ DA SILVA OCTAVIO",
      "ultimoPrecio": 1300,
      "ultimaFecha": "2026-10-03T00:20:00-03:00",
      "competidores": [
        {
          "nombre": "PORTHABLE SA",
          "nroDoc": "215081280018",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "MARQUEZ DA SILVA OCTAVIO",
          "nroDoc": "150022920016",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 1100,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 6,
      "idArticulo": 1,
      "descripcion": "PEDREGULLO",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 2,
      "p25": 1386.76,
      "mediana": 1681.88,
      "p75": 1977.01,
      "minimo": 1091.63,
      "maximo": 2272.13,
      "ultimoGanador": "TICAMPA SOCIEDAD ANONIMA",
      "ultimoPrecio": 1091.63,
      "ultimaFecha": "2026-10-02T11:35:00-03:00",
      "competidores": [
        {
          "nombre": "MAAMATZ SAS",
          "nroDoc": "219079460015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "TICAMPA SOCIEDAD ANONIMA",
          "nroDoc": "216752970010",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 1681.88,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 7,
      "idArticulo": 3563,
      "descripcion": "CEMENTO PORTLAND",
      "moneda": "UYU",
      "unidad": "BOLSA",
      "n": 4,
      "p25": 178.61,
      "mediana": 185.91,
      "p75": 201.37,
      "minimo": 169.5,
      "maximo": 235,
      "ultimoGanador": "LAGO DORVAL S A",
      "ultimoPrecio": 190.1639,
      "ultimaFecha": "2026-10-07T15:00:00-03:00",
      "competidores": [
        {
          "nombre": "LA CHACARITA LTDA",
          "nroDoc": "210303590017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "VALERIA ROVATI SAS",
          "nroDoc": "220096950010",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "BARRACA JULIA SOCIEDAD ANONIMA",
          "nroDoc": "020050690013",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 178.61,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 8,
      "idArticulo": 404,
      "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 5,
      "p25": 216,
      "mediana": 267.73,
      "p75": 339.46,
      "minimo": 72.6,
      "maximo": 542.3688,
      "ultimoGanador": "A. BERTOLOTTI S.A.",
      "ultimoPrecio": 267.73,
      "ultimaFecha": "2026-10-02T13:20:00-03:00",
      "competidores": [
        {
          "nombre": "SALVADOR TORTORELLA S.R.L.",
          "nroDoc": "120011680017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "MARTIN REZK S A",
          "nroDoc": "090026500014",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "SANQUILCO SOCIEDAD ANONIMA",
          "nroDoc": "217009690015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 216,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 9,
      "idArticulo": 404,
      "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 5,
      "p25": 216,
      "mediana": 267.73,
      "p75": 339.46,
      "minimo": 72.6,
      "maximo": 542.3688,
      "ultimoGanador": "A. BERTOLOTTI S.A.",
      "ultimoPrecio": 267.73,
      "ultimaFecha": "2026-10-02T13:20:00-03:00",
      "competidores": [
        {
          "nombre": "SALVADOR TORTORELLA S.R.L.",
          "nroDoc": "120011680017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "MARTIN REZK S A",
          "nroDoc": "090026500014",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "SANQUILCO SOCIEDAD ANONIMA",
          "nroDoc": "217009690015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 216,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 10,
      "idArticulo": 404,
      "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 5,
      "p25": 216,
      "mediana": 267.73,
      "p75": 339.46,
      "minimo": 72.6,
      "maximo": 542.3688,
      "ultimoGanador": "A. BERTOLOTTI S.A.",
      "ultimoPrecio": 267.73,
      "ultimaFecha": "2026-10-02T13:20:00-03:00",
      "competidores": [
        {
          "nombre": "SALVADOR TORTORELLA S.R.L.",
          "nroDoc": "120011680017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "MARTIN REZK S A",
          "nroDoc": "090026500014",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "SANQUILCO SOCIEDAD ANONIMA",
          "nroDoc": "217009690015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 216,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 12,
      "idArticulo": 3370,
      "descripcion": "TABLA PARA ENCOFRADO",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 1,
      "p25": 172,
      "mediana": 172,
      "p75": 172,
      "minimo": 172,
      "maximo": 172,
      "ultimoGanador": "VALERIA ROVATI SAS",
      "ultimoPrecio": 172,
      "ultimaFecha": "2026-10-01T10:15:00-03:00",
      "competidores": [
        {
          "nombre": "VALERIA ROVATI SAS",
          "nroDoc": "220096950010",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 172,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 14,
      "idArticulo": 896,
      "descripcion": "CLAVO DE HIERRO (PUNTA PARIS)",
      "moneda": "UYU",
      "unidad": "KG",
      "n": 0,
      "p25": null,
      "mediana": null,
      "p75": null,
      "minimo": null,
      "maximo": null,
      "ultimoGanador": null,
      "ultimoPrecio": null,
      "ultimaFecha": null,
      "competidores": [],
      "precioSugerido": null,
      "explicacion": null
    },
    {
      "nroItem": 15,
      "idArticulo": 896,
      "descripcion": "CLAVO DE HIERRO (PUNTA PARIS)",
      "moneda": "UYU",
      "unidad": "KG",
      "n": 0,
      "p25": null,
      "mediana": null,
      "p75": null,
      "minimo": null,
      "maximo": null,
      "ultimoGanador": null,
      "ultimoPrecio": null,
      "ultimaFecha": null,
      "competidores": [],
      "precioSugerido": null,
      "explicacion": null
    },
    {
      "nroItem": 16,
      "idArticulo": 112,
      "descripcion": "BLOQUE DE HORMIGON VIBRADO",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 1,
      "p25": 26,
      "mediana": 26,
      "p75": 26,
      "minimo": 26,
      "maximo": 26,
      "ultimoGanador": "BARBADOS S A",
      "ultimoPrecio": 26,
      "ultimaFecha": "2026-09-30T11:15:00-03:00",
      "competidores": [
        {
          "nombre": "BARBADOS S A",
          "nroDoc": "040099750014",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 26,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 17,
      "idArticulo": 112,
      "descripcion": "BLOQUE DE HORMIGON VIBRADO",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 1,
      "p25": 26,
      "mediana": 26,
      "p75": 26,
      "minimo": 26,
      "maximo": 26,
      "ultimoGanador": "BARBADOS S A",
      "ultimoPrecio": 26,
      "ultimaFecha": "2026-09-30T11:15:00-03:00",
      "competidores": [
        {
          "nombre": "BARBADOS S A",
          "nroDoc": "040099750014",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 26,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 18,
      "idArticulo": 3552,
      "descripcion": "LADRILLO DE CAMPO",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 2,
      "p25": 9.13,
      "mediana": 10.25,
      "p75": 11.38,
      "minimo": 8,
      "maximo": 12.5,
      "ultimoGanador": "TICAMPA SOCIEDAD ANONIMA",
      "ultimoPrecio": 12.5,
      "ultimaFecha": "2026-10-02T11:35:00-03:00",
      "competidores": [
        {
          "nombre": "PRENORTE S.R.L.",
          "nroDoc": "010161290016",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "TICAMPA SOCIEDAD ANONIMA",
          "nroDoc": "216752970010",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 10.25,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 19,
      "idArticulo": 11227,
      "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 1,
      "p25": 459.25,
      "mediana": 459.25,
      "p75": 459.25,
      "minimo": 459.25,
      "maximo": 459.25,
      "ultimoGanador": "BARRACA JULIA SOCIEDAD ANONIMA",
      "ultimoPrecio": 459.25,
      "ultimaFecha": "2026-10-05T09:40:00-03:00",
      "competidores": [
        {
          "nombre": "BARRACA JULIA SOCIEDAD ANONIMA",
          "nroDoc": "020050690013",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 459.25,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 20,
      "idArticulo": 11227,
      "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 1,
      "p25": 459.25,
      "mediana": 459.25,
      "p75": 459.25,
      "minimo": 459.25,
      "maximo": 459.25,
      "ultimoGanador": "BARRACA JULIA SOCIEDAD ANONIMA",
      "ultimoPrecio": 459.25,
      "ultimaFecha": "2026-10-05T09:40:00-03:00",
      "competidores": [
        {
          "nombre": "BARRACA JULIA SOCIEDAD ANONIMA",
          "nroDoc": "020050690013",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 459.25,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 21,
      "idArticulo": 11227,
      "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 1,
      "p25": 459.25,
      "mediana": 459.25,
      "p75": 459.25,
      "minimo": 459.25,
      "maximo": 459.25,
      "ultimoGanador": "BARRACA JULIA SOCIEDAD ANONIMA",
      "ultimoPrecio": 459.25,
      "ultimaFecha": "2026-10-05T09:40:00-03:00",
      "competidores": [
        {
          "nombre": "BARRACA JULIA SOCIEDAD ANONIMA",
          "nroDoc": "020050690013",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 459.25,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 22,
      "idArticulo": 11227,
      "descripcion": "CAÑO DE PVC (SANEAMIENTO)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 1,
      "p25": 459.25,
      "mediana": 459.25,
      "p75": 459.25,
      "minimo": 459.25,
      "maximo": 459.25,
      "ultimoGanador": "BARRACA JULIA SOCIEDAD ANONIMA",
      "ultimoPrecio": 459.25,
      "ultimaFecha": "2026-10-05T09:40:00-03:00",
      "competidores": [
        {
          "nombre": "BARRACA JULIA SOCIEDAD ANONIMA",
          "nroDoc": "020050690013",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 459.25,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    }
  ],
  "1377159": [],
  "1377866": [
    {
      "nroItem": 13,
      "idArticulo": 404,
      "descripcion": "VARILLA DE HIERRO REDONDA COMUN (LISA)",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 5,
      "p25": 216,
      "mediana": 267.73,
      "p75": 339.46,
      "minimo": 72.6,
      "maximo": 542.3688,
      "ultimoGanador": "A. BERTOLOTTI S.A.",
      "ultimoPrecio": 267.73,
      "ultimaFecha": "2026-10-02T13:20:00-03:00",
      "competidores": [
        {
          "nombre": "SALVADOR TORTORELLA S.R.L.",
          "nroDoc": "120011680017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "MARTIN REZK S A",
          "nroDoc": "090026500014",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "SANQUILCO SOCIEDAD ANONIMA",
          "nroDoc": "217009690015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 216,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 14,
      "idArticulo": 446,
      "descripcion": "ARENA TERCIADA",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 6,
      "p25": 966.5,
      "mediana": 1100,
      "p75": 1548.31,
      "minimo": 849,
      "maximo": 1829.51,
      "ultimoGanador": "VERALFIX S.A",
      "ultimoPrecio": 1100,
      "ultimaFecha": "2026-10-07T14:15:00-03:00",
      "competidores": [
        {
          "nombre": "VERALFIX S.A",
          "nroDoc": "215043630015",
          "vecesAdjudicado": 2,
          "vecesOferto": 0
        },
        {
          "nombre": "MAAMATZ SAS",
          "nroDoc": "219079460015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "SANQUILCO SOCIEDAD ANONIMA",
          "nroDoc": "217009690015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 966.5,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 15,
      "idArticulo": 3563,
      "descripcion": "CEMENTO PORTLAND",
      "moneda": "UYU",
      "unidad": "BOLSA",
      "n": 4,
      "p25": 178.61,
      "mediana": 185.91,
      "p75": 201.37,
      "minimo": 169.5,
      "maximo": 235,
      "ultimoGanador": "LAGO DORVAL S A",
      "ultimoPrecio": 190.1639,
      "ultimaFecha": "2026-10-07T15:00:00-03:00",
      "competidores": [
        {
          "nombre": "LA CHACARITA LTDA",
          "nroDoc": "210303590017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "VALERIA ROVATI SAS",
          "nroDoc": "220096950010",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "BARRACA JULIA SOCIEDAD ANONIMA",
          "nroDoc": "020050690013",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 178.61,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 16,
      "idArticulo": 11513,
      "descripcion": "CEMENTO ADHESIVO PARA CERAMICA",
      "moneda": "UYU",
      "unidad": "KG",
      "n": 2,
      "p25": 234.2,
      "mediana": 256.41,
      "p75": 278.61,
      "minimo": 212,
      "maximo": 300.8197,
      "ultimoGanador": "CERAMICAS CASTRO S A",
      "ultimoPrecio": 212,
      "ultimaFecha": "2026-09-30T16:40:00-03:00",
      "competidores": [
        {
          "nombre": "BERANIL SA",
          "nroDoc": "214204070018",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "CERAMICAS CASTRO S A",
          "nroDoc": "212040370018",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 256.41,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 18,
      "idArticulo": 830,
      "descripcion": "PINTURA DE LATEX PLASTICA",
      "moneda": "UYU",
      "unidad": "L",
      "n": 2,
      "p25": 1551.11,
      "mediana": 2454.67,
      "p75": 3358.24,
      "minimo": 647.541,
      "maximo": 4261.8,
      "ultimoGanador": "BARRACA PAYSANDU S R L",
      "ultimoPrecio": 647.541,
      "ultimaFecha": "2026-10-05T22:35:00-03:00",
      "competidores": [
        {
          "nombre": "A. BERTOLOTTI S.A.",
          "nroDoc": "215092230017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "BARRACA PAYSANDU S R L",
          "nroDoc": "120053770014",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 2454.67,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 32,
      "idArticulo": 9952,
      "descripcion": "CERAMICA PARA PISO",
      "moneda": "UYU",
      "unidad": "M2",
      "n": 7,
      "p25": 247.35,
      "mediana": 269.67,
      "p75": 346.15,
      "minimo": 232.7869,
      "maximo": 6580.91,
      "ultimoGanador": "CERAMICAS CASTRO S A",
      "ultimoPrecio": 6580.91,
      "ultimaFecha": "2026-10-07T11:10:00-03:00",
      "competidores": [
        {
          "nombre": "CERAMICAS CASTRO S A",
          "nroDoc": "212040370018",
          "vecesAdjudicado": 2,
          "vecesOferto": 0
        },
        {
          "nombre": "BERANIL SA",
          "nroDoc": "214204070018",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "MAAMATZ SAS",
          "nroDoc": "219079460015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 247.35,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    },
    {
      "nroItem": 33,
      "idArticulo": 15237,
      "descripcion": "MEMBRANA ASFALTICA PLASTICA",
      "moneda": "UYU",
      "unidad": "KG",
      "n": 0,
      "p25": null,
      "mediana": null,
      "p75": null,
      "minimo": null,
      "maximo": null,
      "ultimoGanador": null,
      "ultimoPrecio": null,
      "ultimaFecha": null,
      "competidores": [],
      "precioSugerido": null,
      "explicacion": null
    }
  ],
  "1379503": [
    {
      "nroItem": 1,
      "idArticulo": 1,
      "descripcion": "PEDREGULLO",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 2,
      "p25": 1386.76,
      "mediana": 1681.88,
      "p75": 1977.01,
      "minimo": 1091.63,
      "maximo": 2272.13,
      "ultimoGanador": "TICAMPA SOCIEDAD ANONIMA",
      "ultimoPrecio": 1091.63,
      "ultimaFecha": "2026-10-02T11:35:00-03:00",
      "competidores": [
        {
          "nombre": "MAAMATZ SAS",
          "nroDoc": "219079460015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "TICAMPA SOCIEDAD ANONIMA",
          "nroDoc": "216752970010",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 1681.88,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 2,
      "idArticulo": 8,
      "descripcion": "ARENA FINA",
      "moneda": "UYU",
      "unidad": "M3",
      "n": 3,
      "p25": 936.72,
      "mediana": 980,
      "p75": 1493.5,
      "minimo": 893.44,
      "maximo": 2007,
      "ultimoGanador": "OSMARNICA SAS",
      "ultimoPrecio": 893.44,
      "ultimaFecha": "2026-10-06T13:35:00-03:00",
      "competidores": [
        {
          "nombre": "LIPIN S A",
          "nroDoc": "211476740019",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "BARRACA PANAMERICANA S A",
          "nroDoc": "213729280017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "OSMARNICA SAS",
          "nroDoc": "170358320019",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 936.72,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    }
  ],
  "1379506": [
    {
      "nroItem": 2,
      "idArticulo": 225,
      "descripcion": "ALAMBRE DE PUA",
      "moneda": "UYU",
      "unidad": "M",
      "n": 1,
      "p25": 5.98,
      "mediana": 5.98,
      "p75": 5.98,
      "minimo": 5.98,
      "maximo": 5.98,
      "ultimoGanador": "SANQUILCO SOCIEDAD ANONIMA",
      "ultimoPrecio": 5.98,
      "ultimaFecha": "2026-10-01T09:45:00-03:00",
      "competidores": [
        {
          "nombre": "SANQUILCO SOCIEDAD ANONIMA",
          "nroDoc": "217009690015",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 5.98,
      "explicacion": "Con pocas adjudicaciones previas, tomamos la mediana como referencia."
    },
    {
      "nroItem": 3,
      "idArticulo": 15364,
      "descripcion": "ALAMBRE GALVANIZADO OVALADO ALTO CARBONO",
      "moneda": "UYU",
      "unidad": "M",
      "n": 0,
      "p25": null,
      "mediana": null,
      "p75": null,
      "minimo": null,
      "maximo": null,
      "ultimoGanador": null,
      "ultimoPrecio": null,
      "ultimaFecha": null,
      "competidores": [],
      "precioSugerido": null,
      "explicacion": null
    }
  ],
  "1380047": [
    {
      "nroItem": 7,
      "idArticulo": 12536,
      "descripcion": "CHAPA DE COMPENSADO FENOLICO",
      "moneda": "UYU",
      "unidad": "UNIDAD",
      "n": 4,
      "p25": 1060.02,
      "mediana": 1316.11,
      "p75": 1659.22,
      "minimo": 693.4426,
      "maximo": 2286.89,
      "ultimoGanador": "LAGO DORVAL S A",
      "ultimoPrecio": 693.4426,
      "ultimaFecha": "2026-10-07T15:20:00-03:00",
      "competidores": [
        {
          "nombre": "LAGO DORVAL S A",
          "nroDoc": "215263770010",
          "vecesAdjudicado": 2,
          "vecesOferto": 0
        },
        {
          "nombre": "MIDOLIR SOCIEDAD ANONIMA",
          "nroDoc": "216588680019",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        },
        {
          "nombre": "DISTRIMORE SOCIEDAD POR ACCIONES SIMPLIFICADAS",
          "nroDoc": "020576520017",
          "vecesAdjudicado": 1,
          "vecesOferto": 0
        }
      ],
      "precioSugerido": 1060.02,
      "explicacion": "Sugerimos ofertar cerca del percentil 25 de los precios ganadores: quedás competitivo sin regalar margen."
    }
  ],
  "i503606": [
    {
      "nroItem": 1,
      "idArticulo": 0,
      "descripcion": "BALASTO (30 CAMIONES)",
      "moneda": "UYU",
      "unidad": "CAMION",
      "n": 0,
      "p25": null,
      "mediana": null,
      "p75": null,
      "minimo": null,
      "maximo": null,
      "ultimoGanador": null,
      "ultimoPrecio": null,
      "ultimaFecha": null,
      "competidores": [],
      "precioSugerido": null,
      "explicacion": null
    }
  ],
  "i503656": [
    {
      "nroItem": 1,
      "idArticulo": 0,
      "descripcion": "MEMBRANA LIQUIDA IMPERMEABILIZANTE C/CAUCHO",
      "moneda": "UYU",
      "unidad": "VER ANEXO",
      "n": 0,
      "p25": null,
      "mediana": null,
      "p75": null,
      "minimo": null,
      "maximo": null,
      "ultimoGanador": null,
      "ultimoPrecio": null,
      "ultimaFecha": null,
      "competidores": [],
      "precioSugerido": null,
      "explicacion": null
    }
  ]
};
