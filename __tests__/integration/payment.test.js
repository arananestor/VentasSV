import {
  canCompletePayment,
  calculateChange,
  getChangeLabel,
  buildSaleData,
} from '../../src/utils/salesLogic';
import {
  calculateCartTotal,
  addItemToCart,
  removeItemFromCart,
  clearCart,
} from '../../src/utils/cartLogic';
import { methodLabel } from '../../src/utils/formatters';

const cart = [
  { cartId: '1', product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Normal' }, quantity: 2, total: 1.00, units: [], extras: [], note: '' },
  { cartId: '2', product: { id: 'p2', name: 'Horchata' }, size: { name: 'Grande' }, quantity: 1, total: 1.50, units: [], extras: [], note: '' },
];

describe('canCompletePayment', () => {
  it('cash con monto exacto puede completar', () => {
    // Arrange
    const method = 'cash';
    const effective = 5;
    const total = 5;

    // Act
    const result = canCompletePayment(method, effective, total);

    // Assert
    expect(result).toBe(true);
  });

  it('cash con vuelto puede completar', () => {
    // Arrange
    const method = 'cash';
    const effective = 10;
    const total = 5;

    // Act
    const result = canCompletePayment(method, effective, total);

    // Assert
    expect(result).toBe(true);
  });

  it('cash insuficiente no puede completar', () => {
    // Arrange
    const method = 'cash';
    const effective = 3;
    const total = 5;

    // Act
    const result = canCompletePayment(method, effective, total);

    // Assert
    expect(result).toBe(false);
  });

  it('transfer siempre puede completar', () => {
    // Arrange
    const method = 'transfer';
    const effective = 0;
    const total = 5;

    // Act
    const result = canCompletePayment(method, effective, total);

    // Assert
    expect(result).toBe(true);
  });

  it('sin método no puede completar', () => {
    // Arrange
    const method = null;
    const effective = 5;
    const total = 5;

    // Act
    const result = canCompletePayment(method, effective, total);

    // Assert
    expect(result).toBe(false);
  });

  it('método desconocido no puede completar', () => {
    // Arrange
    const method = 'crypto';
    const effective = 100;
    const total = 5;

    // Act
    const result = canCompletePayment(method, effective, total);

    // Assert
    expect(result).toBe(false);
  });
});

describe('calculateChange y getChangeLabel', () => {
  it('vuelto positivo con pago mayor al total', () => {
    // Arrange
    const cashGiven = 10;
    const total = 7.50;

    // Act
    const change = calculateChange(cashGiven, total);
    const label = getChangeLabel(change);

    // Assert
    expect(parseFloat(change.toFixed(2))).toBe(2.50);
    expect(label).toBe('VUELTO');
  });

  it('pago exacto resulta en 0 y label EXACTO', () => {
    // Arrange
    const cashGiven = 5;
    const total = 5;

    // Act
    const change = calculateChange(cashGiven, total);
    const label = getChangeLabel(change);

    // Assert
    expect(change).toBe(0);
    expect(label).toBe('EXACTO');
  });

  it('falta dinero resulta en negativo y label FALTA', () => {
    // Arrange
    const cashGiven = 3;
    const total = 5;

    // Act
    const change = calculateChange(cashGiven, total);
    const label = getChangeLabel(change);

    // Assert
    expect(change).toBe(-2);
    expect(label).toBe('FALTA');
  });
});

describe('procesamiento del carrito en flujo de pago', () => {
  it('calculateCartTotal suma todos los items', () => {
    // Arrange
    const items = cart;

    // Act
    const total = calculateCartTotal(items);

    // Assert
    expect(total).toBeCloseTo(2.50);
  });

  it('addItemToCart agrega item al carrito', () => {
    // Arrange
    const items = [...cart];
    const newItem = { product: { id: 'p3' }, total: 0.75 };

    // Act
    const updated = addItemToCart(items, newItem);

    // Assert
    expect(updated).toHaveLength(3);
  });

  it('removeItemFromCart elimina item antes del pago', () => {
    // Arrange
    const items = cart;

    // Act
    const updated = removeItemFromCart(items, '1');

    // Assert
    expect(updated).toHaveLength(1);
    expect(updated.find(i => i.cartId === '1')).toBeUndefined();
  });

  it('clearCart vacía el carrito después del pago', () => {
    // Arrange
    const items = cart;

    // Act
    const result = clearCart(items);

    // Assert
    expect(result).toHaveLength(0);
  });

  it('total se recalcula a 0 después de clearCart', () => {
    // Arrange
    const items = cart;

    // Act
    const emptied = clearCart(items);
    const total = calculateCartTotal(emptied);

    // Assert
    expect(total).toBe(0);
  });
});

describe('buildSaleData — construcción de datos de venta', () => {
  it('incluye todos los campos requeridos', () => {
    // Arrange
    const saleInput = {
      productId: 'p1',
      productName: 'Pupusa',
      total: 1.00,
      paymentMethod: 'cash',
      workerId: 'owner',
      workerName: 'Carlos',
    };

    // Act
    const result = buildSaleData(saleInput, '0001');

    // Assert
    ['id', 'orderNumber', 'orderStatus', 'timestamp'].forEach(field => {
      expect(result).toHaveProperty(field);
    });
  });

  it('orderStatus siempre empieza en new', () => {
    // Arrange
    const saleInput = { productName: 'Pupusa', total: 0.50 };

    // Act
    const result = buildSaleData(saleInput, '0001');

    // Assert
    expect(result.orderStatus).toBe('new');
  });

  it('preserva el orderNumber', () => {
    // Arrange
    const saleInput = { productName: 'Horchata', total: 1.50 };
    const orderNumber = '0042';

    // Act
    const result = buildSaleData(saleInput, orderNumber);

    // Assert
    expect(result.orderNumber).toBe('0042');
  });

  it('nota del item se preserva en los datos de venta', () => {
    // Arrange
    const saleInput = {
      productId: 'p1',
      productName: 'Pupusa',
      total: 1.00,
      paymentMethod: 'cash',
      note: 'Sin curtido',
    };

    // Act
    const result = buildSaleData(saleInput, '0001');

    // Assert
    expect(result.note).toBe('Sin curtido');
  });

  it('workerName Sin asignar cuando no hay worker', () => {
    // Arrange
    const saleInput = {
      productName: 'Tamal',
      total: 0.75,
      workerName: 'Sin asignar',
    };

    // Act
    const result = buildSaleData(saleInput, '0001');

    // Assert
    expect(result.workerName).toBe('Sin asignar');
  });
});

describe('methodLabel — etiqueta del método de pago', () => {
  it('cash muestra Efectivo', () => {
    // Arrange
    const method = 'cash';

    // Act
    const label = methodLabel(method);

    // Assert
    expect(label).toBe('Efectivo');
  });

  it('transfer muestra Transferencia', () => {
    // Arrange
    const method = 'transfer';

    // Act
    const label = methodLabel(method);

    // Assert
    expect(label).toBe('Transferencia');
  });

  it('card muestra Tarjeta', () => {
    // Arrange
    const method = 'card';

    // Act
    const label = methodLabel(method);

    // Assert
    expect(label).toBe('Tarjeta');
  });
});
