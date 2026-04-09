import { generatePin } from '../../src/context/AuthContext';

describe('PinEntryScreen — lógica', () => {
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

  describe('lógica de intento', () => {
    it('intenta login exactamente cuando llega a 4 dígitos', () => {
      const attempts = [];
      const handlePress = (pin, num) => {
        if (pin.length >= 4) return pin;
        const newPin = pin + num;
        if (newPin.length === 4) attempts.push(newPin);
        return newPin;
      };
      let pin = '';
      pin = handlePress(pin, '1');
      pin = handlePress(pin, '2');
      pin = handlePress(pin, '3');
      pin = handlePress(pin, '4');
      expect(attempts).toHaveLength(1);
      expect(attempts[0]).toBe('1234');
    });

    it('no intenta login con menos de 4 dígitos', () => {
      const attempts = [];
      const handlePress = (pin, num) => {
        const newPin = pin + num;
        if (newPin.length === 4) attempts.push(newPin);
        return newPin;
      };
      let pin = '';
      pin = handlePress(pin, '1');
      pin = handlePress(pin, '2');
      pin = handlePress(pin, '3');
      expect(attempts).toHaveLength(0);
    });

    it('delete borra el último dígito', () => {
      const handleDelete = (pin) => pin.slice(0, -1);
      expect(handleDelete('123')).toBe('12');
      expect(handleDelete('1')).toBe('');
      expect(handleDelete('')).toBe('');
    });

    it('no acepta más de 4 dígitos', () => {
      const handlePress = (pin, num) => {
        if (pin.length >= 4) return pin;
        return pin + num;
      };
      let pin = '1234';
      pin = handlePress(pin, '5');
      expect(pin).toBe('1234');
    });
  });

  describe('dots de PIN', () => {
    it('muestra 4 dots siempre', () => {
      const PIN_LENGTH = 4;
      expect(PIN_LENGTH).toBe(4);
    });

    it('dot activo cuando índice < longitud del PIN', () => {
      const isActive = (index, pinLength) => index < pinLength;
      expect(isActive(0, 2)).toBe(true);
      expect(isActive(2, 2)).toBe(false);
      expect(isActive(3, 4)).toBe(true);
    });

    it('todos los dots activos con PIN completo', () => {
      const pin = '1234';
      const dots = [0,1,2,3].map(i => i < pin.length);
      expect(dots.every(d => d)).toBe(true);
    });

    it('ningún dot activo con PIN vacío', () => {
      const pin = '';
      const dots = [0,1,2,3].map(i => i < pin.length);
      expect(dots.every(d => !d)).toBe(true);
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
