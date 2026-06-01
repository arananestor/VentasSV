/**
 * Employee-catalog conflict detection — pure logic tests
 */

const { detectEmployeeConflicts } = require('../../src/utils/employeeConflicts');

const makeMode = (id, workerIds, activations) => ({
  id,
  assignedWorkerIds: workerIds,
  scheduledActivations: activations,
});

const recAct = (days, start, end) => ({ type: 'recurrente', days, startTime: start, endTime: end });

describe('detectEmployeeConflicts edge cases', () => {
  it('modes vacío devuelve array vacío', () => {
    // Arrange / Act
    const result = detectEmployeeConflicts([]);
    // Assert
    expect(result).toEqual([]);
  });

  it('null modes devuelve array vacío', () => {
    // Arrange / Act
    const result = detectEmployeeConflicts(null);
    // Assert
    expect(result).toEqual([]);
  });

  it('1 mode con 1 worker devuelve vacío', () => {
    // Arrange
    const modes = [makeMode('m1', ['w1'], [recAct([1], '08:00', '12:00')])];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toEqual([]);
  });

  it('2 modes con workers distintos sin overlap devuelve vacío', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '08:00', '12:00')]),
      makeMode('m2', ['w2'], [recAct([1], '08:00', '12:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toEqual([]);
  });

  it('2 modes con mismo worker pero scheduledActivations vacías devuelve vacío', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], []),
      makeMode('m2', ['w1'], []),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toEqual([]);
  });
});

describe('detectEmployeeConflicts detection', () => {
  it('2 modes con mismo worker overlap mismo día devuelve 1 conflict', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '08:00', '14:00')]),
      makeMode('m2', ['w1'], [recAct([1], '12:00', '18:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].workerId).toBe('w1');
    expect(result[0].modeIdA).toBe('m1');
    expect(result[0].modeIdB).toBe('m2');
    expect(result[0].day).toBe(1);
  });

  it('2 modes con mismo worker overlap parcial 1 hora devuelve conflict con franja exacta', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '11:00', '15:00')]),
      makeMode('m2', ['w1'], [recAct([1], '14:00', '18:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].startMin).toBe(14 * 60);
    expect(result[0].endMin).toBe(15 * 60);
  });

  it('2 modes con mismo worker sin overlap (días distintos) devuelve vacío', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '08:00', '14:00')]),
      makeMode('m2', ['w1'], [recAct([2], '08:00', '14:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toEqual([]);
  });

  it('3 modes con mismo worker overlap múltiple devuelve conflicts pairwise', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '08:00', '14:00')]),
      makeMode('m2', ['w1'], [recAct([1], '10:00', '16:00')]),
      makeMode('m3', ['w1'], [recAct([1], '12:00', '18:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result.length).toBeGreaterThanOrEqual(3); // m1-m2, m1-m3, m2-m3
  });
});

describe('detectEmployeeConflicts cross-day', () => {
  it('Mode A Wed 23-03, Mode B Thu 02-06 devuelve conflict Thu 02-03', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([3], '23:00', '03:00')]),
      makeMode('m2', ['w1'], [recAct([4], '02:00', '06:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].day).toBe(4);
    expect(result[0].startMin).toBe(2 * 60);
    expect(result[0].endMin).toBe(3 * 60);
  });
});

describe('detectEmployeeConflicts multiple workers', () => {
  it('Mode A [X,Y], Mode B [X,Z] overlap devuelve 1 conflict (solo X)', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1', 'w2'], [recAct([1], '08:00', '14:00')]),
      makeMode('m2', ['w1', 'w3'], [recAct([1], '10:00', '16:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].workerId).toBe('w1');
  });

  it('Mode A [X,Y], Mode B [X,Y] overlap devuelve 2 conflicts', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1', 'w2'], [recAct([1], '08:00', '14:00')]),
      makeMode('m2', ['w1', 'w2'], [recAct([1], '10:00', '16:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toHaveLength(2);
    const workerIds = result.map(c => c.workerId).sort();
    expect(workerIds).toEqual(['w1', 'w2']);
  });
});

describe('detectEmployeeConflicts complex scenarios', () => {
  it('mode.isDefault no recibe trato especial', () => {
    // Arrange
    const modes = [
      { ...makeMode('m1', ['w1'], [recAct([1], '08:00', '14:00')]), isDefault: true },
      makeMode('m2', ['w1'], [recAct([1], '10:00', '16:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toHaveLength(1);
  });

  it('boundary exclusiva: A termina 15:00, B empieza 15:00 → vacío', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '08:00', '15:00')]),
      makeMode('m2', ['w1'], [recAct([1], '15:00', '20:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toEqual([]);
  });

  it('dedup: no duplicate conflicts from same pair', () => {
    // Arrange — same pair, same overlap, should appear once
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '08:00', '14:00')]),
      makeMode('m2', ['w1'], [recAct([1], '10:00', '16:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result).toHaveLength(1);
  });

  it('conflict shape has all required fields', () => {
    // Arrange
    const modes = [
      makeMode('m1', ['w1'], [recAct([1], '08:00', '14:00')]),
      makeMode('m2', ['w1'], [recAct([1], '10:00', '16:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result[0]).toHaveProperty('workerId');
    expect(result[0]).toHaveProperty('modeIdA');
    expect(result[0]).toHaveProperty('modeIdB');
    expect(result[0]).toHaveProperty('day');
    expect(result[0]).toHaveProperty('startMin');
    expect(result[0]).toHaveProperty('endMin');
  });

  it('modeIdA is the mode appearing first in the array', () => {
    // Arrange
    const modes = [
      makeMode('first', ['w1'], [recAct([1], '08:00', '14:00')]),
      makeMode('second', ['w1'], [recAct([1], '10:00', '16:00')]),
    ];
    // Act
    const result = detectEmployeeConflicts(modes);
    // Assert
    expect(result[0].modeIdA).toBe('first');
    expect(result[0].modeIdB).toBe('second');
  });
});
