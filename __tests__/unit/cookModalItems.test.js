import { getItemsNeedingCook, updateUnitCookLevel, areAllUnitsCooked } from '../../src/utils/cookModalLogic';

describe('getItemsNeedingCook', () => {
  it('returns items with units', () => {
    // Arrange
    const sale = { items: [
      { productName: 'Pupusa', units: [{ note: '' }] },
      { productName: 'Soda', units: [] },
      { productName: 'Tamal', units: [{ note: '' }, { note: '' }] },
    ]};
    // Act
    const result = getItemsNeedingCook(sale);
    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].itemIndex).toBe(0);
    expect(result[1].itemIndex).toBe(2);
  });

  it('returns empty array if no items have units', () => {
    // Arrange
    const sale = { items: [{ productName: 'Soda', units: [] }] };
    // Act
    const result = getItemsNeedingCook(sale);
    // Assert
    expect(result).toHaveLength(0);
  });

  it('preserves productName and quantity', () => {
    // Arrange
    const sale = { items: [{ productName: 'Pupusa', quantity: 3, units: [{}] }] };
    // Act
    const result = getItemsNeedingCook(sale);
    // Assert
    expect(result[0].item.productName).toBe('Pupusa');
    expect(result[0].item.quantity).toBe(3);
  });
});

describe('updateUnitCookLevel', () => {
  it('updates only the specified unit', () => {
    // Arrange
    const sale = { items: [{ productName: 'A', units: [{ note: '' }, { note: '' }] }] };
    // Act
    const updated = updateUnitCookLevel(sale, 0, 1, 'done');
    // Assert
    expect(updated.items[0].units[1].cookLevel).toBe('done');
    expect(updated.items[0].units[0].cookLevel).toBeUndefined();
  });

  it('does not mutate the original sale', () => {
    // Arrange
    const sale = { items: [{ productName: 'A', units: [{ note: '' }] }] };
    // Act
    const updated = updateUnitCookLevel(sale, 0, 0, 'done');
    // Assert
    expect(sale.items[0].units[0].cookLevel).toBeUndefined();
    expect(updated.items[0].units[0].cookLevel).toBe('done');
  });

  it('returns sale unchanged for invalid itemIndex', () => {
    // Arrange
    const sale = { items: [{ productName: 'A', units: [{}] }] };
    // Act
    const updated = updateUnitCookLevel(sale, 99, 0, 'done');
    // Assert
    expect(updated).toEqual(sale);
  });

  it('works with multiple items with units', () => {
    // Arrange
    const sale = { items: [
      { productName: 'A', units: [{ note: '' }] },
      { productName: 'B', units: [{ note: '' }, { note: '' }] },
    ]};
    // Act
    const updated = updateUnitCookLevel(sale, 1, 0, 'medium');
    // Assert
    expect(updated.items[1].units[0].cookLevel).toBe('medium');
    expect(updated.items[0].units[0].cookLevel).toBeUndefined();
    expect(updated.items[1].units[1].cookLevel).toBeUndefined();
  });
});

describe('areAllUnitsCooked', () => {
  it('true when all units have cookLevel', () => {
    // Arrange
    const sale = { items: [{ units: [{ cookLevel: 'done' }, { cookLevel: 'medium' }] }] };
    // Act
    const result = areAllUnitsCooked(sale);
    // Assert
    expect(result).toBe(true);
  });

  it('false when at least one unit missing cookLevel', () => {
    // Arrange
    const sale = { items: [{ units: [{ cookLevel: 'done' }, {}] }] };
    // Act
    const result = areAllUnitsCooked(sale);
    // Assert
    expect(result).toBe(false);
  });

  it('true when no items need cook', () => {
    // Arrange
    const sale = { items: [{ productName: 'Soda', units: [] }] };
    // Act
    const result = areAllUnitsCooked(sale);
    // Assert
    expect(result).toBe(true);
  });

  it('false when cookLevel is empty string', () => {
    // Arrange
    const sale = { items: [{ units: [{ cookLevel: '' }] }] };
    // Act
    const result = areAllUnitsCooked(sale);
    // Assert
    expect(result).toBe(false);
  });
});
