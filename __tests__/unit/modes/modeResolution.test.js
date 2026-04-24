import { resolveVisibleProducts, resolveProductPrice, resolveTabOrder } from '../../../src/utils/modeResolution';

describe('resolveVisibleProducts', () => {
  const products = [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }, { id: 'p3', name: 'C' }];

  it('filters by active true', () => {
    // Arrange
    const mode = { productOverrides: { p1: { active: true, priceOverride: null }, p2: { active: false, priceOverride: null }, p3: { active: true, priceOverride: null } } };
    // Act
    const result = resolveVisibleProducts(products, mode);
    // Assert
    expect(result.map(p => p.id)).toEqual(['p1', 'p3']);
  });

  it('returns all products when mode is null', () => {
    // Arrange / Act
    const result = resolveVisibleProducts(products, null);
    // Assert
    expect(result).toHaveLength(3);
  });

  it('returns empty when no matches', () => {
    // Arrange
    const mode = { productOverrides: { p1: { active: false, priceOverride: null } } };
    // Act
    const result = resolveVisibleProducts(products, mode);
    // Assert
    expect(result).toHaveLength(0);
  });

  it('returns all when mode has no productOverrides', () => {
    // Arrange
    const mode = {};
    // Act
    const result = resolveVisibleProducts(products, mode);
    // Assert
    expect(result).toHaveLength(3);
  });
});

describe('resolveProductPrice', () => {
  it('returns priceOverride for single-size product', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Normal', price: 0.50 }] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: 0.75 } } };
    // Act
    const price = resolveProductPrice(product, 0, mode);
    // Assert
    expect(price).toBe(0.75);
  });

  it('returns size.price for multi-size product even with priceOverride', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Chico', price: 0.50 }, { name: 'Grande', price: 1.00 }] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: 0.75 } } };
    // Act
    const price = resolveProductPrice(product, 1, mode);
    // Assert
    expect(price).toBe(1.00);
  });

  it('returns size.price when priceOverride is null', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Normal', price: 0.50 }] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: null } } };
    // Act
    const price = resolveProductPrice(product, 0, mode);
    // Assert
    expect(price).toBe(0.50);
  });

  it('returns size.price when mode is null', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Normal', price: 0.50 }] };
    // Act
    const price = resolveProductPrice(product, 0, null);
    // Assert
    expect(price).toBe(0.50);
  });

  it('returns size.price when product not in overrides', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Normal', price: 0.50 }] };
    const mode = { productOverrides: {} };
    // Act
    const price = resolveProductPrice(product, 0, mode);
    // Assert
    expect(price).toBe(0.50);
  });
});

describe('resolveTabOrder', () => {
  const tabs = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];

  it('orders according to mode.tabOrder', () => {
    // Arrange
    const mode = { tabOrder: ['t3', 't1', 't2'] };
    // Act
    const result = resolveTabOrder(tabs, mode);
    // Assert
    expect(result.map(t => t.id)).toEqual(['t3', 't1', 't2']);
  });

  it('appends unmentioned tabs at end', () => {
    // Arrange
    const mode = { tabOrder: ['t2'] };
    // Act
    const result = resolveTabOrder(tabs, mode);
    // Assert
    expect(result.map(t => t.id)).toEqual(['t2', 't1', 't3']);
  });

  it('returns tabs as-is when tabOrder empty', () => {
    // Arrange
    const mode = { tabOrder: [] };
    // Act
    const result = resolveTabOrder(tabs, mode);
    // Assert
    expect(result.map(t => t.id)).toEqual(['t1', 't2', 't3']);
  });

  it('returns tabs as-is when mode is null', () => {
    // Arrange / Act
    const result = resolveTabOrder(tabs, null);
    // Assert
    expect(result.map(t => t.id)).toEqual(['t1', 't2', 't3']);
  });
});
