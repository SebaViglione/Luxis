// Datos ilustrativos para los mockups de la landing:
// no representan licitaciones reales ni resultados de la IA.

export type MatchEjemplo = {
  tipo: string;
  objeto: string;
  organismo: string;
  cierraEn: number;
  confianza: number;
  razon: string;
};

export const MATCHES_EJEMPLO: MatchEjemplo[] = [
  {
    tipo: 'Compra Directa',
    objeto: 'Portland, arena gruesa y bloques para refacción de escuela',
    organismo: 'ANEP · Canelones',
    cierraEn: 6,
    confianza: 92,
    razon: 'Vendés 5 de los 6 ítems y entregás en Canelones.',
  },
  {
    tipo: 'Licitación Abreviada',
    objeto: 'Hierro de construcción Ø8 y Ø10, malla electrosoldada',
    organismo: 'Intendencia de Florida',
    cierraEn: 11,
    confianza: 78,
    razon: 'Coinciden 3 ítems de hierro; la malla no está en tu catálogo.',
  },
  {
    tipo: 'Compra Directa',
    objeto: 'Pintura látex exterior y rodillos para policlínica',
    organismo: 'ASSE · Maldonado',
    cierraEn: 4,
    confianza: 71,
    razon: 'Tenés la línea de pinturas; piden entrega en 48 h.',
  },
  {
    tipo: 'Licitación Abreviada',
    objeto: 'Caños PVC sanitarios y accesorios para red de saneamiento',
    organismo: 'OSE · Rivera',
    cierraEn: 15,
    confianza: 84,
    razon: 'Vendés sanitaria y ya ganaste compras parecidas de OSE.',
  },
];

export const ORGANISMOS = [
  'Intendencia de Montevideo',
  'ANEP',
  'ASSE',
  'MTOP',
  'UTE',
  'OSE',
  'Intendencia de Canelones',
  'MEVIR',
  'Universidad de la República',
  'Ministerio del Interior',
  'ANCAP',
  'INAU',
  'Ministerio de Defensa Nacional',
  'Intendencia de Maldonado',
];

export const RUBROS = ['portland', 'arena y pedregullo', 'hierro', 'pintura', 'madera', 'bloques'];
