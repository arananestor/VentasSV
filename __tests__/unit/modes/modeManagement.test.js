import { canManageModesLocally, validateModeForm, buildOverridesPatch, reorderTabOrder } from '../../../src/utils/modeManagement';

describe('canManageModesLocally', () => {
  it('owner can manage', () => {
    // Arrange / Act
    const result = canManageModesLocally({ role: 'owner' });
    // Assert
    expect(result).toBe(true);
  });

  it('co-admin cannot manage in Fase 0', () => {
    // Arrange / Act
    const result = canManageModesLocally({ role: 'co-admin' });
    // Assert
    expect(result).toBe(false);
  });

  it('worker cannot manage', () => {
    // Arrange / Act
    const result = canManageModesLocally({ role: 'worker' });
    // Assert
    expect(result).toBe(false);
  });

  it('null worker cannot manage', () => {
    // Arrange / Act
    const result = canManageModesLocally(null);
    // Assert
    expect(result).toBe(false);
  });
});

describe('validateModeForm', () => {
  const existing = [{ id: 'm1', name: 'Principal' }, { id: 'm2', name: 'Festival' }];

  it('valid name passes', () => {
    // Arrange / Act
    const result = validateModeForm({ name: 'Nuevo', existingModes: existing });
    // Assert
    expect(result.ok).toBe(true);
  });

  it('empty name fails', () => {
    // Arrange / Act
    const result = validateModeForm({ name: '  ', existingModes: existing });
    // Assert
    expect(result.ok).toBe(false);
  });

  it('duplicate name fails (case-insensitive)', () => {
    // Arrange / Act
    const result = validateModeForm({ name: 'festival', existingModes: existing });
    // Assert
    expect(result.ok).toBe(false);
  });

  it('over 40 chars fails', () => {
    // Arrange / Act
    const result = validateModeForm({ name: 'A'.repeat(41), existingModes: [] });
    // Assert
    expect(result.ok).toBe(false);
  });

  it('editing allows same name if own id', () => {
    // Arrange / Act
    const result = validateModeForm({ name: 'Principal', existingModes: existing, editingId: 'm1' });
    // Assert
    expect(result.ok).toBe(true);
  });
});

describe('buildOverridesPatch', () => {
  it('adds new entry', () => {
    // Arrange / Act
    const result = buildOverridesPatch({ currentOverrides: {}, productId: 'p1', patch: { active: true } });
    // Assert
    expect(result.p1).toEqual({ active: true, priceOverride: null });
  });

  it('merges with existing', () => {
    // Arrange
    const current = { p1: { active: true, priceOverride: 5.00 } };
    // Act
    const result = buildOverridesPatch({ currentOverrides: current, productId: 'p1', patch: { active: false } });
    // Assert
    expect(result.p1.active).toBe(false);
    expect(result.p1.priceOverride).toBe(5.00);
  });

  it('normalizes empty string priceOverride to null', () => {
    // Arrange / Act
    const result = buildOverridesPatch({ currentOverrides: {}, productId: 'p1', patch: { active: true, priceOverride: '' } });
    // Assert
    expect(result.p1.priceOverride).toBeNull();
  });

  it('normalizes NaN priceOverride to null', () => {
    // Arrange / Act
    const result = buildOverridesPatch({ currentOverrides: {}, productId: 'p1', patch: { active: true, priceOverride: NaN } });
    // Assert
    expect(result.p1.priceOverride).toBeNull();
  });
});

describe('reorderTabOrder', () => {
  it('moves element correctly', () => {
    // Arrange
    const tabs = ['t1', 't2', 't3'];
    // Act
    const result = reorderTabOrder(tabs, 0, 2);
    // Assert
    expect(result).toEqual(['t2', 't3', 't1']);
  });

  it('does not mutate input', () => {
    // Arrange
    const tabs = ['t1', 't2', 't3'];
    // Act
    reorderTabOrder(tabs, 0, 2);
    // Assert
    expect(tabs).toEqual(['t1', 't2', 't3']);
  });
});
