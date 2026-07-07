import { evaluateSchedule, appendScheduledActivation, removeScheduledActivation, isScheduleValid, detectScheduleOverlap, getActiveModeAt } from '../../../src/utils/modeScheduling';
import { isValidUuid } from '../../../src/utils/ids';
import { createMode } from '../../../src/models/mode';

describe('evaluateSchedule', () => {
  it('returns none when no entries', () => {
    // Arrange
    const modes = [{ id: 'm1', scheduledActivations: [] }];
    // Act
    const result = evaluateSchedule({ modes, currentModeId: 'm1', now: '2026-04-14T12:00:00Z' });
    // Assert
    expect(result.action).toBe('none');
  });

  it('returns activate when startsAt <= now <= endsAt and not current', () => {
    // Arrange
    const modes = [{ id: 'm1', scheduledActivations: [{ id: 'e1', startsAt: '2026-04-14T08:00:00Z', endsAt: '2026-04-14T18:00:00Z', previousModeId: 'm0' }] }];
    // Act
    const result = evaluateSchedule({ modes, currentModeId: 'm0', now: '2026-04-14T12:00:00Z' });
    // Assert
    expect(result.action).toBe('activate');
    expect(result.targetModeId).toBe('m1');
  });

  it('returns revert when endsAt passed on current mode', () => {
    // Arrange
    const modes = [{ id: 'm1', scheduledActivations: [{ id: 'e1', startsAt: '2026-04-14T08:00:00Z', endsAt: '2026-04-14T12:00:00Z', previousModeId: 'm0' }] }];
    // Act
    const result = evaluateSchedule({ modes, currentModeId: 'm1', now: '2026-04-14T13:00:00Z' });
    // Assert
    expect(result.action).toBe('revert');
    expect(result.targetModeId).toBe('m0');
  });

  it('most recent startsAt wins on ambiguity', () => {
    // Arrange
    const modes = [
      { id: 'm1', scheduledActivations: [{ id: 'e1', startsAt: '2026-04-14T08:00:00Z', endsAt: null }] },
      { id: 'm2', scheduledActivations: [{ id: 'e2', startsAt: '2026-04-14T10:00:00Z', endsAt: null }] },
    ];
    // Act
    const result = evaluateSchedule({ modes, currentModeId: 'm0', now: '2026-04-14T12:00:00Z' });
    // Assert
    expect(result.targetModeId).toBe('m2');
  });

  it('ignores entry if target is already current', () => {
    // Arrange
    const modes = [{ id: 'm1', scheduledActivations: [{ id: 'e1', startsAt: '2026-04-14T08:00:00Z', endsAt: null }] }];
    // Act
    const result = evaluateSchedule({ modes, currentModeId: 'm1', now: '2026-04-14T12:00:00Z' });
    // Assert
    expect(result.action).toBe('none');
  });
});

describe('appendScheduledActivation', () => {
  it('adds entry with UUID id and createdAt', () => {
    // Arrange
    const mode = createMode({ name: 'Test' });
    // Act
    const updated = appendScheduledActivation(mode, { type: 'evento', date: '2026-04-15', startTime: '08:00', endTime: '18:00' });
    // Assert
    expect(updated.scheduledActivations).toHaveLength(1);
    expect(isValidUuid(updated.scheduledActivations[0].id)).toBe(true);
    expect(updated.scheduledActivations[0].createdAt).toBeDefined();
  });
});

describe('removeScheduledActivation', () => {
  it('filters by id', () => {
    // Arrange
    const mode = { scheduledActivations: [{ id: 'e1' }, { id: 'e2' }] };
    // Act
    const updated = removeScheduledActivation(mode, 'e1');
    // Assert
    expect(updated.scheduledActivations).toHaveLength(1);
    expect(updated.scheduledActivations[0].id).toBe('e2');
  });
});

describe('isScheduleValid', () => {
  it('valid with future startsAt and no endsAt', () => {
    // Arrange / Act
    const result = isScheduleValid({ startsAt: '2099-01-01T00:00:00Z', endsAt: null });
    // Assert
    expect(result).toBe(true);
  });

  it('valid with startsAt before endsAt', () => {
    // Arrange / Act
    const result = isScheduleValid({ startsAt: '2026-04-15T08:00:00Z', endsAt: '2026-04-15T18:00:00Z' });
    // Assert
    expect(result).toBe(true);
  });

  it('invalid with endsAt before startsAt', () => {
    // Arrange / Act
    const result = isScheduleValid({ startsAt: '2026-04-15T18:00:00Z', endsAt: '2026-04-15T08:00:00Z' });
    // Assert
    expect(result).toBe(false);
  });

  it('invalid without startsAt', () => {
    // Arrange / Act
    const result = isScheduleValid({ startsAt: null, endsAt: null });
    // Assert
    expect(result).toBe(false);
  });
});

describe('detectScheduleOverlap', () => {
  it('returns empty array with no existing activations', () => {
    // Arrange
    const newAct = { type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00' };
    // Act
    const result = detectScheduleOverlap(newAct, []);
    // Assert
    expect(result).toEqual([]);
  });

  it('returns empty when no overlap', () => {
    // Arrange
    const newAct = { type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00' };
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [1], startTime: '13:00', endTime: '17:00' }];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toEqual([]);
  });

  it('detects full overlap (same range)', () => {
    // Arrange
    const newAct = { type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00' };
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00' }];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].modeId).toBe('m1');
  });

  it('detects partial overlap (1 hour margin)', () => {
    // Arrange
    const newAct = { type: 'recurrente', days: [1], startTime: '11:00', endTime: '15:00' };
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00' }];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].overlapStart).toBe('11:00');
    expect(result[0].overlapEnd).toBe('12:00');
  });

  it('detects overlap with multiple existing activations', () => {
    // Arrange
    const newAct = { type: 'recurrente', days: [1], startTime: '10:00', endTime: '20:00' };
    const existing = [
      { id: 'e1', modeId: 'm1', type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00' },
      { id: 'e2', modeId: 'm2', type: 'recurrente', days: [1], startTime: '18:00', endTime: '22:00' },
    ];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(2);
  });

  it('handles cross-day activation (23:00-03:00)', () => {
    // Arrange
    const newAct = { type: 'recurrente', days: [3], startTime: '23:00', endTime: '03:00' }; // Wed night
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [3], startTime: '22:00', endTime: '23:30' }];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(1);
  });

  it('detects overlap when cross-day activation reaches next-day existing', () => {
    // Arrange — new Wed 23:00 to Thu 03:00 vs existing Thu 02:00 to 06:00
    const newAct = { type: 'recurrente', days: [3], startTime: '23:00', endTime: '03:00' };
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [4], startTime: '02:00', endTime: '06:00' }];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].modeId).toBe('m1');
    expect(result[0].overlapDay).toBe(4);
  });

  it('does not detect overlap when cross-day activation does not reach next-day existing', () => {
    // Arrange — new Wed 23:00 to Thu 01:00 vs existing Thu 02:00 to 06:00
    const newAct = { type: 'recurrente', days: [3], startTime: '23:00', endTime: '01:00' };
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [4], startTime: '02:00', endTime: '06:00' }];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(0);
  });

  it('detects overlap between evento and recurrente on same weekday', () => {
    // Arrange — 2026-05-25 is Monday (day 1 in UTC)
    const newAct = { type: 'evento', date: '2026-05-25', startTime: '10:00', endTime: '14:00' };
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [1], startTime: '12:00', endTime: '16:00' }];
    // Act
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(1);
  });

  it('multi-day evento expands to ranges for each day in range', () => {
    // Arrange — 2026-07-06 Mon, 2026-07-07 Tue, 2026-07-08 Wed
    const newAct = { type: 'evento', date: '2026-07-06', endDate: '2026-07-08', startTime: '10:00', endTime: '14:00' };
    const existing = [{ id: 'e1', modeId: 'm1', type: 'recurrente', days: [2], startTime: '12:00', endTime: '16:00' }];
    // Act — Tuesday (day 2) should overlap
    const result = detectScheduleOverlap(newAct, existing);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].overlapDay).toBe(2);
  });
});

describe('getActiveModeAt', () => {
  const principal = { id: 'principal', isDefault: true };
  const promo = { id: 'promo', isDefault: false };

  it('returns null with no modes and no principal', () => {
    // Arrange / Act
    const result = getActiveModeAt('2026-05-25T12:00:00', [], [], null);
    // Assert
    expect(result).toBeNull();
  });

  it('returns principal when nothing is scheduled', () => {
    // Arrange / Act
    const result = getActiveModeAt('2026-05-25T12:00:00', [principal], [], null);
    // Assert
    expect(result).toBe('principal');
  });

  it('evento puntual wins over principal', () => {
    // Arrange — 2026-05-25 is Monday (day 1) in local time
    const activations = [{ type: 'evento', date: '2026-05-25', startTime: '10:00', endTime: '14:00', modeId: 'promo' }];
    // Act
    const result = getActiveModeAt('2026-05-25T12:00:00', [principal, promo], activations, null);
    // Assert
    expect(result).toBe('promo');
  });

  it('recurrente wins over principal', () => {
    // Arrange — Monday = day 1
    const activations = [{ type: 'recurrente', days: [1], startTime: '10:00', endTime: '14:00', modeId: 'promo' }];
    // Act
    const result = getActiveModeAt('2026-05-25T12:00:00', [principal, promo], activations, null);
    // Assert
    expect(result).toBe('promo');
  });

  it('evento wins over recurrente when both active', () => {
    // Arrange
    const activations = [
      { type: 'recurrente', days: [1], startTime: '10:00', endTime: '14:00', modeId: 'recMode' },
      { type: 'evento', date: '2026-05-25', startTime: '10:00', endTime: '14:00', modeId: 'evtMode' },
    ];
    const modes = [principal, { id: 'recMode' }, { id: 'evtMode' }];
    // Act
    const result = getActiveModeAt('2026-05-25T12:00:00', modes, activations, null);
    // Assert
    expect(result).toBe('evtMode');
  });

  it('manual override always wins', () => {
    // Arrange
    const activations = [{ type: 'evento', date: '2026-05-25', startTime: '10:00', endTime: '14:00', modeId: 'promo' }];
    // Act
    const result = getActiveModeAt('2026-05-25T12:00:00', [principal, promo], activations, 'manual-mode');
    // Assert
    expect(result).toBe('manual-mode');
  });

  it('now === endTime means not active (activation ended)', () => {
    // Arrange
    const activations = [{ type: 'recurrente', days: [1], startTime: '10:00', endTime: '12:00', modeId: 'promo' }];
    // Act
    const result = getActiveModeAt('2026-05-25T12:00:00', [principal, promo], activations, null);
    // Assert
    expect(result).toBe('principal');
  });

  it('cross-day: 02:30 Thursday falls in Wednesday 23:00-03:00', () => {
    // Arrange — 2026-05-28 is Thursday (day 4) local, Wednesday is day 3
    const activations = [{ type: 'recurrente', days: [3], startTime: '23:00', endTime: '03:00', modeId: 'night' }];
    const modes = [principal, { id: 'night' }];
    // Act
    const result = getActiveModeAt('2026-05-28T02:30:00', modes, activations, null);
    // Assert
    expect(result).toBe('night');
  });

  it('multi-day evento active on middle day of range', () => {
    // Arrange — evento July 6-8, checking July 7 (Tuesday) at 12:00
    const activations = [{ type: 'evento', date: '2026-07-06', endDate: '2026-07-08', startTime: '10:00', endTime: '14:00', modeId: 'promo' }];
    // Act
    const result = getActiveModeAt('2026-07-07T12:00:00', [principal, promo], activations, null);
    // Assert
    expect(result).toBe('promo');
  });

  it('multi-day evento not active outside date range', () => {
    // Arrange — evento July 6-8, checking July 9 (Thursday)
    const activations = [{ type: 'evento', date: '2026-07-06', endDate: '2026-07-08', startTime: '10:00', endTime: '14:00', modeId: 'promo' }];
    // Act
    const result = getActiveModeAt('2026-07-09T12:00:00', [principal, promo], activations, null);
    // Assert
    expect(result).toBe('principal');
  });
});
