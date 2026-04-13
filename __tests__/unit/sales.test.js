import {
  filterTodaySales,
  formatOrderNumber,
  calculateChange,
  getChangeLabel,
  buildSaleData,
} from '../../src/utils/salesLogic';
import { methodLabel } from '../../src/utils/formatters';

const mockSales = [
  { id: '1', total: 5.00, timestamp: new Date().toISOString(), orderStatus: 'done', paymentMethod: 'cash', workerName: 'Ana' },
  { id: '2', total: 12.50, timestamp: new Date().toISOString(), orderStatus: 'done', paymentMethod: 'transfer', workerName: 'Luis' },
  { id: '3', total: 3.25, timestamp: new Date().toISOString(), orderStatus: 'new', paymentMethod: 'cash', workerName: 'Ana' },
];

describe('filterTodaySales', () => {
  it('retorna ventas de hoy', () => {
    // Arrange
    const sales = mockSales;

    // Act
    const result = filterTodaySales(sales);

    // Assert
    expect(result).toHaveLength(3);
  });

  it('excluye ventas de ayer', () => {
    // Arrange
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const sales = [...mockSales, { id: '99', total: 10, timestamp: yesterday.toISOString() }];

    // Act
    const result = filterTodaySales(sales);

    // Assert
    expect(result).toHaveLength(3);
    expect(result.find(s => s.id === '99')).toBeUndefined();
  });

  it('retorna array vacío si no hay ventas de hoy', () => {
    // Arrange
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const sales = [{ id: '1', total: 5, timestamp: yesterday.toISOString() }];

    // Act
    const result = filterTodaySales(sales);

    // Assert
    expect(result).toHaveLength(0);
  });

  it('no muta el array original', () => {
    // Arrange
    const sales = [...mockSales];
    const originalLength = sales.length;

    // Act
    filterTodaySales(sales);

    // Assert
    expect(sales).toHaveLength(originalLength);
  });
});

describe('formatOrderNumber', () => {
  it('formatea número 1 como 0001', () => {
    // Arrange
    const num = 1;

    // Act
    const result = formatOrderNumber(num);

    // Assert
    expect(result).toBe('0001');
  });

  it('formatea número 100 como 0100', () => {
    // Arrange
    const num = 100;

    // Act
    const result = formatOrderNumber(num);

    // Assert
    expect(result).toBe('0100');
  });

  it('número 9999 no necesita relleno', () => {
    // Arrange
    const num = 9999;

    // Act
    const result = formatOrderNumber(num);

    // Assert
    expect(result).toBe('9999');
  });

  it('siempre retorna string de 4 caracteres', () => {
    // Arrange
    const num = 42;

    // Act
    const result = formatOrderNumber(num);

    // Assert
    expect(result).toHaveLength(4);
  });
});

describe('calculateChange', () => {
  it('calcula vuelto correctamente', () => {
    // Arrange
    const cashGiven = 10.00;
    const total = 7.50;

    // Act
    const change = calculateChange(cashGiven, total);

    // Assert
    expect(parseFloat(change.toFixed(2))).toBe(2.50);
  });

  it('pago exacto resulta en 0', () => {
    // Arrange
    const cashGiven = 5.00;
    const total = 5.00;

    // Act
    const change = calculateChange(cashGiven, total);

    // Assert
    expect(change).toBe(0);
  });

  it('dinero insuficiente resulta en negativo', () => {
    // Arrange
    const cashGiven = 3.00;
    const total = 5.00;

    // Act
    const change = calculateChange(cashGiven, total);

    // Assert
    expect(change).toBeLessThan(0);
    expect(change).toBe(-2.00);
  });
});

describe('getChangeLabel', () => {
  it('vuelto positivo → VUELTO', () => {
    // Arrange
    const change = 2.50;

    // Act
    const label = getChangeLabel(change);

    // Assert
    expect(label).toBe('VUELTO');
  });

  it('pago exacto → EXACTO', () => {
    // Arrange
    const change = 0;

    // Act
    const label = getChangeLabel(change);

    // Assert
    expect(label).toBe('EXACTO');
  });

  it('falta dinero → FALTA', () => {
    // Arrange
    const change = -1;

    // Act
    const label = getChangeLabel(change);

    // Assert
    expect(label).toBe('FALTA');
  });
});

describe('buildSaleData', () => {
  it('incluye todos los campos requeridos', () => {
    // Arrange
    const sale = { productId: 'p1', productName: 'Pupusa', total: 1.50, paymentMethod: 'cash' };
    const orderNumber = '0001';

    // Act
    const result = buildSaleData(sale, orderNumber);

    // Assert
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('orderNumber');
    expect(result).toHaveProperty('orderStatus');
    expect(result).toHaveProperty('timestamp');
  });

  it('orderStatus siempre es new al crearse', () => {
    // Arrange
    const sale = { productName: 'Horchata', total: 1.00 };

    // Act
    const result = buildSaleData(sale, '0002');

    // Assert
    expect(result.orderStatus).toBe('new');
  });

  it('preserva el orderNumber pasado', () => {
    // Arrange
    const sale = { productName: 'Tamal', total: 0.75 };
    const orderNumber = '0042';

    // Act
    const result = buildSaleData(sale, orderNumber);

    // Assert
    expect(result.orderNumber).toBe('0042');
  });

  it('timestamp es una fecha válida', () => {
    // Arrange
    const sale = { total: 2.00 };

    // Act
    const result = buildSaleData(sale, '0001');

    // Assert
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});

describe('methodLabel — formatters', () => {
  it('cash → Efectivo', () => {
    // Arrange
    const method = 'cash';

    // Act
    const label = methodLabel(method);

    // Assert
    expect(label).toBe('Efectivo');
  });

  it('transfer → Transferencia', () => {
    // Arrange
    const method = 'transfer';

    // Act
    const label = methodLabel(method);

    // Assert
    expect(label).toBe('Transferencia');
  });

  it('card → Tarjeta', () => {
    // Arrange
    const method = 'card';

    // Act
    const label = methodLabel(method);

    // Assert
    expect(label).toBe('Tarjeta');
  });

  it('método desconocido retorna el mismo método', () => {
    // Arrange
    const method = 'bitcoin';

    // Act
    const label = methodLabel(method);

    // Assert
    expect(label).toBe('bitcoin');
  });
});
