/**
 * Conflict helpers — pure logic tests
 */

const { getConflictDescription, computeAvatarsInCell, hasConflictInCell } = require('../../src/utils/conflictHelpers');

describe('getConflictDescription', () => {
  it('returns shape with all fields for valid conflict', () => {
    // Arrange
    const conflict = { workerId: 'w1', modeIdA: 'm1', modeIdB: 'm2', day: 1, startMin: 720, endMin: 840 };
    const modes = [{ id: 'm1', name: 'Almuerzo' }, { id: 'm2', name: 'Evento' }];
    const workers = [{ id: 'w1', name: 'María' }];

    // Act
    const result = getConflictDescription(conflict, modes, workers);

    // Assert
    expect(result.workerName).toBe('María');
    expect(result.modeAName).toBe('Almuerzo');
    expect(result.modeBName).toBe('Evento');
    expect(result.dayLabel).toBe('Lun');
    expect(result.timeRange).toBe('12:00 a 14:00');
  });
});

describe('computeAvatarsInCell', () => {
  const workers = [
    { id: 'w1', name: 'Ana', role: 'worker', color: '#FF0000' },
    { id: 'w2', name: 'Bob', role: 'worker', color: '#00FF00' },
    { id: 'w3', name: 'Carlos', role: 'worker', color: '#0000FF' },
    { id: 'w4', name: 'Diana', role: 'worker', color: '#FF00FF' },
    { id: 'w5', name: 'Eva', role: 'worker', color: '#FFFF00' },
  ];

  it('sin workers devuelve visible vacío y overflowCount 0', () => {
    // Arrange
    const modes = [{ id: 'm1', assignedWorkerIds: [] }];
    const activations = [{ type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00', modeId: 'm1' }];

    // Act
    const result = computeAvatarsInCell(activations, modes, workers, 1, 480, 720);

    // Assert
    expect(result.visible).toHaveLength(0);
    expect(result.overflowCount).toBe(0);
  });

  it('2 workers devuelve 2 visibles sin overflow', () => {
    // Arrange
    const modes = [{ id: 'm1', assignedWorkerIds: ['w1', 'w2'] }];
    const activations = [{ type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00', modeId: 'm1' }];

    // Act
    const result = computeAvatarsInCell(activations, modes, workers, 1, 480, 720);

    // Assert
    expect(result.visible).toHaveLength(2);
    expect(result.overflowCount).toBe(0);
  });

  it('5 workers devuelve 3 visibles y overflowCount 2', () => {
    // Arrange
    const modes = [{ id: 'm1', assignedWorkerIds: ['w1', 'w2', 'w3', 'w4', 'w5'] }];
    const activations = [{ type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00', modeId: 'm1' }];

    // Act
    const result = computeAvatarsInCell(activations, modes, workers, 1, 480, 720);

    // Assert
    expect(result.visible).toHaveLength(3);
    expect(result.overflowCount).toBe(2);
  });

  it('isOwner true for owner role, false for others', () => {
    // Arrange
    const ownerWorkers = [
      { id: 'w1', name: 'Ana', role: 'owner' },
      { id: 'w2', name: 'Bob', role: 'worker', color: '#FF0000' },
    ];
    const modes = [{ id: 'm1', assignedWorkerIds: ['w1', 'w2'] }];
    const activations = [{ type: 'recurrente', days: [1], startTime: '08:00', endTime: '12:00', modeId: 'm1' }];

    // Act
    const result = computeAvatarsInCell(activations, modes, ownerWorkers, 1, 480, 720);

    // Assert
    const ownerAvatar = result.visible.find(a => a.workerId === 'w1');
    const workerAvatar = result.visible.find(a => a.workerId === 'w2');
    expect(ownerAvatar.isOwner).toBe(true);
    expect(workerAvatar.isOwner).toBe(false);
  });
});

describe('hasConflictInCell', () => {
  it('conflict en rango devuelve true', () => {
    // Arrange
    const conflicts = [{ day: 1, startMin: 600, endMin: 720 }];

    // Act
    const result = hasConflictInCell(conflicts, 1, 600, 720);

    // Assert
    expect(result).toBe(true);
  });

  it('sin conflict devuelve false', () => {
    // Arrange
    const conflicts = [{ day: 1, startMin: 600, endMin: 720 }];

    // Act
    const result = hasConflictInCell(conflicts, 2, 600, 720);

    // Assert
    expect(result).toBe(false);
  });

  it('boundary exclusiva devuelve false', () => {
    // Arrange — conflict ends at 720, cell starts at 720
    const conflicts = [{ day: 1, startMin: 600, endMin: 720 }];

    // Act
    const result = hasConflictInCell(conflicts, 1, 720, 840);

    // Assert
    expect(result).toBe(false);
  });
});
