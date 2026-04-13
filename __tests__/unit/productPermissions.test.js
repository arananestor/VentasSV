/**
 * Product permissions — pure logic tests (no component rendering)
 * Tests the save permission logic in AddProductScreen
 * using real functions from workerLogic
 */

import {
  canSaveProduct,
  isAdmin,
} from '../../src/utils/workerLogic';

const owner = { id: 'owner', role: 'owner', name: 'Carlos' };
const coAdmin = { id: '2', role: 'co-admin', name: 'Luis' };
const worker = { id: '1', role: 'worker', name: 'Ana' };

describe('AddProductScreen save permissions', () => {

  describe('canSaveProduct', () => {
    it('owner puede guardar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(owner);

      // Assert
      expect(result).toBe(true);
    });

    it('encargado (co-admin) puede guardar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(coAdmin);

      // Assert
      expect(result).toBe(true);
    });

    it('worker normal NO puede guardar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(worker);

      // Assert
      expect(result).toBe(false);
    });

    it('null NO puede guardar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(null);

      // Assert
      expect(result).toBe(false);
    });

    it('undefined NO puede guardar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(undefined);

      // Assert
      expect(result).toBe(false);
    });

    it('role admin inexistente NO puede guardar', () => {
      // Arrange
      const fakeAdmin = { id: '5', role: 'admin', name: 'Fake' };

      // Act
      const result = canSaveProduct(fakeAdmin);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isAdmin — consistencia con canSaveProduct', () => {
    it('isAdmin(owner) === canSaveProduct(owner)', () => {
      // Arrange / Act
      const adminResult = isAdmin(owner);
      const saveResult = canSaveProduct(owner);

      // Assert
      expect(adminResult).toBe(saveResult);
    });

    it('isAdmin(coAdmin) === canSaveProduct(coAdmin)', () => {
      // Arrange / Act
      const adminResult = isAdmin(coAdmin);
      const saveResult = canSaveProduct(coAdmin);

      // Assert
      expect(adminResult).toBe(saveResult);
    });

    it('isAdmin(worker) === canSaveProduct(worker)', () => {
      // Arrange / Act
      const adminResult = isAdmin(worker);
      const saveResult = canSaveProduct(worker);

      // Assert
      expect(adminResult).toBe(saveResult);
    });
  });
});
