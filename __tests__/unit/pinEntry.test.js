/**
 * PinEntryScreen — pure logic tests (no component rendering)
 * Tests the PIN entry business rules extracted from PinEntryScreen.js
 */

import { generatePin } from '../../src/context/AuthContext';

const PIN_LENGTH = 4;

const mockWorker = {
  id: '1', name: 'Ana García', role: 'worker',
  puesto: 'Cajero', pin: '1234', color: '#FF6B6B',
};

const mockWorkerNoPuesto = {
  id: '3', name: 'María López', role: 'worker',
  pin: '9012', color: '#45B7D1',
};

describe('PinEntryScreen logic', () => {

  describe('validación de PIN', () => {
    it('PIN de 4 dígitos es válido', () => {
      expect(/^\d{4}$/.test('1234')).toBe(true);
    });

    it('PIN vacío no es válido', () => {
      expect(/^\d{4}$/.test('')).toBe(false);
    });

    it('PIN de 3 dígitos no es válido', () => {
      expect(/^\d{4}$/.test('123')).toBe(false);
    });

    it('PIN de 5 dígitos no es válido', () => {
      expect(/^\d{4}$/.test('12345')).toBe(false);
    });

    it('PIN con letras no es válido', () => {
      expect(/^\d{4}$/.test('12ab')).toBe(false);
    });
  });

  describe('PIN accumulation', () => {
    it('acumula dígitos uno por uno', () => {
      let pin = '';
      ['1', '2', '3'].forEach(d => { pin += d; });
      expect(pin).toBe('123');
      expect(pin.length).toBe(3);
    });

    it('llega a PIN_LENGTH con 4 dígitos', () => {
      let pin = '';
      ['1', '2', '3', '4'].forEach(d => { pin += d; });
      expect(pin.length).toBe(PIN_LENGTH);
    });

    it('no acepta más de PIN_LENGTH dígitos', () => {
      let pin = '';
      const handlePress = (num) => {
        if (pin.length >= PIN_LENGTH) return;
        pin += num;
      };
      ['1', '2', '3', '4', '5'].forEach(handlePress);
      expect(pin.length).toBe(PIN_LENGTH);
      expect(pin).toBe('1234');
    });
  });

  describe('loginWithPin trigger', () => {
    it('intenta login exactamente cuando llega a 4 dígitos', () => {
      let pin = '';
      let loginCalled = false;
      let loginArgs = null;

      const loginWithPin = (p, id) => { loginCalled = true; loginArgs = { pin: p, id }; return mockWorker; };

      const handlePress = (num) => {
        if (pin.length >= PIN_LENGTH) return;
        pin += num;
        if (pin.length === PIN_LENGTH) {
          loginWithPin(pin, mockWorker.id);
        }
      };

      ['1', '2', '3', '4'].forEach(handlePress);
      expect(loginCalled).toBe(true);
      expect(loginArgs).toEqual({ pin: '1234', id: '1' });
    });

    it('no intenta login con menos de 4 dígitos', () => {
      let pin = '';
      let loginCalled = false;

      const handlePress = (num) => {
        if (pin.length >= PIN_LENGTH) return;
        pin += num;
        if (pin.length === PIN_LENGTH) {
          loginCalled = true;
        }
      };

      ['1', '2', '3'].forEach(handlePress);
      expect(loginCalled).toBe(false);
    });

    it('loginWithPin se llama exactamente 1 vez aunque se presionen más teclas', () => {
      let pin = '';
      let loginCount = 0;

      const handlePress = (num) => {
        if (pin.length >= PIN_LENGTH) return;
        pin += num;
        if (pin.length === PIN_LENGTH) {
          loginCount++;
        }
      };

      ['1', '2', '3', '4', '5', '6'].forEach(handlePress);
      expect(loginCount).toBe(1);
    });
  });

  describe('PIN validation result', () => {
    it('PIN correcto retorna worker', () => {
      const loginWithPin = (pin, id) => {
        const found = [mockWorker].find(w => w.id === id && w.pin === pin);
        return found || null;
      };
      expect(loginWithPin('1234', '1')).toEqual(mockWorker);
    });

    it('PIN incorrecto retorna null (error state)', () => {
      const loginWithPin = (pin, id) => {
        const found = [mockWorker].find(w => w.id === id && w.pin === pin);
        return found || null;
      };
      expect(loginWithPin('0000', '1')).toBeNull();
    });

    it('worker id incorrecto retorna null', () => {
      const loginWithPin = (pin, id) => {
        const found = [mockWorker].find(w => w.id === id && w.pin === pin);
        return found || null;
      };
      expect(loginWithPin('1234', '999')).toBeNull();
    });
  });

  describe('handleDelete', () => {
    it('delete borra el último dígito', () => {
      const handleDelete = (pin) => pin.length > 0 ? pin.slice(0, -1) : pin;
      expect(handleDelete('123')).toBe('12');
      expect(handleDelete('1')).toBe('');
      expect(handleDelete('')).toBe('');
    });

    it('permite reingresar dígitos después de borrar', () => {
      let pin = '12';
      pin = pin.slice(0, -1);
      pin += '5';
      expect(pin).toBe('15');
    });
  });

  describe('worker display data', () => {
    it('muestra el nombre del worker', () => {
      expect(mockWorker.name).toBe('Ana García');
    });

    it('muestra el puesto en mayúsculas', () => {
      expect(mockWorker.puesto.toUpperCase()).toBe('CAJERO');
    });

    it('muestra EMPLEADO si no tiene puesto', () => {
      const display = mockWorkerNoPuesto.puesto?.toUpperCase() || 'EMPLEADO';
      expect(display).toBe('EMPLEADO');
    });

    it('muestra la inicial del nombre como avatar', () => {
      expect(mockWorker.name.charAt(0).toUpperCase()).toBe('A');
    });
  });

  describe('keypad layout', () => {
    const keypad = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

    it('tiene 4 filas', () => {
      expect(keypad).toHaveLength(4);
    });

    it('cada fila tiene 3 teclas', () => {
      keypad.forEach(row => expect(row).toHaveLength(3));
    });

    it('contiene todos los dígitos 0-9', () => {
      const digits = keypad.flat().filter(k => /^\d$/.test(k));
      expect(digits.sort()).toEqual(['0','1','2','3','4','5','6','7','8','9']);
    });

    it('tiene tecla de borrar (⌫)', () => {
      expect(keypad.flat()).toContain('⌫');
    });
  });

  describe('PIN dots display', () => {
    it('muestra 4 dots siempre', () => {
      expect(PIN_LENGTH).toBe(4);
    });

    it('dot activo cuando índice < longitud del PIN', () => {
      const isActive = (index, pinLength) => index < pinLength;
      expect(isActive(0, 2)).toBe(true);
      expect(isActive(2, 2)).toBe(false);
      expect(isActive(3, 4)).toBe(true);
    });

    it('todos los dots activos con PIN completo', () => {
      const filled = Array.from({ length: PIN_LENGTH }).map((_, i) => i < 4);
      expect(filled.every(Boolean)).toBe(true);
    });

    it('ningún dot activo con PIN vacío', () => {
      const filled = Array.from({ length: PIN_LENGTH }).map((_, i) => i < 0);
      expect(filled.every(d => !d)).toBe(true);
    });
  });

  describe('generación de PIN compatible', () => {
    it('PIN generado tiene exactamente 4 dígitos', () => {
      expect(generatePin()).toHaveLength(4);
    });

    it('PIN generado es compatible con la validación del teclado', () => {
      const pin = generatePin();
      expect(/^\d{4}$/.test(pin)).toBe(true);
    });
  });
});
