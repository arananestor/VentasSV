import { evaluateSchedule, appendScheduledActivation, removeScheduledActivation, isScheduleValid } from '../../../src/utils/modeScheduling';
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
    const updated = appendScheduledActivation(mode, { startsAt: '2026-04-15T08:00:00Z', previousModeId: 'm0' });
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
