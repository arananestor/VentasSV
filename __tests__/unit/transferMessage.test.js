import { buildTransferMessage } from '../../src/utils/businessConfig';

describe('buildTransferMessage', () => {
  const bankConfig = { bank: 'Agrícola', holder: 'Carlos López', account: '123456789' };

  it('lists all items', () => {
    // Arrange
    const order = { orderNumber: '0001', items: [
      { productName: 'Pupusa', size: 'Grande', quantity: 2, subtotal: 3.00 },
      { productName: 'Soda', size: '', quantity: 1, subtotal: 1.00 },
    ], total: 4.00, paymentMethod: 'transfer' };
    // Act
    const msg = decodeURIComponent(buildTransferMessage(order, bankConfig));
    // Assert
    expect(msg).toContain('Pupusa');
    expect(msg).toContain('Soda');
  });

  it('includes bank info', () => {
    // Arrange
    const order = { items: [{ productName: 'A', subtotal: 1.00 }], total: 1.00 };
    // Act
    const msg = decodeURIComponent(buildTransferMessage(order, bankConfig));
    // Assert
    expect(msg).toContain('Agrícola');
    expect(msg).toContain('Carlos López');
    expect(msg).toContain('123456789');
  });

  it('handles empty bank config gracefully', () => {
    // Arrange
    const order = { items: [{ productName: 'A', subtotal: 1.00 }], total: 1.00 };
    // Act
    const msg = decodeURIComponent(buildTransferMessage(order, {}));
    // Assert
    expect(msg).toContain('comprobante');
  });

  it('shows correct total', () => {
    // Arrange
    const order = { items: [{ productName: 'A', subtotal: 5.50 }], total: 5.50 };
    // Act
    const msg = decodeURIComponent(buildTransferMessage(order, bankConfig));
    // Assert
    expect(msg).toContain('$5.50');
  });

  it('includes orderNumber in header', () => {
    // Arrange
    const order = { orderNumber: '0042', items: [{ productName: 'A', subtotal: 1.00 }], total: 1.00 };
    // Act
    const msg = decodeURIComponent(buildTransferMessage(order, bankConfig));
    // Assert
    expect(msg).toContain('#0042');
  });

  it('returns URL-encoded string', () => {
    // Arrange
    const order = { items: [{ productName: 'Test', subtotal: 1.00 }], total: 1.00 };
    // Act
    const encoded = buildTransferMessage(order, bankConfig);
    // Assert
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('\n');
  });
});
