/**
 * Permissions matrix — pure logic tests
 * Tests can() and PERMISSIONS using real exports from src/utils/permissions
 */

const { PERMISSIONS, can } = require('../../src/utils/permissions');

const owner = { id: 'owner', role: 'owner' };
const coAdmin = { id: '2', role: 'co-admin' };
const worker = { id: '3', role: 'worker', puesto: 'Cajero' };

describe('can() edge cases', () => {
  it('null worker returns false', () => {
    // Arrange / Act
    const result = can(null, 'use-pos');
    // Assert
    expect(result).toBe(false);
  });

  it('undefined worker returns false', () => {
    // Arrange / Act
    const result = can(undefined, 'use-pos');
    // Assert
    expect(result).toBe(false);
  });

  it('worker without role returns false', () => {
    // Arrange / Act
    const result = can({ id: 'x' }, 'use-pos');
    // Assert
    expect(result).toBe(false);
  });

  it('worker with invalid role returns false', () => {
    // Arrange / Act
    const result = can({ id: 'x', role: 'superadmin' }, 'use-pos');
    // Assert
    expect(result).toBe(false);
  });

  it('empty action returns false', () => {
    // Arrange / Act
    const result = can(owner, '');
    // Assert
    expect(result).toBe(false);
  });

  it('non-existent action returns false', () => {
    // Arrange / Act
    const result = can(owner, 'fly-to-the-moon');
    // Assert
    expect(result).toBe(false);
  });
});

describe('owner permissions', () => {
  it('can use-pos', () => {
    // Arrange / Act
    const result = can(owner, 'use-pos');
    // Assert
    expect(result).toBe(true);
  });

  it('can edit-business-config', () => {
    // Arrange / Act
    const result = can(owner, 'edit-business-config');
    // Assert
    expect(result).toBe(true);
  });

  it('can view-historical-sales', () => {
    // Arrange / Act
    const result = can(owner, 'view-historical-sales');
    // Assert
    expect(result).toBe(true);
  });

  it('can create-employee', () => {
    // Arrange / Act
    const result = can(owner, 'create-employee');
    // Assert
    expect(result).toBe(true);
  });
});

describe('co-admin permitted actions', () => {
  it('can use-pos', () => {
    // Arrange / Act
    const result = can(coAdmin, 'use-pos');
    // Assert
    expect(result).toBe(true);
  });

  it('can view-orders', () => {
    // Arrange / Act
    const result = can(coAdmin, 'view-orders');
    // Assert
    expect(result).toBe(true);
  });

  it('can view-day-sales', () => {
    // Arrange / Act
    const result = can(coAdmin, 'view-day-sales');
    // Assert
    expect(result).toBe(true);
  });

  it('can share-shift-summary', () => {
    // Arrange / Act
    const result = can(coAdmin, 'share-shift-summary');
    // Assert
    expect(result).toBe(true);
  });

  it('can view-catalogs', () => {
    // Arrange / Act
    const result = can(coAdmin, 'view-catalogs');
    // Assert
    expect(result).toBe(true);
  });

  it('can view-employee-basic-info', () => {
    // Arrange / Act
    const result = can(coAdmin, 'view-employee-basic-info');
    // Assert
    expect(result).toBe(true);
  });
});

describe('co-admin restricted actions — security critical', () => {
  it('cannot edit-business-config', () => {
    // Arrange / Act
    const result = can(coAdmin, 'edit-business-config');
    // Assert
    expect(result).toBe(false);
  });

  it('cannot edit-catalogs', () => {
    // Arrange / Act
    const result = can(coAdmin, 'edit-catalogs');
    // Assert
    expect(result).toBe(false);
  });

  it('cannot view-historical-sales', () => {
    // Arrange / Act
    const result = can(coAdmin, 'view-historical-sales');
    // Assert
    expect(result).toBe(false);
  });

  it('cannot toggle-owner-mode', () => {
    // Arrange / Act
    const result = can(coAdmin, 'toggle-owner-mode');
    // Assert
    expect(result).toBe(false);
  });

  it('cannot create-employee', () => {
    // Arrange / Act
    const result = can(coAdmin, 'create-employee');
    // Assert
    expect(result).toBe(false);
  });
});

describe('worker permissions', () => {
  it('worker cannot use matrix actions (filtered by puesto, not matrix)', () => {
    // Arrange / Act
    const result = can(worker, 'use-pos');
    // Assert
    expect(result).toBe(false);
  });
});

describe('matrix integrity', () => {
  it('PERMISSIONS contains exactly 18 unique action keys', () => {
    // Arrange
    const ownerActions = Object.keys(PERMISSIONS.owner);
    // Act
    const unique = new Set(ownerActions);
    // Assert
    expect(unique.size).toBe(18);
  });

  it('can() does not mutate PERMISSIONS', () => {
    // Arrange
    const before = JSON.stringify(PERMISSIONS);
    // Act
    can(owner, 'use-pos');
    can(coAdmin, 'edit-catalogs');
    can(null, 'use-pos');
    // Assert
    expect(JSON.stringify(PERMISSIONS)).toBe(before);
  });
});
