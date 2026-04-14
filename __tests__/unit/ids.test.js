import { newId, isValidUuid } from '../../src/utils/ids';

describe('newId', () => {
  it('returns a string', () => {
    // Arrange / Act
    const id = newId();
    // Assert
    expect(typeof id).toBe('string');
  });

  it('returns a valid UUID v4', () => {
    // Arrange / Act
    const id = newId();
    // Assert
    expect(isValidUuid(id)).toBe(true);
  });

  it('two calls return different IDs', () => {
    // Arrange / Act
    const a = newId();
    const b = newId();
    // Assert
    expect(a).not.toBe(b);
  });
});

describe('isValidUuid', () => {
  it('accepts a generated UUID v4', () => {
    // Arrange
    const id = newId();
    // Act
    const result = isValidUuid(id);
    // Assert
    expect(result).toBe(true);
  });

  it('rejects Date.now string', () => {
    // Arrange / Act
    const result = isValidUuid(Date.now().toString());
    // Assert
    expect(result).toBe(false);
  });

  it('rejects null', () => {
    // Arrange / Act
    const result = isValidUuid(null);
    // Assert
    expect(result).toBe(false);
  });

  it('rejects undefined', () => {
    // Arrange / Act
    const result = isValidUuid(undefined);
    // Assert
    expect(result).toBe(false);
  });

  it('rejects empty string', () => {
    // Arrange / Act
    const result = isValidUuid('');
    // Assert
    expect(result).toBe(false);
  });

  it('rejects non-uuid string', () => {
    // Arrange / Act
    const result = isValidUuid('not-a-uuid');
    // Assert
    expect(result).toBe(false);
  });
});
