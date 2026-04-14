import { migrateToV5 } from '../../../src/utils/schemaMigrationV5';
import { isValidUuid } from '../../../src/utils/ids';

describe('migrateToV5', () => {
  it('idempotent — returns existing modes unchanged when modes exist', () => {
    // Arrange
    const existing = [{ id: 'm1', name: 'Feria', isDefault: false }];
    // Act
    const result = migrateToV5({ products: [], tabs: [], existingModes: existing, deviceId: 'dev-1' });
    // Assert
    expect(result.modes).toBe(existing);
    expect(result.currentModeId).toBeNull();
  });

  it('creates Principal mode when no modes exist', () => {
    // Arrange
    const products = [{ id: 'p1' }, { id: 'p2' }];
    const tabs = [{ id: 't1' }];
    // Act
    const result = migrateToV5({ products, tabs, existingModes: [], deviceId: 'dev-1' });
    // Assert
    expect(result.modes).toHaveLength(1);
    expect(result.modes[0].name).toBe('Principal');
    expect(result.modes[0].isDefault).toBe(true);
    expect(result.modes[0].productOverrides.p1).toEqual({ active: true, priceOverride: null });
    expect(result.modes[0].tabOrder).toEqual(['t1']);
    expect(isValidUuid(result.currentModeId)).toBe(true);
  });

  it('handles empty products', () => {
    // Arrange / Act
    const result = migrateToV5({ products: [], tabs: [], existingModes: [], deviceId: 'dev-1' });
    // Assert
    expect(result.modes[0].productOverrides).toEqual({});
  });

  it('handles empty tabs', () => {
    // Arrange / Act
    const result = migrateToV5({ products: [{ id: 'p1' }], tabs: [], existingModes: [], deviceId: 'dev-1' });
    // Assert
    expect(result.modes[0].tabOrder).toEqual([]);
  });

  it('applies envelope to Principal mode', () => {
    // Arrange / Act
    const result = migrateToV5({ products: [], tabs: [], existingModes: [], deviceId: 'dev-1' });
    // Assert
    expect(result.modes[0].deviceId).toBe('dev-1');
    expect(result.modes[0].accountId).toBeNull();
    expect(result.modes[0].syncState).toBe('local');
    expect(result.modes[0].serverUpdatedAt).toBeNull();
  });

  it('Principal mode has UUID v4 id', () => {
    // Arrange / Act
    const result = migrateToV5({ products: [], tabs: [], existingModes: [], deviceId: 'dev-1' });
    // Assert
    expect(isValidUuid(result.modes[0].id)).toBe(true);
  });
});
