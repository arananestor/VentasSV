import { findModeForWorker } from '../../../src/utils/modeManagement';

describe('findModeForWorker', () => {
  const principal = { id: 'm1', name: 'Principal', isDefault: true, assignedWorkerIds: ['w1'] };
  const festival = { id: 'm2', name: 'Festival', isDefault: false, assignedWorkerIds: ['w2', 'w3'] };
  const modes = [principal, festival];

  it('worker asignado retorna su catálogo', () => {
    // Arrange / Act
    const result = findModeForWorker(modes, 'w2');
    // Assert
    expect(result.id).toBe('m2');
  });

  it('worker sin asignación retorna el default', () => {
    // Arrange / Act
    const result = findModeForWorker(modes, 'w99');
    // Assert
    expect(result.id).toBe('m1');
    expect(result.isDefault).toBe(true);
  });

  it('workerId null retorna default', () => {
    // Arrange / Act
    const result = findModeForWorker(modes, null);
    // Assert
    expect(result.isDefault).toBe(true);
  });

  it('modes vacío retorna null', () => {
    // Arrange / Act
    const result = findModeForWorker([], 'w1');
    // Assert
    expect(result).toBeNull();
  });

  it('mode sin assignedWorkerIds retorna default', () => {
    // Arrange
    const modesNoIds = [{ id: 'm1', isDefault: true }, { id: 'm2', isDefault: false }];
    // Act
    const result = findModeForWorker(modesNoIds, 'w1');
    // Assert
    expect(result.isDefault).toBe(true);
  });

  it('worker asignado a mode no-default retorna ese mode', () => {
    // Arrange
    const modesCustom = [
      { id: 'm1', isDefault: true, assignedWorkerIds: [] },
      { id: 'm2', isDefault: false, assignedWorkerIds: ['w5'] },
    ];
    // Act
    const result = findModeForWorker(modesCustom, 'w5');
    // Assert
    expect(result.id).toBe('m2');
    expect(result.isDefault).toBe(false);
  });

  it('modes sin default y worker sin asignación retorna null', () => {
    // Arrange
    const noDefault = [{ id: 'm1', isDefault: false, assignedWorkerIds: ['w1'] }];
    // Act
    const result = findModeForWorker(noDefault, 'w99');
    // Assert
    expect(result).toBeNull();
  });

  it('undefined modes retorna null', () => {
    // Arrange / Act
    const result = findModeForWorker(undefined, 'w1');
    // Assert
    expect(result).toBeNull();
  });
});
