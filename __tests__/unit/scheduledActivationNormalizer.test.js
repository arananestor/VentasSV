/**
 * scheduledActivationNormalizer — pure logic tests
 */

const { normalizeScheduledActivation, normalizeModeActivations } = require('../../src/utils/scheduledActivationNormalizer');

describe('normalizeScheduledActivation', () => {
  it('new shape evento retorna intacto con id y modeId', () => {
    // Arrange
    const act = { id: 'a1', type: 'evento', date: '2026-06-01', startTime: '10:00', endTime: '14:00', modeId: 'm1', createdAt: '2026-05-26T00:00:00Z' };

    // Act
    const result = normalizeScheduledActivation(act, 'm1');

    // Assert
    expect(result.type).toBe('evento');
    expect(result.id).toBe('a1');
    expect(result.modeId).toBe('m1');
    expect(result.date).toBe('2026-06-01');
  });

  it('new shape recurrente retorna intacto', () => {
    // Arrange
    const act = { type: 'recurrente', days: [1, 2, 3], startTime: '08:00', endTime: '12:00' };

    // Act
    const result = normalizeScheduledActivation(act, 'm2');

    // Assert
    expect(result.type).toBe('recurrente');
    expect(result.modeId).toBe('m2');
    expect(result.id).toBeTruthy();
  });

  it('legacy shape {startsAt, endsAt} se convierte a evento', () => {
    // Arrange
    const act = { id: 'old1', startsAt: '2026-06-01T10:00:00Z', endsAt: '2026-06-01T14:00:00Z', previousModeId: 'm0' };

    // Act
    const result = normalizeScheduledActivation(act, 'm1');

    // Assert
    expect(result.type).toBe('evento');
    expect(result.date).toBe('2026-06-01');
    expect(result.startTime).toBe('10:00');
    expect(result.endTime).toBe('14:00');
    expect(result.modeId).toBe('m1');
    expect(result.id).toBe('old1');
  });

  it('malformed activation retorna null', () => {
    // Arrange
    const act = { foo: 'bar' };

    // Act
    const result = normalizeScheduledActivation(act, 'm1');

    // Assert
    expect(result).toBeNull();
  });

  it('null input retorna null', () => {
    // Arrange / Act
    const result = normalizeScheduledActivation(null, 'm1');

    // Assert
    expect(result).toBeNull();
  });

  it('genera id si falta', () => {
    // Arrange
    const act = { type: 'evento', date: '2026-06-01', startTime: '10:00', endTime: '14:00' };

    // Act
    const result = normalizeScheduledActivation(act, 'm1');

    // Assert
    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe('string');
  });

  it('modeId del parámetro override cuando falta en act', () => {
    // Arrange
    const act = { type: 'evento', date: '2026-06-01', startTime: '10:00', endTime: '14:00' };

    // Act
    const result = normalizeScheduledActivation(act, 'override-id');

    // Assert
    expect(result.modeId).toBe('override-id');
  });
});

describe('normalizeModeActivations', () => {
  it('normalizes all activations in a mode', () => {
    // Arrange
    const mode = {
      id: 'm1',
      scheduledActivations: [
        { type: 'evento', date: '2026-06-01', startTime: '10:00', endTime: '14:00' },
        { startsAt: '2026-06-02T08:00:00Z', endsAt: '2026-06-02T12:00:00Z' },
        { foo: 'bar' },
      ],
    };

    // Act
    const result = normalizeModeActivations(mode);

    // Assert
    expect(result.scheduledActivations).toHaveLength(2);
    expect(result.scheduledActivations[0].type).toBe('evento');
    expect(result.scheduledActivations[1].type).toBe('evento');
  });

  it('returns mode unchanged if no scheduledActivations', () => {
    // Arrange
    const mode = { id: 'm1', name: 'Test' };

    // Act
    const result = normalizeModeActivations(mode);

    // Assert
    expect(result).toEqual(mode);
  });
});
