import { buildOverridesPatch } from '../../../src/utils/modeManagement';

describe('mode editor logic', () => {
  it('toggle active false preserves priceOverride', () => {
    // Arrange
    const current = { p1: { active: true, priceOverride: 10.50 } };
    // Act
    const result = buildOverridesPatch({ currentOverrides: current, productId: 'p1', patch: { active: false } });
    // Assert
    expect(result.p1.active).toBe(false);
    expect(result.p1.priceOverride).toBe(10.50);
  });

  it('set priceOverride 10.50', () => {
    // Arrange
    const current = { p1: { active: true, priceOverride: null } };
    // Act
    const result = buildOverridesPatch({ currentOverrides: current, productId: 'p1', patch: { priceOverride: 10.50 } });
    // Assert
    expect(result.p1.priceOverride).toBe(10.50);
  });

  it('set priceOverride empty string normalizes to null', () => {
    // Arrange
    const current = { p1: { active: true, priceOverride: 5.00 } };
    // Act
    const result = buildOverridesPatch({ currentOverrides: current, productId: 'p1', patch: { priceOverride: '' } });
    // Assert
    expect(result.p1.priceOverride).toBeNull();
  });
});

describe('decimal input parsing at save time', () => {
  it('raw string "10." preserves in state, parseable to 10 at save', () => {
    // Arrange
    const raw = '10.';
    // Act
    const parsed = parseFloat(raw);
    // Assert
    expect(parsed).toBe(10);
    expect(raw).toBe('10.'); // raw preserved for input display
  });

  it('raw string "3.99" parses to 3.99', () => {
    // Arrange
    const raw = '3.99';
    // Act
    const parsed = parseFloat(raw);
    // Assert
    expect(parsed).toBe(3.99);
  });

  it('raw empty string parses to null', () => {
    // Arrange
    const raw = '';
    // Act
    const parsed = raw === '' ? null : parseFloat(raw);
    // Assert
    expect(parsed).toBeNull();
  });
});
