import { generatePin, PUESTOS, PUESTO_ICONS } from '../../src/context/AuthContext';

describe('generatePin', () => {
  it('genera exactamente 4 dígitos', () => {
    // Arrange / Act
    const pin = generatePin();
    // Assert
    expect(pin).toHaveLength(4);
  });
  it('solo dígitos numéricos', () => {
    // Arrange / Act
    const pin = generatePin();
    // Assert
    expect(/^\d{4}$/.test(pin)).toBe(true);
  });
  it('valores entre 1000 y 9999', () => {
    // Arrange / Act
    const val = parseInt(generatePin(), 10);
    // Assert
    expect(val).toBeGreaterThanOrEqual(1000);
    expect(val).toBeLessThanOrEqual(9999);
  });
  it('tiene aleatoriedad', () => {
    // Arrange
    const pins = new Set();
    // Act
    for (let i = 0; i < 20; i++) pins.add(generatePin());
    // Assert
    expect(pins.size).toBeGreaterThan(1);
  });
  it('retorna string', () => {
    // Arrange / Act
    const pin = generatePin();
    // Assert
    expect(typeof pin).toBe('string');
  });
});

describe('PUESTOS', () => {
  it('contiene 5 puestos', () => {
    // Arrange / Act
    const count = PUESTOS.length;
    // Assert
    expect(count).toBe(5);
  });
  it('contiene todos los requeridos', () => {
    // Arrange
    const required = ['Encargado', 'Cajero', 'Cocinero', 'Motorista', 'Camarero'];
    // Act
    const missing = required.filter(p => !PUESTOS.includes(p));
    // Assert
    expect(missing).toHaveLength(0);
  });
  it('ninguno vacío', () => {
    // Arrange / Act
    const empty = PUESTOS.filter(p => p.trim() === '');
    // Assert
    expect(empty).toHaveLength(0);
  });
});

describe('PUESTO_ICONS', () => {
  it('ícono para cada puesto', () => {
    // Arrange / Act
    const missing = PUESTOS.filter(p => !PUESTO_ICONS[p]);
    // Assert
    expect(missing).toHaveLength(0);
  });
  it('ícono para Dueño', () => {
    // Arrange / Act
    const icon = PUESTO_ICONS['Dueño'];
    // Assert
    expect(icon).toBeDefined();
  });
  it('ningún ícono vacío', () => {
    // Arrange / Act
    const empty = Object.values(PUESTO_ICONS).filter(i => !i || i.trim() === '');
    // Assert
    expect(empty).toHaveLength(0);
  });
  it('ícono para Encargado', () => {
    // Arrange / Act
    const icon = PUESTO_ICONS['Encargado'];
    // Assert
    expect(icon).toBeDefined();
  });
});
