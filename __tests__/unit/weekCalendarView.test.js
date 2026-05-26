/**
 * WeekCalendarView — pure logic tests (computeBandPositions)
 */

import { computeBandPositions } from '../../src/components/WeekCalendarView';

const COL_W = 50;
const HOUR_H = 16;

describe('computeBandPositions', () => {
  it('empty activations returns empty array', () => {
    // Arrange / Act
    const result = computeBandPositions([], [], COL_W, HOUR_H);
    // Assert
    expect(result).toEqual([]);
  });

  it('recurrente Mon-Fri 11-15 produces 5 bands', () => {
    // Arrange
    const act = [{ type: 'recurrente', days: [1, 2, 3, 4, 5], startTime: '11:00', endTime: '15:00', modeId: 'm1' }];
    const modes = [{ id: 'm1', name: 'Promo', color: '#FF0000' }];
    // Act
    const result = computeBandPositions(act, modes, COL_W, HOUR_H);
    // Assert
    expect(result).toHaveLength(5);
    result.forEach(b => {
      expect(b.color).toBe('#FF0000');
      expect(b.height).toBeGreaterThan(0);
    });
  });

  it('evento puntual produces 1 band', () => {
    // Arrange — 2026-05-25 is Monday
    const act = [{ type: 'evento', date: '2026-05-25', startTime: '10:00', endTime: '14:00', modeId: 'm1' }];
    const modes = [{ id: 'm1', name: 'Evento', color: '#00FF00' }];
    // Act
    const result = computeBandPositions(act, modes, COL_W, HOUR_H);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].color).toBe('#00FF00');
  });

  it('cross-day activation produces band for visible portion only (6am-midnight)', () => {
    // Arrange — Wednesday 23:00 to Thursday 03:00
    // The 23:00-00:00 portion is within the visible 6am-midnight range
    // The 00:00-03:00 portion is before 6am so it gets clamped out
    const act = [{ type: 'recurrente', days: [3], startTime: '23:00', endTime: '03:00', modeId: 'm1' }];
    const modes = [{ id: 'm1', name: 'Night', color: '#0000FF' }];
    // Act
    const result = computeBandPositions(act, modes, COL_W, HOUR_H);
    // Assert
    expect(result).toHaveLength(1); // only the 23:00-midnight visible portion
    expect(result[0].day).toBe(3); // Wednesday
  });

  it('cross-day activation with visible next-day portion produces 2 bands', () => {
    // Arrange — Wednesday 20:00 to Thursday 10:00 (next day portion 06:00-10:00 is visible)
    const act = [{ type: 'recurrente', days: [3], startTime: '20:00', endTime: '10:00', modeId: 'm1' }];
    const modes = [{ id: 'm1', name: 'Night', color: '#0000FF' }];
    // Act
    const result = computeBandPositions(act, modes, COL_W, HOUR_H);
    // Assert
    expect(result).toHaveLength(2);
  });

  it('overlapping activations produce separate bands with same day', () => {
    // Arrange
    const act = [
      { type: 'recurrente', days: [1], startTime: '10:00', endTime: '14:00', modeId: 'm1' },
      { type: 'recurrente', days: [1], startTime: '12:00', endTime: '16:00', modeId: 'm2' },
    ];
    const modes = [{ id: 'm1', name: 'A', color: '#FF0000' }, { id: 'm2', name: 'B', color: '#0000FF' }];
    // Act
    const result = computeBandPositions(act, modes, COL_W, HOUR_H);
    // Assert
    expect(result).toHaveLength(2);
    const days = result.map(b => b.day);
    expect(days[0]).toBe(days[1]); // same day, different z-order
  });
});
