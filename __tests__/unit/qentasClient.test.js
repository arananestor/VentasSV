import qentasClient from '../../src/services/qentasClient';

describe('qentasClient stub', () => {
  it('isConnected returns false', () => {
    // Arrange / Act
    const result = qentasClient.isConnected();
    // Assert
    expect(result).toBe(false);
  });

  it('getAccount returns null', () => {
    // Arrange / Act
    const result = qentasClient.getAccount();
    // Assert
    expect(result).toBeNull();
  });

  it('pushEvent resolves with empty event', async () => {
    // Arrange / Act / Assert
    await expect(qentasClient.pushEvent({})).resolves.toBeUndefined();
  });

  it('pushEvent resolves with payload event', async () => {
    // Arrange
    const event = { type: 'sale_created', entityId: '123', payload: { total: 5 } };
    // Act / Assert
    await expect(qentasClient.pushEvent(event)).resolves.toBeUndefined();
  });

  it('connect resolves with error', async () => {
    // Arrange / Act
    const result = await qentasClient.connect({});
    // Assert
    expect(result).toEqual({ error: 'qentas_not_available' });
  });

  it('connect with credentials also resolves error', async () => {
    // Arrange / Act
    const result = await qentasClient.connect({ email: 'a@b.com', password: '1234' });
    // Assert
    expect(result).toEqual({ error: 'qentas_not_available' });
  });

  it('disconnect resolves without error', async () => {
    // Arrange / Act / Assert
    await expect(qentasClient.disconnect()).resolves.toBeUndefined();
  });

  it('subscribe returns callable unsubscribe function', () => {
    // Arrange / Act
    const unsub = qentasClient.subscribe('sales', () => {});
    // Assert
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
  });
});
