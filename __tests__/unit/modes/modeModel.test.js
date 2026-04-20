import { createMode, normalizeProductOverrides, buildPrincipalMode } from '../../../src/models/mode';
import { isValidUuid } from '../../../src/utils/ids';

describe('createMode', () => {
  it('creates with defaults', () => {
    // Arrange / Act
    const mode = createMode({ name: 'Test' });
    // Assert
    expect(mode.name).toBe('Test');
    expect(mode.description).toBe('');
    expect(mode.productOverrides).toEqual({});
    expect(mode.tabOrder).toEqual([]);
    expect(mode.isDefault).toBe(false);
    expect(mode.scheduledActivations).toEqual([]);
    expect(mode.assignedWorkerIds).toEqual([]);
    expect(isValidUuid(mode.id)).toBe(true);
    expect(mode.createdAt).toBeDefined();
    expect(mode.updatedAt).toBeDefined();
  });

  it('creates with custom overrides', () => {
    // Arrange
    const overrides = { p1: { active: true, priceOverride: null } };
    // Act
    const mode = createMode({ name: 'Custom', productOverrides: overrides, tabOrder: ['t1'], isDefault: true });
    // Assert
    expect(mode.productOverrides).toEqual(overrides);
    expect(mode.tabOrder).toEqual(['t1']);
    expect(mode.isDefault).toBe(true);
  });

  it('generates unique IDs', () => {
    // Arrange / Act
    const a = createMode({ name: 'A' });
    const b = createMode({ name: 'B' });
    // Assert
    expect(a.id).not.toBe(b.id);
  });
});

describe('normalizeProductOverrides', () => {
  it('keeps valid entries', () => {
    // Arrange
    const input = { p1: { active: true, priceOverride: null }, p2: { active: false, priceOverride: 5.00 } };
    // Act
    const result = normalizeProductOverrides(input);
    // Assert
    expect(result).toEqual(input);
  });

  it('discards entry missing active', () => {
    // Arrange
    const input = { p1: { priceOverride: null }, p2: { active: true, priceOverride: null } };
    // Act
    const result = normalizeProductOverrides(input);
    // Assert
    expect(result.p1).toBeUndefined();
    expect(result.p2).toBeDefined();
  });

  it('discards entry with non-number non-null priceOverride', () => {
    // Arrange
    const input = { p1: { active: true, priceOverride: 'free' } };
    // Act
    const result = normalizeProductOverrides(input);
    // Assert
    expect(result.p1).toBeUndefined();
  });

  it('handles null/undefined input', () => {
    // Arrange / Act
    const result = normalizeProductOverrides(null);
    // Assert
    expect(result).toEqual({});
  });
});

describe('buildPrincipalMode', () => {
  it('maps all products active with no priceOverride', () => {
    // Arrange
    const products = [{ id: 'p1' }, { id: 'p2' }];
    const tabs = [{ id: 't1' }, { id: 't2' }];
    // Act
    const mode = buildPrincipalMode({ products, tabs });
    // Assert
    expect(mode.name).toBe('Principal');
    expect(mode.isDefault).toBe(true);
    expect(mode.productOverrides.p1).toEqual({ active: true, priceOverride: null });
    expect(mode.productOverrides.p2).toEqual({ active: true, priceOverride: null });
    expect(mode.tabOrder).toEqual(['t1', 't2']);
  });

  it('handles empty products and tabs', () => {
    // Arrange / Act
    const mode = buildPrincipalMode({ products: [], tabs: [] });
    // Assert
    expect(mode.productOverrides).toEqual({});
    expect(mode.tabOrder).toEqual([]);
    expect(mode.isDefault).toBe(true);
  });

  it('handles no args', () => {
    // Arrange / Act
    const mode = buildPrincipalMode();
    // Assert
    expect(mode.productOverrides).toEqual({});
    expect(mode.tabOrder).toEqual([]);
  });
});
