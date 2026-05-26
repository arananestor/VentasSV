/**
 * CatalogColorPicker — pure logic tests
 */

import { isValidHex, CATALOG_COLORS } from '../../src/components/CatalogColorPicker';

describe('isValidHex', () => {
  it('#FF5733 is valid', () => {
    // Arrange / Act
    const result = isValidHex('#FF5733');
    // Assert
    expect(result).toBe(true);
  });

  it('#FFF (3 digits) is valid', () => {
    // Arrange / Act
    const result = isValidHex('#FFF');
    // Assert
    expect(result).toBe(true);
  });

  it('#XYZ is invalid', () => {
    // Arrange / Act
    const result = isValidHex('#XYZ');
    // Assert
    expect(result).toBe(false);
  });

  it('red (no hash) is invalid', () => {
    // Arrange / Act
    const result = isValidHex('red');
    // Assert
    expect(result).toBe(false);
  });

  it('empty string is invalid', () => {
    // Arrange / Act
    const result = isValidHex('');
    // Assert
    expect(result).toBe(false);
  });
});

describe('CATALOG_COLORS', () => {
  it('has exactly 12 colors', () => {
    // Arrange / Act / Assert
    expect(CATALOG_COLORS).toHaveLength(12);
  });

  it('all are valid hex', () => {
    // Arrange / Act / Assert
    CATALOG_COLORS.forEach(c => expect(isValidHex(c)).toBe(true));
  });
});
