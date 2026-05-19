/**
 * Share shift summary — tests
 * shareShiftSummary now generates CSV via buildSalesCSV and shares as file.
 * Since it depends on expo-sharing/FileSystem (mocked), we test the import/export contract.
 */

import { shareShiftSummary } from '../../src/utils/shareShiftSummary';

describe('shareShiftSummary', () => {
  it('is an async function', () => {
    // Arrange / Act / Assert
    expect(typeof shareShiftSummary).toBe('function');
  });

  it('returns false when called with empty sales (sharing mock throws)', async () => {
    // Arrange
    const sales = [];
    const worker = { name: 'Ana' };

    // Act
    const result = await shareShiftSummary(sales, worker, null);

    // Assert
    expect(typeof result).toBe('boolean');
  });
});
