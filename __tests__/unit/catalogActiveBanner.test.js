/**
 * CatalogActiveBanner — pure logic tests (formatCountdown)
 */

import { formatCountdown } from '../../src/components/CatalogActiveBanner';

describe('formatCountdown', () => {
  it('60 minutes returns "1h 0min"', () => {
    // Arrange / Act
    const result = formatCountdown(60);
    // Assert
    expect(result).toBe('1h 0min');
  });

  it('150 minutes returns "2h 30min"', () => {
    // Arrange / Act
    const result = formatCountdown(150);
    // Assert
    expect(result).toBe('2h 30min');
  });

  it('45 minutes returns "45min"', () => {
    // Arrange / Act
    const result = formatCountdown(45);
    // Assert
    expect(result).toBe('45min');
  });

  it('1500 minutes (25h) returns "1d 1h"', () => {
    // Arrange / Act
    const result = formatCountdown(1500);
    // Assert
    expect(result).toBe('1d 1h');
  });

  it('0 returns empty string', () => {
    // Arrange / Act
    const result = formatCountdown(0);
    // Assert
    expect(result).toBe('');
  });

  it('negative returns empty string', () => {
    // Arrange / Act
    const result = formatCountdown(-10);
    // Assert
    expect(result).toBe('');
  });

  it('null returns empty string', () => {
    // Arrange / Act
    const result = formatCountdown(null);
    // Assert
    expect(result).toBe('');
  });
});
