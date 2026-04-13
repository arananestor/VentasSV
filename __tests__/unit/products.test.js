import {
  isValidProductName,
  isValidPrice,
} from '../../src/utils/validationLogic';
import { getTextColor } from '../../src/utils/colorUtils';

const mockSimple = {
  id: '1', name: 'Coca Cola', type: 'simple',
  sizes: [{ name: 'Normal', price: 1.00 }],
  ingredients: [], extras: [],
};
const mockElaborado = {
  id: '2', name: 'Pupusa de Chicharrón', type: 'elaborado',
  sizes: [{ name: 'Normal', price: 0.50 }, { name: 'Grande', price: 0.75 }],
  ingredients: [
    { name: 'Chicharrón', color: '#FF6B6B', icon: 'food' },
    { name: 'Queso', color: '#FBBF24', icon: 'cheese' },
  ],
  extras: [
    { name: 'Curtido', price: 0.00, color: '#34D399' },
    { name: 'Crema extra', price: 0.25, color: '#60A5FA' },
  ],
};

describe('productos — tipo', () => {
  it('simple no tiene ingredientes', () => {
    // Arrange / Act
    const count = mockSimple.ingredients.length;

    // Assert
    expect(count).toBe(0);
  });

  it('elaborado tiene ingredientes', () => {
    // Arrange / Act
    const count = mockElaborado.ingredients.length;

    // Assert
    expect(count).toBeGreaterThan(0);
  });

  it('tipo es simple o elaborado', () => {
    // Arrange
    const validTypes = ['simple', 'elaborado'];

    // Act
    const simpleValid = validTypes.includes(mockSimple.type);
    const elaboradoValid = validTypes.includes(mockElaborado.type);

    // Assert
    expect(simpleValid).toBe(true);
    expect(elaboradoValid).toBe(true);
  });
});

describe('productos — tamaños y precios', () => {
  it('todo producto tiene al menos un tamaño', () => {
    // Arrange / Act
    const simpleSizes = mockSimple.sizes.length;
    const elaboradoSizes = mockElaborado.sizes.length;

    // Assert
    expect(simpleSizes).toBeGreaterThan(0);
    expect(elaboradoSizes).toBeGreaterThan(0);
  });

  it('isValidPrice: precios positivos son válidos', () => {
    // Arrange
    const prices = mockElaborado.sizes.map(s => s.price);

    // Act
    const allValid = prices.every(p => isValidPrice(p));

    // Assert
    expect(allValid).toBe(true);
  });

  it('isValidPrice: precio es número mayor a 0', () => {
    // Arrange
    const price = 0.50;

    // Act
    const result = isValidPrice(price);

    // Assert
    expect(result).toBe(true);
  });

  it('nombre de tamaño no vacío según isValidProductName', () => {
    // Arrange
    const sizeNames = mockElaborado.sizes.map(s => s.name);

    // Act
    const allValid = sizeNames.every(n => isValidProductName(n));

    // Assert
    expect(allValid).toBe(true);
  });
});

describe('productos — ingredientes', () => {
  it('cada ingrediente tiene nombre no vacío', () => {
    // Arrange
    const ingredients = mockElaborado.ingredients;

    // Act
    const allHaveNames = ingredients.every(ing => isValidProductName(ing.name));

    // Assert
    expect(allHaveNames).toBe(true);
  });

  it('color del ingrediente es hex válido', () => {
    // Arrange
    const ingredients = mockElaborado.ingredients;

    // Act
    const allHexColors = ingredients.every(ing => /^#[0-9A-Fa-f]{6}$/.test(ing.color));

    // Assert
    expect(allHexColors).toBe(true);
  });

  it('getTextColor retorna contraste legible para color del ingrediente', () => {
    // Arrange
    const color = mockElaborado.ingredients[0].color; // '#FF6B6B'

    // Act
    const textColor = getTextColor(color);

    // Assert
    expect(['#000', '#FFF']).toContain(textColor);
  });
});

describe('productos — extras', () => {
  it('precio de extra no es negativo', () => {
    // Arrange
    const extras = mockElaborado.extras;

    // Act
    const allNonNegative = extras.every(ex => ex.price >= 0);

    // Assert
    expect(allNonNegative).toBe(true);
  });

  it('extra gratuito tiene precio 0', () => {
    // Arrange
    const curtido = mockElaborado.extras[0];

    // Act
    const isFree = curtido.price === 0.00;

    // Assert
    expect(isFree).toBe(true);
  });

  it('extra con costo tiene precio válido según isValidPrice', () => {
    // Arrange
    const cremaExtra = mockElaborado.extras[1]; // price: 0.25

    // Act
    const result = isValidPrice(cremaExtra.price);

    // Assert
    expect(result).toBe(true);
  });
});

describe('productos — validaciones al guardar', () => {
  it('isValidProductName: nombre no puede estar vacío', () => {
    // Arrange
    const name = '';

    // Act
    const result = isValidProductName(name);

    // Assert
    expect(result).toBe(false);
  });

  it('isValidProductName: nombre válido pasa', () => {
    // Arrange
    const name = 'Pupusa';

    // Act
    const result = isValidProductName(name);

    // Assert
    expect(result).toBe(true);
  });

  it('isValidPrice: precio 0 no es válido', () => {
    // Arrange
    const price = 0;

    // Act
    const result = isValidPrice(price);

    // Assert
    expect(result).toBe(false);
  });

  it('isValidPrice: precio negativo no es válido', () => {
    // Arrange
    const price = -1;

    // Act
    const result = isValidPrice(price);

    // Assert
    expect(result).toBe(false);
  });
});
