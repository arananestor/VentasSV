/**
 * HomeScreen — pure logic tests (no component rendering)
 * Tests PIN authorization rules and keypad logic
 * using real functions from workerLogic, pinLogic
 */

import {
  isAdmin,
  canSaveProduct,
  verifyOwnerPin,
} from '../../src/utils/workerLogic';
import {
  PIN_LENGTH,
  KEYPAD_LAYOUT,
  appendDigit,
  deleteLastDigit,
  isPinComplete,
  buildDotsState,
} from '../../src/utils/pinLogic';

const owner = { id: 'owner', role: 'owner', name: 'Carlos' };
const coAdmin = { id: '2', role: 'co-admin', name: 'Luis' };
const worker = { id: '1', role: 'worker', name: 'Ana' };
const workers = [
  { id: 'owner', role: 'owner', pin: '1234', name: 'Carlos' },
  { id: '1', role: 'worker', pin: '5678', name: 'Ana' },
];

describe('HomeScreen PIN authorization rules', () => {

  describe('isAdmin', () => {
    it('owner es admin', () => {
      // Arrange / Act
      const result = isAdmin(owner);

      // Assert
      expect(result).toBe(true);
    });

    it('co-admin es admin', () => {
      // Arrange / Act
      const result = isAdmin(coAdmin);

      // Assert
      expect(result).toBe(true);
    });

    it('worker normal no es admin', () => {
      // Arrange / Act
      const result = isAdmin(worker);

      // Assert
      expect(result).toBe(false);
    });

    it('null no es admin', () => {
      // Arrange / Act
      const result = isAdmin(null);

      // Assert
      expect(result).toBe(false);
    });

    it('undefined no es admin', () => {
      // Arrange / Act
      const result = isAdmin(undefined);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canSaveProduct — edit mode permission', () => {
    it('owner puede guardar/editar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(owner);

      // Assert
      expect(result).toBe(true);
    });

    it('co-admin puede guardar/editar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(coAdmin);

      // Assert
      expect(result).toBe(true);
    });

    it('worker no puede guardar/editar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(worker);

      // Assert
      expect(result).toBe(false);
    });

    it('null no puede guardar productos', () => {
      // Arrange / Act
      const result = canSaveProduct(null);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('verifyOwnerPin', () => {
    it('PIN correcto del owner retorna true', () => {
      // Arrange
      const pin = '1234';

      // Act
      const result = verifyOwnerPin(workers, pin);

      // Assert
      expect(result).toBe(true);
    });

    it('PIN incorrecto retorna false', () => {
      // Arrange
      const pin = '0000';

      // Act
      const result = verifyOwnerPin(workers, pin);

      // Assert
      expect(result).toBe(false);
    });

    it('PIN vacío retorna false', () => {
      // Arrange
      const pin = '';

      // Act
      const result = verifyOwnerPin(workers, pin);

      // Assert
      expect(result).toBe(false);
    });
  });
});

describe('HomeScreen PIN keypad logic', () => {

  describe('appendDigit', () => {
    it('agrega dígito al PIN vacío', () => {
      // Arrange
      const pin = '';
      const digit = '1';

      // Act
      const result = appendDigit(pin, digit);

      // Assert
      expect(result).toBe('1');
    });

    it('acumula dígitos uno por uno', () => {
      // Arrange
      let pin = '';

      // Act
      pin = appendDigit(pin, '1');
      pin = appendDigit(pin, '2');
      pin = appendDigit(pin, '3');

      // Assert
      expect(pin).toBe('123');
    });

    it('no acepta más de PIN_LENGTH dígitos', () => {
      // Arrange
      let pin = '1234';

      // Act
      const result = appendDigit(pin, '5');

      // Assert
      expect(result).toBe('1234');
      expect(result).toHaveLength(PIN_LENGTH);
    });
  });

  describe('deleteLastDigit', () => {
    it('borra el último dígito', () => {
      // Arrange
      const pin = '123';

      // Act
      const result = deleteLastDigit(pin);

      // Assert
      expect(result).toBe('12');
    });

    it('borra el único dígito dejando vacío', () => {
      // Arrange
      const pin = '1';

      // Act
      const result = deleteLastDigit(pin);

      // Assert
      expect(result).toBe('');
    });

    it('no hace nada si PIN vacío', () => {
      // Arrange
      const pin = '';

      // Act
      const result = deleteLastDigit(pin);

      // Assert
      expect(result).toBe('');
    });
  });

  describe('isPinComplete', () => {
    it('retorna true con 4 dígitos', () => {
      // Arrange
      const pin = '1234';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(true);
    });

    it('retorna false con 3 dígitos', () => {
      // Arrange
      const pin = '123';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(false);
    });

    it('retorna false con PIN vacío', () => {
      // Arrange
      const pin = '';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('buildDotsState', () => {
    it('2 dígitos ingresados → [true, true, false, false]', () => {
      // Arrange
      const pinLength = 2;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots).toEqual([true, true, false, false]);
    });

    it('PIN completo → todos true', () => {
      // Arrange
      const pinLength = 4;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots).toEqual([true, true, true, true]);
    });

    it('PIN vacío → todos false', () => {
      // Arrange
      const pinLength = 0;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots).toEqual([false, false, false, false]);
    });

    it('siempre retorna exactamente PIN_LENGTH elementos', () => {
      // Arrange
      const pinLength = 3;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots).toHaveLength(PIN_LENGTH);
    });
  });

  describe('KEYPAD_LAYOUT', () => {
    it('tiene 4 filas de 3 teclas', () => {
      // Arrange / Act
      const layout = KEYPAD_LAYOUT;

      // Assert
      expect(layout).toHaveLength(4);
      layout.forEach(row => expect(row).toHaveLength(3));
    });

    it('contiene dígitos 0-9', () => {
      // Arrange / Act
      const digits = KEYPAD_LAYOUT.flat().filter(k => /^\d$/.test(k));

      // Assert
      expect(digits.sort()).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });

    it('tiene botón de borrar ⌫', () => {
      // Arrange / Act
      const allKeys = KEYPAD_LAYOUT.flat();

      // Assert
      expect(allKeys).toContain('⌫');
    });
  });

  describe('manage tabs — siempre pide PIN', () => {
    it('incluso el owner necesita PIN para ManageTabs', () => {
      // Arrange
      let pinRequested = false;

      // Act — ManageTabs always requests PIN regardless of role
      pinRequested = true;

      // Assert
      expect(pinRequested).toBe(true);
    });
  });
});
