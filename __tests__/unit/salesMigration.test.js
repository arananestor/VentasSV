import { migrateSaleV2toV3, migrateAllSalesV2toV3 } from '../../src/utils/salesMigration';

describe('migrateSaleV2toV3', () => {
  it('migrates basic v2 sale', () => {
    // Arrange
    const v2 = { id: '1', productId: 'p1', productName: 'Pupusa', size: 'Grande', quantity: 2, total: 3.00, paymentMethod: 'cash', timestamp: '2026-04-13T10:00:00Z' };
    // Act
    const v3 = migrateSaleV2toV3(v2);
    // Assert
    expect(v3.items).toHaveLength(1);
    expect(v3.items[0].productName).toBe('Pupusa');
    expect(v3.items[0].size).toBe('Grande');
    expect(v3.items[0].quantity).toBe(2);
    expect(v3.items[0].subtotal).toBe(3.00);
    expect(v3.total).toBe(3.00);
  });

  it('moves units and extras to items[0]', () => {
    // Arrange
    const v2 = { id: '2', productName: 'Tamal', units: [{ note: 'test' }], extras: ['Queso'], total: 2.00 };
    // Act
    const v3 = migrateSaleV2toV3(v2);
    // Assert
    expect(v3.items[0].units).toEqual([{ note: 'test' }]);
    expect(v3.items[0].extras).toEqual(['Queso']);
  });

  it('maps toppings legacy to extras', () => {
    // Arrange
    const v2 = { id: '3', productName: 'Minuta', toppings: ['Fresa', 'Limón'], total: 1.50 };
    // Act
    const v3 = migrateSaleV2toV3(v2);
    // Assert
    expect(v3.items[0].extras).toEqual(['Fresa', 'Limón']);
  });

  it('is idempotent — v3 sale returns as-is', () => {
    // Arrange
    const v3 = { id: '4', items: [{ productName: 'Soda', subtotal: 1.00 }], total: 1.00 };
    // Act
    const result = migrateSaleV2toV3(v3);
    // Assert
    expect(result).toBe(v3);
  });

  it('removes singular fields from root', () => {
    // Arrange
    const v2 = { id: '5', productId: 'p5', productName: 'Pan', size: 'Normal', quantity: 1, units: [], extras: [], note: 'test', total: 0.50 };
    // Act
    const v3 = migrateSaleV2toV3(v2);
    // Assert
    expect(v3.productName).toBeUndefined();
    expect(v3.size).toBeUndefined();
    expect(v3.quantity).toBeUndefined();
    expect(v3.units).toBeUndefined();
    expect(v3.extras).toBeUndefined();
    expect(v3.note).toBeUndefined();
    expect(v3.productId).toBeUndefined();
  });

  it('handles missing total', () => {
    // Arrange
    const v2 = { id: '6', productName: 'Gratis' };
    // Act
    const v3 = migrateSaleV2toV3(v2);
    // Assert
    expect(v3.items[0].subtotal).toBe(0);
    expect(v3.total).toBe(0);
  });

  it('uses defaults for missing size/extras/note', () => {
    // Arrange
    const v2 = { id: '7', productName: 'Simple', total: 1.00 };
    // Act
    const v3 = migrateSaleV2toV3(v2);
    // Assert
    expect(v3.items[0].size).toBe('');
    expect(v3.items[0].extras).toEqual([]);
    expect(v3.items[0].note).toBe('');
  });
});

describe('migrateAllSalesV2toV3', () => {
  it('migrates mixed array — v2 and v3', () => {
    // Arrange
    const sales = [
      { id: '1', productName: 'Pupusa', total: 0.50 },
      { id: '2', items: [{ productName: 'Soda', subtotal: 1.00 }], total: 1.00 },
    ];
    // Act
    const migrated = migrateAllSalesV2toV3(sales);
    // Assert
    expect(migrated[0].items).toBeDefined();
    expect(migrated[1].items).toBeDefined();
    expect(migrated).toHaveLength(2);
  });
});
