import { migrateEntityToV4, migrateCollectionToV4 } from '../../src/utils/schemaMigrationV4';

describe('migrateEntityToV4', () => {
  it('adds envelope to entity without it', () => {
    // Arrange
    const entity = { id: '1', name: 'Test' };
    // Act
    const result = migrateEntityToV4(entity, 'dev-1');
    // Assert
    expect(result.deviceId).toBe('dev-1');
    expect(result.accountId).toBeNull();
    expect(result.syncState).toBe('local');
    expect(result.serverUpdatedAt).toBeNull();
  });

  it('preserves existing envelope', () => {
    // Arrange
    const entity = { id: '1', deviceId: 'old', syncState: 'synced', accountId: 'acc', serverUpdatedAt: '2026' };
    // Act
    const result = migrateEntityToV4(entity, 'new-dev');
    // Assert
    expect(result.deviceId).toBe('old');
    expect(result.syncState).toBe('synced');
  });

  it('is idempotent', () => {
    // Arrange
    const entity = { id: '1', name: 'X' };
    // Act
    const first = migrateEntityToV4(entity, 'dev-1');
    const second = migrateEntityToV4(first, 'dev-2');
    // Assert
    expect(second.deviceId).toBe('dev-1');
  });

  it('preserves all original fields', () => {
    // Arrange
    const entity = { id: '1', productName: 'Pupusa', total: 3.00 };
    // Act
    const result = migrateEntityToV4(entity, 'dev-1');
    // Assert
    expect(result.productName).toBe('Pupusa');
    expect(result.total).toBe(3.00);
  });

  it('preserves original id', () => {
    // Arrange
    const entity = { id: 'old-date-now-id' };
    // Act
    const result = migrateEntityToV4(entity, 'dev-1');
    // Assert
    expect(result.id).toBe('old-date-now-id');
  });
});

describe('migrateCollectionToV4', () => {
  it('empty array returns empty', () => {
    // Arrange / Act
    const result = migrateCollectionToV4([], 'dev-1');
    // Assert
    expect(result).toEqual([]);
  });

  it('migrates mixed collection', () => {
    // Arrange
    const collection = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B', deviceId: 'dev-x', syncState: 'synced' },
    ];
    // Act
    const result = migrateCollectionToV4(collection, 'dev-1');
    // Assert
    expect(result[0].deviceId).toBe('dev-1');
    expect(result[1].deviceId).toBe('dev-x');
    expect(result.every(e => e.syncState)).toBe(true);
  });

  it('is idempotent', () => {
    // Arrange
    const collection = [{ id: '1' }];
    // Act
    const first = migrateCollectionToV4(collection, 'dev-1');
    const second = migrateCollectionToV4(first, 'dev-2');
    // Assert
    expect(second[0].deviceId).toBe('dev-1');
  });

  it('does not change deviceId if entity already has one', () => {
    // Arrange
    const collection = [{ id: '1', deviceId: 'original', syncState: 'local' }];
    // Act
    const result = migrateCollectionToV4(collection, 'new-dev');
    // Assert
    expect(result[0].deviceId).toBe('original');
  });

  it('sets accountId to null', () => {
    // Arrange
    const collection = [{ id: '1' }];
    // Act
    const result = migrateCollectionToV4(collection, 'dev-1');
    // Assert
    expect(result[0].accountId).toBeNull();
  });
});
