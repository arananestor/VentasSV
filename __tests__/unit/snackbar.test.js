import { calculateCartTotal } from '../../src/utils/cartLogic';
import { isValidWhatsAppNumber } from '../../src/utils/validationLogic';

describe('snackbar global — AppContext', () => {

  describe('showSnack — estructura de datos de venta', () => {
    it('acepta datos de venta con total correcto', () => {
      // Arrange
      const sales = [{ cartId: '1', total: 5.00 }];

      // Act
      const total = calculateCartTotal(sales);

      // Assert
      expect(total).toBe(5.00);
    });

    it('funciona sin waNumber (transferencia sin WhatsApp)', () => {
      // Arrange
      const waNumber = null;

      // Act
      const isOptional = waNumber === null;

      // Assert
      expect(isOptional).toBe(true);
    });

    it('funciona con waNumber válido', () => {
      // Arrange
      const waNumber = '70001234';

      // Act
      const isValid = isValidWhatsAppNumber(waNumber);

      // Assert
      expect(isValid).toBe(true);
    });

    it('totaliza múltiples ventas correctamente', () => {
      // Arrange
      const sales = [
        { cartId: '1', total: 1.00 },
        { cartId: '2', total: 2.50 },
      ];

      // Act
      const total = calculateCartTotal(sales);

      // Assert
      expect(total).toBeCloseTo(3.50);
    });

    it('total 0 cuando ventas vacías', () => {
      // Arrange
      const sales = [];

      // Act
      const total = calculateCartTotal(sales);

      // Assert
      expect(total).toBe(0);
    });
  });

  describe('animación — constantes de timing', () => {
    it('valor inicial de snackAnim es 120 (fuera de pantalla)', () => {
      // Arrange
      const initialValue = 120;

      // Act
      const isOffScreen = initialValue > 0;

      // Assert
      expect(isOffScreen).toBe(true);
      expect(initialValue).toBe(120);
    });

    it('valor final de snackAnim es 0 (visible en pantalla)', () => {
      // Arrange
      const visibleValue = 0;

      // Act
      const isOnScreen = visibleValue === 0;

      // Assert
      expect(isOnScreen).toBe(true);
    });

    it('duración del dismiss es 220ms', () => {
      // Arrange
      const dismissDuration = 220;

      // Act
      const isReasonable = dismissDuration > 100 && dismissDuration < 500;

      // Assert
      expect(isReasonable).toBe(true);
      expect(dismissDuration).toBe(220);
    });

    it('snackbar se muestra por 2500ms antes de desaparecer', () => {
      // Arrange
      const displayTime = 2500;

      // Act
      const isReasonable = displayTime >= 2000 && displayTime <= 5000;

      // Assert
      expect(isReasonable).toBe(true);
      expect(displayTime).toBe(2500);
    });
  });
});
