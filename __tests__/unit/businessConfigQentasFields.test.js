import { migrateBusinessConfigToQentasFields } from '../../src/utils/businessConfigMigration';

describe('migrateBusinessConfigToQentasFields', () => {
  it('adds qentas fields to config without them', () => {
    // Arrange
    const config = { bank: 'Agrícola', holder: 'Carlos', account: '123' };
    // Act
    const result = migrateBusinessConfigToQentasFields(config);
    // Assert
    expect(result.qentasConnected).toBe(false);
    expect(result.qentasAccountId).toBeNull();
  });

  it('preserves qentasConnected true', () => {
    // Arrange
    const config = { bank: 'X', qentasConnected: true };
    // Act
    const result = migrateBusinessConfigToQentasFields(config);
    // Assert
    expect(result.qentasConnected).toBe(true);
  });

  it('preserves qentasAccountId', () => {
    // Arrange
    const config = { bank: 'X', qentasAccountId: 'acc-123' };
    // Act
    const result = migrateBusinessConfigToQentasFields(config);
    // Assert
    expect(result.qentasAccountId).toBe('acc-123');
  });

  it('idempotent', () => {
    // Arrange
    const config = { bank: 'X' };
    // Act
    const first = migrateBusinessConfigToQentasFields(config);
    const second = migrateBusinessConfigToQentasFields(first);
    // Assert
    expect(second).toEqual(first);
  });

  it('preserves other fields', () => {
    // Arrange
    const config = { bank: 'Agrícola', holder: 'Ana', account: '456', qrImage: 'url' };
    // Act
    const result = migrateBusinessConfigToQentasFields(config);
    // Assert
    expect(result.bank).toBe('Agrícola');
    expect(result.holder).toBe('Ana');
    expect(result.qrImage).toBe('url');
  });

  it('returns new object — no mutation', () => {
    // Arrange
    const config = { bank: 'X' };
    // Act
    const result = migrateBusinessConfigToQentasFields(config);
    // Assert
    expect(result).not.toBe(config);
    expect(config.qentasConnected).toBeUndefined();
  });

  it('persisted config without qentas fields gets migrated on load', () => {
    // Arrange — simulates config saved before qentas fields existed
    const persistedConfig = { bank: 'Agrícola', holder: 'Carlos', account: '123' };
    // Act — migration runs at boot
    const migrated = migrateBusinessConfigToQentasFields(persistedConfig);
    // Assert — fields are now present with defaults
    expect(migrated.qentasConnected).toBe(false);
    expect(migrated.qentasAccountId).toBeNull();
    expect(migrated.bank).toBe('Agrícola');
    // Assert — original differs (would trigger persist)
    expect(persistedConfig.qentasConnected).toBeUndefined();
    expect(migrated.qentasConnected !== persistedConfig.qentasConnected).toBe(true);
  });
});
