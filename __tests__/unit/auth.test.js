import { generatePin, PUESTOS, PUESTO_ICONS } from '../../src/context/AuthContext';

describe('generatePin', () => {
  it('siempre genera exactamente 4 dígitos', () => {
    for (let i = 0; i < 100; i++) {
      expect(generatePin()).toHaveLength(4);
    }
  });

  it('solo contiene dígitos numéricos', () => {
    for (let i = 0; i < 100; i++) {
      expect(/^\d{4}$/.test(generatePin())).toBe(true);
    }
  });

  it('genera valores entre 1000 y 9999', () => {
    for (let i = 0; i < 100; i++) {
      const pin = parseInt(generatePin());
      expect(pin).toBeGreaterThanOrEqual(1000);
      expect(pin).toBeLessThanOrEqual(9999);
    }
  });

  it('tiene aleatoriedad — no siempre el mismo PIN', () => {
    const pins = new Set();
    for (let i = 0; i < 20; i++) pins.add(generatePin());
    expect(pins.size).toBeGreaterThan(1);
  });
});

describe('PUESTOS', () => {
  it('contiene exactamente 5 puestos', () => {
    expect(PUESTOS).toHaveLength(5);
  });

  it('contiene todos los puestos requeridos', () => {
    expect(PUESTOS).toContain('Cajero');
    expect(PUESTOS).toContain('Cocinero');
    expect(PUESTOS).toContain('Motorista');
    expect(PUESTOS).toContain('Camarero');
    expect(PUESTOS).toContain('Co-Administrador');
  });

  it('ningún puesto está vacío', () => {
    PUESTOS.forEach(p => expect(p.trim()).not.toBe(''));
  });
});

describe('PUESTO_ICONS', () => {
  it('tiene ícono para cada puesto', () => {
    PUESTOS.forEach(puesto => expect(PUESTO_ICONS[puesto]).toBeDefined());
  });

  it('tiene ícono para Dueño', () => {
    expect(PUESTO_ICONS['Dueño']).toBeDefined();
  });

  it('ningún ícono está vacío', () => {
    Object.values(PUESTO_ICONS).forEach(icon => expect(icon.trim()).not.toBe(''));
  });
});
