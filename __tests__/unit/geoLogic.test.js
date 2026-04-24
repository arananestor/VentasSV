import { shouldRequestPermission, canGetLocation, buildGeoPayload } from '../../src/utils/geoLogic';

describe('shouldRequestPermission', () => {
  it('undetermined → true', () => {
    // Arrange
    const status = 'undetermined';
    // Act
    const result = shouldRequestPermission(status);
    // Assert
    expect(result).toBe(true);
  });

  it('granted → false', () => {
    // Arrange
    const status = 'granted';
    // Act
    const result = shouldRequestPermission(status);
    // Assert
    expect(result).toBe(false);
  });

  it('denied → false', () => {
    // Arrange
    const status = 'denied';
    // Act
    const result = shouldRequestPermission(status);
    // Assert
    expect(result).toBe(false);
  });
});

describe('canGetLocation', () => {
  it('granted → true', () => {
    // Arrange
    const status = 'granted';
    // Act
    const result = canGetLocation(status);
    // Assert
    expect(result).toBe(true);
  });

  it('undetermined → false', () => {
    // Arrange
    const status = 'undetermined';
    // Act
    const result = canGetLocation(status);
    // Assert
    expect(result).toBe(false);
  });

  it('denied → false', () => {
    // Arrange
    const status = 'denied';
    // Act
    const result = canGetLocation(status);
    // Assert
    expect(result).toBe(false);
  });
});

describe('buildGeoPayload', () => {
  it('coords válidas → objeto con 3 campos', () => {
    // Arrange
    const coords = { latitude: 13.6929, longitude: -89.2182, accuracy: 15 };
    // Act
    const result = buildGeoPayload(coords);
    // Assert
    expect(result).toEqual({ latitude: 13.6929, longitude: -89.2182, accuracy: 15 });
  });

  it('coords sin latitude → null', () => {
    // Arrange
    const coords = { longitude: -89.2182, accuracy: 15 };
    // Act
    const result = buildGeoPayload(coords);
    // Assert
    expect(result).toBeNull();
  });

  it('coords sin longitude → null', () => {
    // Arrange
    const coords = { latitude: 13.6929, accuracy: 15 };
    // Act
    const result = buildGeoPayload(coords);
    // Assert
    expect(result).toBeNull();
  });

  it('coords undefined → null', () => {
    // Arrange
    const coords = undefined;
    // Act
    const result = buildGeoPayload(coords);
    // Assert
    expect(result).toBeNull();
  });
});
