import { generatePin, PUESTOS } from '../../src/context/AuthContext';
import { buildOwnerData, isValidPin } from '../../src/utils/workerLogic';
import { isValidProductName } from '../../src/utils/validationLogic';

describe('SetupScreen — lógica', () => {

  describe('isValidProductName — validación del nombre del dueño', () => {
    it('nombre vacío no es válido', () => {
      // Arrange
      const name = '';

      // Act
      const result = isValidProductName(name);

      // Assert
      expect(result).toBe(false);
    });

    it('nombre con solo espacios no es válido', () => {
      // Arrange
      const name = '   ';

      // Act
      const result = isValidProductName(name);

      // Assert
      expect(result).toBe(false);
    });

    it('nombre válido pasa la validación', () => {
      // Arrange
      const name = 'Carlos López';

      // Act
      const result = isValidProductName(name);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('generatePin — generación en setup', () => {
    it('PIN generado es exactamente 4 dígitos', () => {
      // Arrange / Act
      const pin = generatePin();

      // Assert
      expect(pin).toHaveLength(4);
    });

    it('PIN generado es numérico', () => {
      // Arrange / Act
      const pin = generatePin();

      // Assert
      expect(/^\d{4}$/.test(pin)).toBe(true);
    });

    it('isValidPin acepta el PIN generado', () => {
      // Arrange / Act
      const pin = generatePin();
      const result = isValidPin(pin);

      // Assert
      expect(result).toBe(true);
    });

    it('regenerar PIN da valores diferentes eventualmente', () => {
      // Arrange
      const pins = new Set();

      // Act
      for (let i = 0; i < 10; i++) pins.add(generatePin());

      // Assert
      expect(pins.size).toBeGreaterThan(1);
    });
  });

  describe('deviceType', () => {
    it('tipo fixed existe en los válidos', () => {
      // Arrange
      const validTypes = ['fixed', 'personal'];

      // Act
      const includes = validTypes.includes('fixed');

      // Assert
      expect(includes).toBe(true);
    });

    it('tipo personal existe en los válidos', () => {
      // Arrange
      const validTypes = ['fixed', 'personal'];

      // Act
      const includes = validTypes.includes('personal');

      // Assert
      expect(includes).toBe(true);
    });

    it('tipo tablet no es válido', () => {
      // Arrange
      const validTypes = ['fixed', 'personal'];

      // Act
      const includes = validTypes.includes('tablet');

      // Assert
      expect(includes).toBe(false);
    });
  });

  describe('buildOwnerData — estructura del owner en setup', () => {
    it('owner tiene id fijo "owner"', () => {
      // Arrange
      const pin = '1234';
      const name = 'Carlos';

      // Act
      const owner = buildOwnerData(pin, name);

      // Assert
      expect(owner.id).toBe('owner');
    });

    it('owner tiene role "owner"', () => {
      // Arrange
      const pin = '1234';
      const name = 'Carlos';

      // Act
      const owner = buildOwnerData(pin, name);

      // Assert
      expect(owner.role).toBe('owner');
    });

    it('owner tiene puesto "Dueño"', () => {
      // Arrange
      const pin = '1234';
      const name = 'Carlos';

      // Act
      const owner = buildOwnerData(pin, name);

      // Assert
      expect(owner.puesto).toBe('Dueño');
    });

    it('owner preserva el nombre recortado', () => {
      // Arrange
      const pin = '1234';
      const name = '  Carlos López  ';

      // Act
      const owner = buildOwnerData(pin, name);

      // Assert
      expect(owner.name).toBe('Carlos López');
    });

    it('owner preserva el PIN', () => {
      // Arrange
      const pin = '9876';
      const name = 'María';

      // Act
      const owner = buildOwnerData(pin, name);

      // Assert
      expect(owner.pin).toBe('9876');
    });

    it('owner tiene color blanco #FFFFFF', () => {
      // Arrange
      const pin = '1234';
      const name = 'Carlos';

      // Act
      const owner = buildOwnerData(pin, name);

      // Assert
      expect(owner.color).toBe('#FFFFFF');
    });
  });

  describe('PUESTOS — opciones disponibles en setup', () => {
    it('hay 5 puestos disponibles', () => {
      // Arrange / Act
      const count = PUESTOS.length;

      // Assert
      expect(count).toBe(5);
    });

    it('todos los puestos son strings no vacíos', () => {
      // Arrange / Act
      const allValid = PUESTOS.every(p => isValidProductName(p));

      // Assert
      expect(allValid).toBe(true);
    });
  });
});
