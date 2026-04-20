const ADJECTIVES = [
  'Veloz', 'Dorado', 'Nocturno', 'Express', 'Secreto',
  'Tropical', 'Épico', 'Fresco', 'Brillante', 'Supremo',
  'Salvaje', 'Místico', 'Radiante', 'Fugaz', 'Ardiente',
  'Celeste', 'Vibrante', 'Intrépido', 'Luminoso', 'Audaz',
  'Sereno', 'Cósmico', 'Estelar', 'Intenso', 'Glorioso',
];

const NOUNS = [
  'Mango', 'Volcán', 'Quetzal', 'Pupusa', 'Playa',
  'Trueno', 'Jaguar', 'Cascada', 'Cometa', 'Eclipse',
  'Colibrí', 'Coral', 'Cacao', 'Coyote', 'Marimba',
  'Iguana', 'Palma', 'Ceiba', 'Cenote', 'Ámbar',
  'Orquídea', 'Lava', 'Brisa', 'Aurora', 'Fuego',
];

const generateCatalogName = () => {
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  return `${noun} ${adj}`;
};

module.exports = { generateCatalogName };
