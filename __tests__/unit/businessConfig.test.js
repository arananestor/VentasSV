import {
  isValidWhatsAppNumber,
  isBankConfigComplete,
} from '../../src/utils/validationLogic';

describe('businessConfig', () => {
  describe('validación WhatsApp', () => {
    it('acepta número válido de 8 dígitos', () => {
      // Arrange
      const number = '70001234';

      // Act
      const result = isValidWhatsAppNumber(number);

      // Assert
      expect(result).toBe(true);
    });

    it('acepta número con guión', () => {
      // Arrange
      const number = '7000-1234';

      // Act
      const result = isValidWhatsAppNumber(number);

      // Assert
      expect(result).toBe(true);
    });

    it('acepta número con código de país', () => {
      // Arrange
      const number = '+50370001234';

      // Act
      const result = isValidWhatsAppNumber(number);

      // Assert
      expect(result).toBe(true);
    });

    it('rechaza número corto', () => {
      // Arrange
      const number = '1234';

      // Act
      const result = isValidWhatsAppNumber(number);

      // Assert
      expect(result).toBe(false);
    });

    it('rechaza vacío', () => {
      // Arrange
      const number = '';

      // Act
      const result = isValidWhatsAppNumber(number);

      // Assert
      expect(result).toBe(false);
    });

    it('acepta número con espacios (solo cuenta dígitos)', () => {
      // Arrange
      const number = '7000 1234';

      // Act
      const result = isValidWhatsAppNumber(number);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('datos bancarios — isBankConfigComplete', () => {
    it('completo cuando tiene banco, titular y cuenta', () => {
      // Arrange
      const bank = 'Agrícola';
      const holder = 'Carlos';
      const account = '123456';

      // Act
      const result = isBankConfigComplete(bank, holder, account);

      // Assert
      expect(result).toBe(true);
    });

    it('incompleto si banco está vacío', () => {
      // Arrange
      const bank = '';
      const holder = 'Ana';
      const account = '123';

      // Act
      const result = isBankConfigComplete(bank, holder, account);

      // Assert
      expect(result).toBe(false);
    });

    it('incompleto si titular está vacío', () => {
      // Arrange
      const bank = 'Davivienda';
      const holder = '';
      const account = '456';

      // Act
      const result = isBankConfigComplete(bank, holder, account);

      // Assert
      expect(result).toBe(false);
    });

    it('incompleto si cuenta está vacía', () => {
      // Arrange
      const bank = 'Davivienda';
      const holder = 'Luis';
      const account = '';

      // Act
      const result = isBankConfigComplete(bank, holder, account);

      // Assert
      expect(result).toBe(false);
    });

    it('incompleto si banco es solo espacios', () => {
      // Arrange
      const bank = '   ';
      const holder = 'Luis';
      const account = '789';

      // Act
      const result = isBankConfigComplete(bank, holder, account);

      // Assert
      expect(result).toBe(false);
    });

    it('incompleto si todos los campos son undefined', () => {
      // Arrange
      const bank = undefined;
      const holder = undefined;
      const account = undefined;

      // Act
      const result = isBankConfigComplete(bank, holder, account);

      // Assert
      expect(result).toBe(false);
    });
  });
});
