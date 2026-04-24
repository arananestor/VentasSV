import { cycleColor, validateEditedProduct, buildEditedProduct } from '../../../src/utils/productEditorLogic';

describe('cycleColor', () => {
  const colors = ['#FF0000', '#00FF00', '#0000FF'];

  it('returns next color', () => {
    // Arrange / Act
    const result = cycleColor('#FF0000', colors);
    // Assert
    expect(result).toBe('#00FF00');
  });

  it('wraps to first at end', () => {
    // Arrange / Act
    const result = cycleColor('#0000FF', colors);
    // Assert
    expect(result).toBe('#FF0000');
  });

  it('returns first when color not found', () => {
    // Arrange / Act
    const result = cycleColor('#999999', colors);
    // Assert
    expect(result).toBe('#FF0000');
  });
});

describe('validateEditedProduct', () => {
  it('rejects empty name', () => {
    // Arrange / Act
    const result = validateEditedProduct({ name: '', sizes: [{ price: 1 }] });
    // Assert
    expect(result.ok).toBe(false);
  });

  it('rejects no prices', () => {
    // Arrange / Act
    const result = validateEditedProduct({ name: 'Test', sizes: [{ price: 0 }] });
    // Assert
    expect(result.ok).toBe(false);
  });

  it('accepts valid product', () => {
    // Arrange / Act
    const result = validateEditedProduct({ name: 'Pupusa', sizes: [{ price: 0.50 }] });
    // Assert
    expect(result.ok).toBe(true);
  });
});

describe('buildEditedProduct', () => {
  it('preserves non-edited fields', () => {
    // Arrange
    const original = { id: '1', name: 'Old', type: 'elaborado', sizes: [{ price: 1 }], ingredients: ['A'] };
    // Act
    const result = buildEditedProduct(original, { name: 'New' });
    // Assert
    expect(result.name).toBe('New');
    expect(result.id).toBe('1');
    expect(result.ingredients).toEqual(['A']);
  });

  it('simple type excludes ingredients/extras', () => {
    // Arrange
    const original = { id: '1', name: 'Soda', type: 'simple', sizes: [{ price: 1 }] };
    // Act
    const result = buildEditedProduct(original, { name: 'Cola', ingredients: ['X'], extras: ['Y'] });
    // Assert
    expect(result.name).toBe('Cola');
    expect(result.ingredients).toBeUndefined();
    expect(result.extras).toBeUndefined();
  });

  it('with imageMode icon includes iconName', () => {
    // Arrange
    const original = { id: '1', name: 'A', type: 'simple', sizes: [{ price: 1 }] };
    // Act
    const result = buildEditedProduct(original, { imageMode: 'icon', iconName: 'food', iconBgColor: '#000' });
    // Assert
    expect(result.iconName).toBe('food');
    expect(result.iconBgColor).toBe('#000');
  });

  it('with imageMode photo includes customImage', () => {
    // Arrange
    const original = { id: '1', name: 'A', type: 'simple', sizes: [{ price: 1 }] };
    // Act
    const result = buildEditedProduct(original, { imageMode: 'photo', customImage: 'uri://photo' });
    // Assert
    expect(result.customImage).toBe('uri://photo');
  });
});
