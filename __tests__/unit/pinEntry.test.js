/**
 * PinEntryScreen — pure logic tests (no component rendering)
 * Tests the PIN entry business rules using real functions from pinLogic and workerLogic
 */

import { generatePin } from '../../src/context/AuthContext';
import {
  PIN_LENGTH,
  KEYPAD_LAYOUT,
  appendDigit,
  deleteLastDigit,
  isPinComplete,
  isDotFilled,
  buildDotsState,
} from '../../src/utils/pinLogic';
import {
  loginMatch,
  isValidPin,
} from '../../src/utils/workerLogic';
import { getAvatarInitial, getPuestoDisplay } from '../../src/utils/uiLogic';

const mockWorker = {
  id: '1', name: 'Ana García', role: 'worker',
  puesto: 'Cajero', pin: '1234', color: '#FF6B6B',
};

const mockWorkerNoPuesto = {
  id: '3', name: 'María López', role: 'worker',
  pin: '9012', color: '#45B7D1',
};

const workers = [mockWorker, mockWorkerNoPuesto];

describe('PinEntryScreen logic', () => {

  describe('isValidPin — validación de formato', () => {
    it('PIN de 4 dígitos es válido', () => {
      // Arrange
      const pin = '1234';

      // Act
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(true);
    });

    it('PIN vacío no es válido', () => {
      // Arrange
      const pin = '';

      // Act
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(false);
    });

    it('PIN de 3 dígitos no es válido', () => {
      // Arrange
      const pin = '123';

      // Act
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(false);
    });

    it('PIN de 5 dígitos no es válido', () => {
      // Arrange
      const pin = '12345';

      // Act
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(false);
    });

    it('PIN con letras no es válido', () => {
      // Arrange
      const pin = '12ab';

      // Act
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(false);
    });

    it('PIN con solo ceros es válido', () => {
      // Arrange
      const pin = '0000';

      // Act
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('appendDigit — PIN accumulation', () => {
    it('acumula dígitos uno por uno', () => {
      // Arrange
      let pin = '';

      // Act
      pin = appendDigit(pin, '1');
      pin = appendDigit(pin, '2');
      pin = appendDigit(pin, '3');

      // Assert
      expect(pin).toBe('123');
      expect(pin.length).toBe(3);
    });

    it('llega a PIN_LENGTH con 4 dígitos', () => {
      // Arrange
      let pin = '';

      // Act
      pin = appendDigit(pin, '1');
      pin = appendDigit(pin, '2');
      pin = appendDigit(pin, '3');
      pin = appendDigit(pin, '4');

      // Assert
      expect(pin.length).toBe(PIN_LENGTH);
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

  describe('isPinComplete — trigger de login', () => {
    it('retorna true cuando PIN tiene 4 dígitos exactos', () => {
      // Arrange
      const pin = '1234';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(true);
    });

    it('no está completo con 3 dígitos', () => {
      // Arrange
      const pin = '123';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(false);
    });

    it('no está completo con PIN vacío', () => {
      // Arrange
      const pin = '';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('loginMatch — validación del PIN', () => {
    it('PIN correcto retorna el worker', () => {
      // Arrange
      const pin = '1234';
      const workerId = '1';

      // Act
      const result = loginMatch(workers, pin, workerId);

      // Assert
      expect(result).toEqual(mockWorker);
    });

    it('PIN incorrecto retorna null', () => {
      // Arrange
      const pin = '0000';
      const workerId = '1';

      // Act
      const result = loginMatch(workers, pin, workerId);

      // Assert
      expect(result).toBeNull();
    });

    it('worker id incorrecto retorna null', () => {
      // Arrange
      const pin = '1234';
      const workerId = '999';

      // Act
      const result = loginMatch(workers, pin, workerId);

      // Assert
      expect(result).toBeNull();
    });

    it('array vacío retorna null', () => {
      // Arrange
      const pin = '1234';
      const workerId = '1';

      // Act
      const result = loginMatch([], pin, workerId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteLastDigit — manejo de borrar', () => {
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

    it('no hace nada con PIN vacío', () => {
      // Arrange
      const pin = '';

      // Act
      const result = deleteLastDigit(pin);

      // Assert
      expect(result).toBe('');
    });

    it('permite reingresar dígitos después de borrar', () => {
      // Arrange
      let pin = '12';

      // Act
      pin = deleteLastDigit(pin);
      pin = appendDigit(pin, '5');

      // Assert
      expect(pin).toBe('15');
    });
  });

  describe('worker display data', () => {
    it('getAvatarInitial retorna la inicial del nombre', () => {
      // Arrange
      const name = mockWorker.name;

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('A');
    });

    it('getPuestoDisplay muestra puesto en mayúsculas', () => {
      // Arrange
      const puesto = mockWorker.puesto;

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('CAJERO');
    });

    it('getPuestoDisplay usa fallback EMPLEADO si no tiene puesto', () => {
      // Arrange
      const puesto = mockWorkerNoPuesto.puesto;

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('EMPLEADO');
    });

    it('getAvatarInitial retorna ? para nombre undefined', () => {
      // Arrange
      const name = undefined;

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('?');
    });
  });

  describe('KEYPAD_LAYOUT', () => {
    it('tiene 4 filas', () => {
      // Arrange / Act
      const rows = KEYPAD_LAYOUT;

      // Assert
      expect(rows).toHaveLength(4);
    });

    it('cada fila tiene 3 teclas', () => {
      // Arrange / Act
      const rowLengths = KEYPAD_LAYOUT.map(row => row.length);

      // Assert
      rowLengths.forEach(len => expect(len).toBe(3));
    });

    it('contiene todos los dígitos 0-9', () => {
      // Arrange / Act
      const digits = KEYPAD_LAYOUT.flat().filter(k => /^\d$/.test(k));

      // Assert
      expect(digits.sort()).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });

    it('tiene tecla de borrar ⌫', () => {
      // Arrange / Act
      const allKeys = KEYPAD_LAYOUT.flat();

      // Assert
      expect(allKeys).toContain('⌫');
    });
  });

  describe('PIN dots display', () => {
    it('isDotFilled retorna true cuando índice < pinLength', () => {
      // Arrange
      const index = 0;
      const pinLength = 2;

      // Act
      const result = isDotFilled(index, pinLength);

      // Assert
      expect(result).toBe(true);
    });

    it('isDotFilled retorna false cuando índice >= pinLength', () => {
      // Arrange
      const index = 2;
      const pinLength = 2;

      // Act
      const result = isDotFilled(index, pinLength);

      // Assert
      expect(result).toBe(false);
    });

    it('buildDotsState con 2 dígitos → [true, true, false, false]', () => {
      // Arrange
      const pinLength = 2;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots).toEqual([true, true, false, false]);
    });

    it('siempre retorna PIN_LENGTH elementos', () => {
      // Arrange
      const pinLength = 1;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots).toHaveLength(PIN_LENGTH);
    });
  });

  describe('generación de PIN compatible', () => {
    it('PIN generado tiene exactamente 4 dígitos', () => {
      // Arrange / Act
      const pin = generatePin();

      // Assert
      expect(pin).toHaveLength(4);
    });

    it('PIN generado es compatible con isValidPin', () => {
      // Arrange / Act
      const pin = generatePin();
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(true);
    });
  });
});
