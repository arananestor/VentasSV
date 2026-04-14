import { buildTicketMessage, buildItemLines } from '../../src/utils/businessConfig';

describe('buildItemLines', () => {
  it('item with extras includes extras line', () => {
    // Arrange
    const item = { productName: 'Pupusa', size: 'Grande', quantity: 2, extras: ['Queso'], subtotal: 3.00 };
    // Act
    const lines = buildItemLines(item);
    // Assert
    expect(lines.some(l => l.includes('Queso'))).toBe(true);
  });

  it('item without extras omits extras line', () => {
    // Arrange
    const item = { productName: 'Soda', size: '', quantity: 1, extras: [], subtotal: 1.00 };
    // Act
    const lines = buildItemLines(item);
    // Assert
    expect(lines.some(l => l.includes('Extras'))).toBe(false);
  });

  it('item with note includes note line', () => {
    // Arrange
    const item = { productName: 'A', note: 'sin sal', subtotal: 1.00 };
    // Act
    const lines = buildItemLines(item);
    // Assert
    expect(lines.some(l => l.includes('sin sal'))).toBe(true);
  });

  it('item without note omits note line', () => {
    // Arrange
    const item = { productName: 'A', note: '', subtotal: 1.00 };
    // Act
    const lines = buildItemLines(item);
    // Assert
    expect(lines.some(l => l.includes('📝'))).toBe(false);
  });
});

describe('buildTicketMessage', () => {
  it('1 item: contains productName, orderNumber, total', () => {
    // Arrange
    const sale = { orderNumber: '0001', items: [{ productName: 'Pupusa', size: 'Normal', quantity: 1, subtotal: 0.50 }], total: 0.50, paymentMethod: 'cash' };
    // Act
    const encoded = buildTicketMessage(sale);
    const msg = decodeURIComponent(encoded);
    // Assert
    expect(msg).toContain('Pupusa');
    expect(msg).toContain('#0001');
    expect(msg).toContain('$0.50');
  });

  it('3 items: contains all 3 productNames', () => {
    // Arrange
    const sale = { orderNumber: '0002', items: [
      { productName: 'Pupusa', size: '', quantity: 1, subtotal: 0.50 },
      { productName: 'Soda', size: '', quantity: 1, subtotal: 1.00 },
      { productName: 'Tamal', size: '', quantity: 2, subtotal: 1.50 },
    ], total: 3.00, paymentMethod: 'cash' };
    // Act
    const msg = decodeURIComponent(buildTicketMessage(sale));
    // Assert
    expect(msg).toContain('Pupusa');
    expect(msg).toContain('Soda');
    expect(msg).toContain('Tamal');
  });

  it('cash payment reflects Efectivo', () => {
    // Arrange
    const sale = { items: [{ productName: 'A', subtotal: 1.00 }], total: 1.00, paymentMethod: 'cash' };
    // Act
    const msg = decodeURIComponent(buildTicketMessage(sale));
    // Assert
    expect(msg).toContain('Efectivo');
  });

  it('transfer payment reflects Transferencia', () => {
    // Arrange
    const sale = { items: [{ productName: 'A', subtotal: 1.00 }], total: 1.00, paymentMethod: 'transfer' };
    // Act
    const msg = decodeURIComponent(buildTicketMessage(sale));
    // Assert
    expect(msg).toContain('Transferencia');
  });

  it('returns URL-encoded string', () => {
    // Arrange
    const sale = { orderNumber: '0001', items: [{ productName: 'Test', subtotal: 1.00 }], total: 1.00, paymentMethod: 'cash' };
    // Act
    const encoded = buildTicketMessage(sale);
    // Assert
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('\n');
  });

  it('includes gracias message', () => {
    // Arrange
    const sale = { items: [{ productName: 'A', subtotal: 1.00 }], total: 1.00, paymentMethod: 'cash' };
    // Act
    const msg = decodeURIComponent(buildTicketMessage(sale));
    // Assert
    expect(msg).toContain('Gracias');
  });
});
