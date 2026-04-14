import { getSaleSummary, getSaleItemCount } from '../../src/utils/itemsLogic';

describe('getSaleSummary', () => {
  it('1 item returns productName', () => {
    // Arrange
    const sale = { items: [{ productName: 'Pupusa de queso con loroco especial' }] };
    // Act
    const result = getSaleSummary(sale);
    // Assert
    expect(result).toBe('Pupusa de queso con loroco especial');
  });

  it('2 items returns X + 1 más', () => {
    // Arrange
    const sale = { items: [{ productName: 'Pupusa' }, { productName: 'Soda' }] };
    // Act
    const result = getSaleSummary(sale);
    // Assert
    expect(result).toBe('Pupusa + 1 más');
  });

  it('5 items returns X + 4 más', () => {
    // Arrange
    const sale = { items: [{ productName: 'A' }, { productName: 'B' }, { productName: 'C' }, { productName: 'D' }, { productName: 'E' }] };
    // Act
    const result = getSaleSummary(sale);
    // Assert
    expect(result).toBe('A + 4 más');
  });

  it('empty items returns empty string', () => {
    // Arrange
    const sale = { items: [] };
    // Act
    const result = getSaleSummary(sale);
    // Assert
    expect(result).toBe('');
  });
});

describe('getSaleItemCount', () => {
  it('sums mixed quantities', () => {
    // Arrange
    const sale = { items: [{ quantity: 2 }, { quantity: 1 }, { quantity: 5 }] };
    // Act
    const count = getSaleItemCount(sale);
    // Assert
    expect(count).toBe(8);
  });

  it('defaults quantity to 1', () => {
    // Arrange
    const sale = { items: [{ productName: 'A' }, { productName: 'B' }] };
    // Act
    const count = getSaleItemCount(sale);
    // Assert
    expect(count).toBe(2);
  });
});
