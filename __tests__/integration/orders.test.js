import {
  STATUS,
  STATUS_KEYS,
  filterByStatus,
  getNextStatus,
  getPrevStatus,
  isValidUnit,
} from '../../src/utils/orderLogic';

const mockOrders = [
  {
    id: '1',
    orderStatus: 'new',
    productName: 'Pupusa',
    units: [{ ingredients: [{ name: 'Chicharrón', color: '#FF6B6B' }], extras: [], note: '' }],
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    orderStatus: 'processing',
    productName: 'Minuta',
    units: [{ ingredients: [], extras: [], note: 'Sin chile' }],
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    orderStatus: 'done',
    productName: 'Horchata',
    units: [{ ingredients: [], extras: [], note: '' }],
    timestamp: new Date().toISOString(),
  },
];

describe('comandas — filterByStatus', () => {
  it('filtra pedidos nuevos', () => {
    // Arrange
    const orders = mockOrders;

    // Act
    const result = filterByStatus(orders, 'new');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filtra pedidos en proceso', () => {
    // Arrange
    const orders = mockOrders;

    // Act
    const result = filterByStatus(orders, 'processing');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filtra pedidos listos', () => {
    // Arrange
    const orders = mockOrders;

    // Act
    const result = filterByStatus(orders, 'done');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('retorna vacío si no hay pedidos del status dado', () => {
    // Arrange
    const orders = mockOrders.filter(o => o.orderStatus !== 'done');

    // Act
    const result = filterByStatus(orders, 'done');

    // Assert
    expect(result).toHaveLength(0);
  });

  it('pedido sin orderStatus se trata como new', () => {
    // Arrange
    const orders = [{ id: '99', productName: 'Tamal' }]; // sin orderStatus

    // Act
    const result = filterByStatus(orders, 'new');

    // Assert
    expect(result).toHaveLength(1);
  });
});

describe('comandas — transiciones de estado', () => {
  describe('getNextStatus', () => {
    it('avanza new → processing', () => {
      // Arrange
      const currentStatus = 'new';

      // Act
      const result = getNextStatus(currentStatus);

      // Assert
      expect(result).toBe('processing');
    });

    it('avanza processing → done', () => {
      // Arrange
      const currentStatus = 'processing';

      // Act
      const result = getNextStatus(currentStatus);

      // Assert
      expect(result).toBe('done');
    });

    it('done no tiene siguiente estado (retorna null)', () => {
      // Arrange
      const currentStatus = 'done';

      // Act
      const result = getNextStatus(currentStatus);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getPrevStatus', () => {
    it('retrocede processing → new', () => {
      // Arrange
      const currentStatus = 'processing';

      // Act
      const result = getPrevStatus(currentStatus);

      // Assert
      expect(result).toBe('new');
    });

    it('retrocede done → processing', () => {
      // Arrange
      const currentStatus = 'done';

      // Act
      const result = getPrevStatus(currentStatus);

      // Assert
      expect(result).toBe('processing');
    });

    it('new no tiene estado previo (retorna null)', () => {
      // Arrange
      const currentStatus = 'new';

      // Act
      const result = getPrevStatus(currentStatus);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('STATUS y STATUS_KEYS', () => {
    it('STATUS tiene exactamente 3 estados', () => {
      // Arrange / Act
      const keys = Object.keys(STATUS);

      // Assert
      expect(keys).toHaveLength(3);
    });

    it('STATUS_KEYS contiene new, processing y done', () => {
      // Arrange / Act
      const keys = STATUS_KEYS;

      // Assert
      expect(keys).toContain('new');
      expect(keys).toContain('processing');
      expect(keys).toContain('done');
    });

    it('cada estado tiene label y color', () => {
      // Arrange / Act
      const missingFields = Object.values(STATUS).filter(s => !s.label || !s.color);

      // Assert
      expect(missingFields).toHaveLength(0);
    });
  });
});

describe('comandas — isValidUnit', () => {
  it('objeto con ingredients es válido', () => {
    // Arrange
    const unit = { ingredients: [{ name: 'Chicharrón' }], extras: [], note: '' };

    // Act
    const result = isValidUnit(unit);

    // Assert
    expect(result).toBe(true);
  });

  it('objeto vacío es considerado válido (es object)', () => {
    // Arrange
    const unit = {};

    // Act
    const result = isValidUnit(unit);

    // Assert
    expect(result).toBe(true);
  });

  it('null no es válido', () => {
    // Arrange
    const unit = null;

    // Act
    const result = isValidUnit(unit);

    // Assert
    expect(result).toBe(false);
  });

  it('undefined no es válido', () => {
    // Arrange
    const unit = undefined;

    // Act
    const result = isValidUnit(unit);

    // Assert
    expect(result).toBe(false);
  });

  it('string no es válido como unidad', () => {
    // Arrange
    const unit = 'not-an-object';

    // Act
    const result = isValidUnit(unit);

    // Assert
    expect(result).toBe(false);
  });
});

describe('comandas — estructura de unidades', () => {
  it('cada unidad del pedido tiene ingredients, extras y note', () => {
    // Arrange
    const orders = mockOrders;

    // Act
    const unitsWithMissingFields = orders.flatMap(o => o.units).filter(
      u => !Object.prototype.hasOwnProperty.call(u, 'ingredients') ||
           !Object.prototype.hasOwnProperty.call(u, 'extras') ||
           !Object.prototype.hasOwnProperty.call(u, 'note')
    );

    // Assert
    expect(unitsWithMissingFields).toHaveLength(0);
  });

  it('ingredients siempre es un array', () => {
    // Arrange
    const units = mockOrders.flatMap(o => o.units);

    // Act
    const nonArrayIngredients = units.filter(u => !Array.isArray(u.ingredients));

    // Assert
    expect(nonArrayIngredients).toHaveLength(0);
  });

  it('nota de unidad puede estar vacía o tener texto', () => {
    // Arrange
    const unitWithNote = mockOrders[1].units[0]; // 'Sin chile'
    const unitWithoutNote = mockOrders[0].units[0]; // ''

    // Act
    const hasNote = unitWithNote.note.length > 0;
    const emptyNote = unitWithoutNote.note.length === 0;

    // Assert
    expect(hasNote).toBe(true);
    expect(emptyNote).toBe(true);
  });

  it('acceder a un índice fuera de rango retorna undefined (no crashea)', () => {
    // Arrange
    const units = mockOrders[0].units;

    // Act
    const outOfRange = units[99];

    // Assert
    expect(outOfRange).toBeUndefined();
  });
});
