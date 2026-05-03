/**
 * Icon catalog — pure logic tests
 * Tests ICON_CATALOG structure, FOOD_ICONS alias, and searchIcons function
 * using real exports from productConstants
 */

import { ICON_CATALOG, FOOD_ICONS, searchIcons } from '../../src/constants/productConstants';

describe('ICON_CATALOG structure', () => {
  it('has 11 categories', () => {
    // Arrange / Act
    const count = ICON_CATALOG.length;

    // Assert
    expect(count).toBe(11);
  });

  it('each category has a name and icons array', () => {
    // Arrange / Act / Assert
    ICON_CATALOG.forEach(cat => {
      expect(typeof cat.category).toBe('string');
      expect(cat.category.length).toBeGreaterThan(0);
      expect(Array.isArray(cat.icons)).toBe(true);
      expect(cat.icons.length).toBeGreaterThan(0);
    });
  });

  it('each category has at least 15 icons', () => {
    // Arrange / Act / Assert
    ICON_CATALOG.forEach(cat => {
      expect(cat.icons.length).toBeGreaterThanOrEqual(15);
    });
  });

  it('no duplicate icons across categories', () => {
    // Arrange
    const all = ICON_CATALOG.flatMap(c => c.icons);

    // Act
    const unique = new Set(all);

    // Assert
    expect(unique.size).toBe(all.length);
  });

  it('category names are in Spanish', () => {
    // Arrange / Act
    const names = ICON_CATALOG.map(c => c.category);

    // Assert
    expect(names).toContain('Comida');
    expect(names).toContain('Bebidas');
    expect(names).toContain('Ropa y Accesorios');
    expect(names).toContain('Varios');
  });
});

describe('FOOD_ICONS compatibility alias', () => {
  it('is a flat array of all icons from ICON_CATALOG', () => {
    // Arrange
    const expected = ICON_CATALOG.flatMap(c => c.icons);

    // Act / Assert
    expect(FOOD_ICONS).toEqual(expected);
  });

  it('has the same total count as all catalog icons combined', () => {
    // Arrange
    const catalogTotal = ICON_CATALOG.reduce((sum, c) => sum + c.icons.length, 0);

    // Act / Assert
    expect(FOOD_ICONS.length).toBe(catalogTotal);
  });

  it('contains known icons from the original FOOD_ICONS', () => {
    // Arrange / Act / Assert
    expect(FOOD_ICONS).toContain('food');
    expect(FOOD_ICONS).toContain('pizza');
    expect(FOOD_ICONS).toContain('coffee');
    expect(FOOD_ICONS).toContain('star');
  });
});

describe('searchIcons', () => {
  it('returns all categories when query is empty', () => {
    // Arrange / Act
    const result = searchIcons('');

    // Assert
    expect(result).toEqual(ICON_CATALOG);
  });

  it('returns all categories when query is null', () => {
    // Arrange / Act
    const result = searchIcons(null);

    // Assert
    expect(result).toEqual(ICON_CATALOG);
  });

  it('filters icons by partial name match', () => {
    // Arrange / Act
    const result = searchIcons('pizza');

    // Assert
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].icons).toContain('pizza');
  });

  it('is case-insensitive', () => {
    // Arrange / Act
    const lower = searchIcons('coffee');
    const upper = searchIcons('COFFEE');

    // Assert
    expect(lower).toEqual(upper);
  });

  it('excludes categories with no matching icons', () => {
    // Arrange / Act
    const result = searchIcons('pizza');

    // Assert
    result.forEach(cat => {
      expect(cat.icons.length).toBeGreaterThan(0);
    });
  });

  it('matches across multiple categories', () => {
    // Arrange / Act
    const result = searchIcons('outline');

    // Assert
    expect(result.length).toBeGreaterThan(1);
  });

  it('returns empty array for non-existent icon', () => {
    // Arrange / Act
    const result = searchIcons('xyznonexistent');

    // Assert
    expect(result).toEqual([]);
  });

  it('trims whitespace from query', () => {
    // Arrange / Act
    const trimmed = searchIcons('  pizza  ');
    const normal = searchIcons('pizza');

    // Assert
    expect(trimmed).toEqual(normal);
  });

  it('finds shoe icons in Ropa y Accesorios', () => {
    // Arrange / Act
    const result = searchIcons('shoe');

    // Assert
    const ropaCategory = result.find(c => c.category === 'Ropa y Accesorios');
    expect(ropaCategory).toBeDefined();
    expect(ropaCategory.icons.length).toBeGreaterThan(0);
  });
});
