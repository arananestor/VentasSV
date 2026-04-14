import { STORAGE_KEYS, getCurrentModeId, setCurrentModeId } from '../../../src/data/repository';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('repository modes', () => {
  it('STORAGE_KEYS includes modes and currentModeId', () => {
    // Arrange / Act / Assert
    expect(STORAGE_KEYS.modes).toBe('ventasv_modes');
    expect(STORAGE_KEYS.currentModeId).toBe('ventasv_current_mode_id');
  });

  it('getCurrentModeId returns null when not set', async () => {
    // Arrange
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    // Act
    const result = await getCurrentModeId();
    // Assert
    expect(result).toBeNull();
  });

  it('setCurrentModeId calls setItem with correct key', async () => {
    // Arrange
    const modeId = 'test-mode-123';
    // Act
    await setCurrentModeId(modeId);
    // Assert
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('ventasv_current_mode_id', modeId);
  });

  it('getCurrentModeId reads persisted value', async () => {
    // Arrange
    AsyncStorage.getItem.mockResolvedValueOnce('my-mode-id');
    // Act
    const result = await getCurrentModeId();
    // Assert
    expect(result).toBe('my-mode-id');
  });
});
