import { attachEnvelope, markPending, markSynced } from '../../src/utils/entityEnvelope';

describe('attachEnvelope', () => {
  it('adds all default fields', () => {
    // Arrange
    const entity = { id: '1', name: 'Test' };
    // Act
    const result = attachEnvelope(entity, { deviceId: 'dev-1' });
    // Assert
    expect(result.accountId).toBeNull();
    expect(result.deviceId).toBe('dev-1');
    expect(result.syncState).toBe('local');
    expect(result.serverUpdatedAt).toBeNull();
  });

  it('preserves existing accountId', () => {
    // Arrange
    const entity = { id: '1', accountId: 'acc-1' };
    // Act
    const result = attachEnvelope(entity, { deviceId: 'dev-1' });
    // Assert
    expect(result.accountId).toBe('acc-1');
  });

  it('preserves existing deviceId', () => {
    // Arrange
    const entity = { id: '1', deviceId: 'old-dev' };
    // Act
    const result = attachEnvelope(entity, { deviceId: 'new-dev' });
    // Assert
    expect(result.deviceId).toBe('old-dev');
  });

  it('preserves existing syncState', () => {
    // Arrange
    const entity = { id: '1', syncState: 'synced' };
    // Act
    const result = attachEnvelope(entity, { deviceId: 'dev-1' });
    // Assert
    expect(result.syncState).toBe('synced');
  });

  it('preserves existing serverUpdatedAt', () => {
    // Arrange
    const entity = { id: '1', serverUpdatedAt: '2026-01-01T00:00:00Z' };
    // Act
    const result = attachEnvelope(entity, { deviceId: 'dev-1' });
    // Assert
    expect(result.serverUpdatedAt).toBe('2026-01-01T00:00:00Z');
  });

  it('throws if no deviceId available', () => {
    // Arrange
    const entity = { id: '1' };
    // Act / Assert
    expect(() => attachEnvelope(entity, {})).toThrow('deviceId is required');
  });

  it('is idempotent', () => {
    // Arrange
    const entity = { id: '1', name: 'Test' };
    // Act
    const first = attachEnvelope(entity, { deviceId: 'dev-1' });
    const second = attachEnvelope(first, { deviceId: 'dev-2' });
    // Assert
    expect(second.deviceId).toBe('dev-1');
    expect(second.syncState).toBe('local');
  });

  it('preserves original entity fields', () => {
    // Arrange
    const entity = { id: '1', name: 'Product', total: 5.00 };
    // Act
    const result = attachEnvelope(entity, { deviceId: 'dev-1' });
    // Assert
    expect(result.name).toBe('Product');
    expect(result.total).toBe(5.00);
  });
});

describe('markPending', () => {
  it('sets syncState to pending', () => {
    // Arrange
    const entity = { id: '1', syncState: 'local' };
    // Act
    const result = markPending(entity);
    // Assert
    expect(result.syncState).toBe('pending');
  });

  it('does not mutate original', () => {
    // Arrange
    const entity = { id: '1', syncState: 'local' };
    // Act
    markPending(entity);
    // Assert
    expect(entity.syncState).toBe('local');
  });
});

describe('markSynced', () => {
  it('sets syncState and serverUpdatedAt', () => {
    // Arrange
    const entity = { id: '1', syncState: 'pending' };
    const ts = '2026-04-14T12:00:00Z';
    // Act
    const result = markSynced(entity, ts);
    // Assert
    expect(result.syncState).toBe('synced');
    expect(result.serverUpdatedAt).toBe(ts);
  });
});
