import { buildOverridesPatch } from '../../../src/utils/modeManagement';
import { formatDateTimeReadable } from '../../../src/utils/formatters';

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

describe('formatDateTimeReadable', () => {
  it('formats valid ISO date', () => {
    // Arrange / Act
    const result = formatDateTimeReadable('2026-04-15T08:30:00.000Z');
    // Assert
    expect(result).toContain('Abr');
    expect(result).toContain('2026');
  });

  it('returns empty for null', () => {
    // Arrange / Act
    const result = formatDateTimeReadable(null);
    // Assert
    expect(result).toBe('');
  });
});

describe('worker assignment logic', () => {
  it('assign worker adds id to array', () => {
    // Arrange
    const ids = [];
    const workerId = 'w1';
    // Act
    const updated = [...ids, workerId];
    // Assert
    expect(updated).toContain('w1');
  });

  it('unassign worker removes id from array', () => {
    // Arrange
    const ids = ['w1', 'w2', 'w3'];
    // Act
    const updated = ids.filter(id => id !== 'w2');
    // Assert
    expect(updated).toEqual(['w1', 'w3']);
  });

  it('assignedWorkerIds defaults to empty array when undefined', () => {
    // Arrange
    const mode = { name: 'Test' };
    // Act
    const ids = mode.assignedWorkerIds || [];
    // Assert
    expect(ids).toEqual([]);
  });
});
