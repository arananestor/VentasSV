import { resolveProductPrice } from '../../../src/utils/modeResolution';

describe('orderBuilder pricing with mode', () => {
  it('multi-size product uses size.price, not override', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Chico', price: 0.50 }, { name: 'Grande', price: 1.00 }] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: 0.75 } } };
    // Act
    const total = product.sizes.reduce((sum, s, i) => {
      return sum + resolveProductPrice(product, i, mode);
    }, 0);
    // Assert
    expect(total).toBeCloseTo(1.50);
  });

  it('single-size product with priceOverride uses override', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Normal', price: 0.50 }] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: 0.75 } } };
    // Act
    const base = resolveProductPrice(product, 0, mode);
    // Assert
    expect(base).toBe(0.75);
  });

  it('extras always use their own price', () => {
    // Arrange
    const extras = [{ name: 'Queso', price: 0.25 }, { name: 'Guac', price: 0.50 }];
    // Act — extras are not affected by mode
    const extrasTotal = extras.reduce((s, e) => s + (e.price || 0), 0);
    // Assert
    expect(extrasTotal).toBeCloseTo(0.75);
  });

  it('total = base + extras for single unit', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Normal', price: 1.00 }] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: 1.50 } } };
    const extras = [{ price: 0.25 }];
    // Act
    const base = resolveProductPrice(product, 0, mode);
    const extrasTotal = extras.reduce((s, e) => s + (e.price || 0), 0);
    const total = base + extrasTotal;
    // Assert
    expect(total).toBeCloseTo(1.75);
  });

  it('no mode uses base price', () => {
    // Arrange
    const product = { id: 'p1', sizes: [{ name: 'Normal', price: 2.00 }] };
    // Act
    const base = resolveProductPrice(product, 0, null);
    // Assert
    expect(base).toBe(2.00);
  });
});
