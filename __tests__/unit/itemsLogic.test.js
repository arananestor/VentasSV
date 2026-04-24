import { buildSaleItem, buildMultiItemSaleData, getSaleItemCount, getSaleSummary, validateSale } from '../../src/utils/itemsLogic';

describe('buildSaleItem', () => {
  it('builds item from complete cartItem', () => {
    // Arrange
    const cartItem = { product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Grande' }, quantity: 2, units: [{ note: '' }], extras: ['Queso'], note: 'sin chile', total: 3.00, cartId: 'c1' };
    // Act
    const item = buildSaleItem(cartItem);
    // Assert
    expect(item.productName).toBe('Pupusa');
    expect(item.size).toBe('Grande');
    expect(item.quantity).toBe(2);
    expect(item.subtotal).toBe(3.00);
    expect(item.cartId).toBeUndefined();
  });

  it('uses defaults for missing fields', () => {
    // Arrange
    const cartItem = { product: { id: 'p2', name: 'Soda' }, total: 1.00 };
    // Act
    const item = buildSaleItem(cartItem);
    // Assert
    expect(item.size).toBe('');
    expect(item.extras).toEqual([]);
    expect(item.units).toEqual([]);
    expect(item.note).toBe('');
  });

  it('derives subtotal from total', () => {
    // Arrange
    const cartItem = { product: { id: 'p3' }, total: 5.50 };
    // Act
    const item = buildSaleItem(cartItem);
    // Assert
    expect(item.subtotal).toBe(5.50);
  });
});

describe('buildMultiItemSaleData', () => {
  it('builds from 1-item cart', () => {
    // Arrange
    const cart = [{ product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Normal' }, quantity: 1, total: 0.50 }];
    // Act
    const data = buildMultiItemSaleData({ cart, paymentMethod: 'cash', cashGiven: 1.00, change: 0.50, voucherImage: null, worker: { id: 'owner', name: 'Carlos' }, geo: null });
    // Assert
    expect(data.items).toHaveLength(1);
    expect(data.total).toBeCloseTo(0.50);
  });

  it('builds from 3-item cart with correct total', () => {
    // Arrange
    const cart = [
      { product: { id: 'p1', name: 'A' }, total: 1.00 },
      { product: { id: 'p2', name: 'B' }, total: 2.00 },
      { product: { id: 'p3', name: 'C' }, total: 3.00 },
    ];
    // Act
    const data = buildMultiItemSaleData({ cart, paymentMethod: 'transfer', worker: { id: '1', name: 'Ana' }, geo: null });
    // Assert
    expect(data.items).toHaveLength(3);
    expect(data.total).toBeCloseTo(6.00);
  });

  it('preserves worker, geo, payment fields', () => {
    // Arrange
    const cart = [{ product: { id: 'p1' }, total: 1.00 }];
    const geo = { latitude: 13.69, longitude: -89.22, accuracy: 10 };
    // Act
    const data = buildMultiItemSaleData({ cart, paymentMethod: 'cash', cashGiven: 5.00, change: 4.00, voucherImage: 'img.jpg', worker: { id: 'owner', name: 'Carlos' }, geo });
    // Assert
    expect(data.workerId).toBe('owner');
    expect(data.workerName).toBe('Carlos');
    expect(data.geo).toEqual(geo);
    expect(data.paymentMethod).toBe('cash');
    expect(data.cashGiven).toBe(5.00);
    expect(data.change).toBe(4.00);
    expect(data.voucherImage).toBe('img.jpg');
  });

  it('handles null geo', () => {
    // Arrange
    const cart = [{ product: { id: 'p1' }, total: 1.00 }];
    // Act
    const data = buildMultiItemSaleData({ cart, paymentMethod: 'cash', worker: null, geo: null });
    // Assert
    expect(data.geo).toBeNull();
  });

  it('handles null worker', () => {
    // Arrange
    const cart = [{ product: { id: 'p1' }, total: 1.00 }];
    // Act
    const data = buildMultiItemSaleData({ cart, paymentMethod: 'cash', worker: null, geo: null });
    // Assert
    expect(data.workerId).toBeNull();
    expect(data.workerName).toBe('Sin asignar');
  });
});

describe('getSaleItemCount', () => {
  it('single item with quantity 3', () => {
    // Arrange
    const sale = { items: [{ quantity: 3 }] };
    // Act
    const count = getSaleItemCount(sale);
    // Assert
    expect(count).toBe(3);
  });

  it('multiple items sums quantities', () => {
    // Arrange
    const sale = { items: [{ quantity: 2 }, { quantity: 1 }, { quantity: 4 }] };
    // Act
    const count = getSaleItemCount(sale);
    // Assert
    expect(count).toBe(7);
  });
});

describe('getSaleSummary', () => {
  it('1 item returns productName', () => {
    // Arrange
    const sale = { items: [{ productName: 'Pupusa' }] };
    // Act
    const summary = getSaleSummary(sale);
    // Assert
    expect(summary).toBe('Pupusa');
  });

  it('3 items returns "X +2"', () => {
    // Arrange
    const sale = { items: [{ productName: 'Coca cola' }, { productName: 'Soda' }, { productName: 'Tamal' }] };
    // Act
    const summary = getSaleSummary(sale);
    // Assert
    expect(summary).toBe('Coca cola +2');
  });
});

describe('validateSale', () => {
  it('throws on empty items', () => {
    // Arrange
    const sale = { items: [], total: 0 };
    // Act / Assert
    expect(() => validateSale(sale)).toThrow('Sale requires non-empty items[]');
  });

  it('throws on mismatched total', () => {
    // Arrange
    const sale = { items: [{ subtotal: 1.00 }, { subtotal: 2.00 }], total: 10.00 };
    // Act / Assert
    expect(() => validateSale(sale)).toThrow('does not match');
  });

  it('does not throw on valid sale', () => {
    // Arrange
    const sale = { items: [{ subtotal: 1.50 }, { subtotal: 2.50 }], total: 4.00 };
    // Act / Assert
    expect(() => validateSale(sale)).not.toThrow();
  });
});
