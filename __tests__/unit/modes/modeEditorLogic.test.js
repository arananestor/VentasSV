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
