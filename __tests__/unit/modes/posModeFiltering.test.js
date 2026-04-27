import { resolveVisibleProducts } from '../../../src/utils/modeResolution';

// Replicates the POSScreen pipeline: resolveVisibleProducts → tab filter

const getTabProducts = (products, activeTab, mode) => {
  const active = resolveVisibleProducts(products, mode);
  if (activeTab.id === 'default' && activeTab.productIds.length === 0) return active;
  return active.filter(p => activeTab.productIds.includes(p.id));
};

const products = [
  { id: 'p1', name: 'Pupusa' },
  { id: 'p2', name: 'Soda' },
  { id: 'p3', name: 'Tamal' },
];

describe('POSScreen mode filtering pipeline', () => {
  it('default tab with empty productIds shows all active products', () => {
    // Arrange
    const tab = { id: 'default', productIds: [] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: null }, p2: { active: true, priceOverride: null }, p3: { active: true, priceOverride: null } } };
    // Act
    const result = getTabProducts(products, tab, mode);
    // Assert
    expect(result).toHaveLength(3);
  });

  it('tab with productIds filters over active products', () => {
    // Arrange
    const tab = { id: 't1', productIds: ['p1', 'p3'] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: null }, p2: { active: true, priceOverride: null }, p3: { active: true, priceOverride: null } } };
    // Act
    const result = getTabProducts(products, tab, mode);
    // Assert
    expect(result.map(p => p.id)).toEqual(['p1', 'p3']);
  });

  it('tab with inactive product does not show it', () => {
    // Arrange
    const tab = { id: 't1', productIds: ['p1', 'p2'] };
    const mode = { productOverrides: { p1: { active: true, priceOverride: null }, p2: { active: false, priceOverride: null } } };
    // Act
    const result = getTabProducts(products, tab, mode);
    // Assert
    expect(result.map(p => p.id)).toEqual(['p1']);
  });

  it('null mode shows all products (legacy behavior)', () => {
    // Arrange
    const tab = { id: 'default', productIds: [] };
    // Act
    const result = getTabProducts(products, tab, null);
    // Assert
    expect(result).toHaveLength(3);
  });

  it('mode with no matching active products shows empty', () => {
    // Arrange
    const tab = { id: 'default', productIds: [] };
    const mode = { productOverrides: { p1: { active: false, priceOverride: null }, p2: { active: false, priceOverride: null }, p3: { active: false, priceOverride: null } } };
    // Act
    const result = getTabProducts(products, tab, mode);
    // Assert
    expect(result).toHaveLength(0);
  });
});
