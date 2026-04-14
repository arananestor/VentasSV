import { generateItemHTML } from '../../src/utils/ticketPrinter';

describe('generateItemHTML', () => {
  it('complete item contains all fields', () => {
    // Arrange
    const item = { productName: 'Pupusa', size: 'Grande', quantity: 2, extras: ['Queso'], note: 'sin chile', subtotal: 3.00 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).toContain('Pupusa');
    expect(html).toContain('Grande');
    expect(html).toContain('CANTIDAD: 2');
    expect(html).toContain('Queso');
    expect(html).toContain('sin chile');
    expect(html).toContain('$3.00');
  });

  it('item without extras omits extras section', () => {
    // Arrange
    const item = { productName: 'Soda', size: '', quantity: 1, extras: [], subtotal: 1.00 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).not.toContain('EXTRAS');
    expect(html).toContain('Soda');
  });

  it('item without note omits note', () => {
    // Arrange
    const item = { productName: 'Tamal', quantity: 1, note: '', subtotal: 0.75 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).not.toContain('📝');
    expect(html).toContain('Tamal');
  });

  it('item without size omits size div', () => {
    // Arrange
    const item = { productName: 'Pan', size: '', quantity: 1, subtotal: 0.25 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).not.toContain('product-size');
  });

  it('item with size includes size div', () => {
    // Arrange
    const item = { productName: 'Pupusa', size: 'Normal', quantity: 1, subtotal: 0.50 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).toContain('Normal');
    expect(html).toContain('product-size');
  });

  it('defaults quantity to 1', () => {
    // Arrange
    const item = { productName: 'Test', subtotal: 1.00 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).toContain('CANTIDAD: 1');
  });

  it('handles object extras with name property', () => {
    // Arrange
    const item = { productName: 'A', extras: [{ name: 'Guac' }, { name: 'Crema' }], subtotal: 2.00 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).toContain('Guac');
    expect(html).toContain('Crema');
  });

  it('shows subtotal formatted to 2 decimals', () => {
    // Arrange
    const item = { productName: 'X', subtotal: 1.5 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).toContain('$1.50');
  });

  it('1-item sale generates 1 item section', () => {
    // Arrange
    const item = { productName: 'Solo', subtotal: 5.00 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).toContain('Solo');
    expect((html.match(/product-name/g) || []).length).toBe(1);
  });

  it('renders note with emoji prefix', () => {
    // Arrange
    const item = { productName: 'A', note: 'extra fría', subtotal: 1.00 };
    // Act
    const html = generateItemHTML(item);
    // Assert
    expect(html).toContain('📝 extra fría');
  });
});
