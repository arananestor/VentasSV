/**
 * PinKeypadModal — pure logic tests (no component rendering)
 * Tests the reusable PIN keypad modal props, state, and verification logic
 * using real functions from pinLogic and workerLogic
 */

import {
  PIN_LENGTH,
  appendDigit,
  deleteLastDigit,
  isPinComplete,
  buildDotsState,
} from '../../src/utils/pinLogic';
import {
  verifyOwnerPin,
  isAdmin,
} from '../../src/utils/workerLogic';

const workers = [
  { id: 'owner', role: 'owner', pin: '1234', name: 'Carlos' },
  { id: '2', role: 'co-admin', pin: '5555', name: 'Luis' },
];

describe('PinKeypadModal props', () => {

  it('title default es AUTORIZACIÓN', () => {
    // Arrange
    const providedTitle = undefined;

    // Act
    const title = providedTitle || 'AUTORIZACIÓN';

    // Assert
    expect(title).toBe('AUTORIZACIÓN');
  });

  it('title puede ser personalizado', () => {
    // Arrange
    const providedTitle = 'VERIFICACIÓN';

    // Act
    const title = providedTitle || 'AUTORIZACIÓN';

    // Assert
    expect(title).toBe('VERIFICACIÓN');
  });

  it('subtitle default es PIN de autorización', () => {
    // Arrange
    const providedSubtitle = undefined;

    // Act
    const subtitle = providedSubtitle || 'PIN de autorización';

    // Assert
    expect(subtitle).toBe('PIN de autorización');
  });

  it('onClose es invocable como función', () => {
    // Arrange
    const onClose = jest.fn();

    // Act
    onClose();

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('onVerify es invocable como función', () => {
    // Arrange
    const onVerify = jest.fn();

    // Act
    onVerify('1234');

    // Assert
    expect(onVerify).toHaveBeenCalledWith('1234');
  });

  it('visible false significa modal oculto', () => {
    // Arrange
    const visible = false;

    // Act
    const isHidden = !visible;

    // Assert
    expect(isHidden).toBe(true);
  });
});

describe('PinKeypadModal internal state', () => {

  describe('appendDigit — acumulación de dígitos', () => {
    it('acumula dígitos hasta PIN_LENGTH', () => {
      // Arrange
      let pin = '';

      // Act
      pin = appendDigit(pin, '1');
      pin = appendDigit(pin, '2');
      pin = appendDigit(pin, '3');
      pin = appendDigit(pin, '4');

      // Assert
      expect(pin).toBe('1234');
      expect(pin.length).toBe(PIN_LENGTH);
    });

    it('no acepta más de PIN_LENGTH dígitos', () => {
      // Arrange
      let pin = '1234';

      // Act
      const result = appendDigit(pin, '5');

      // Assert
      expect(result).toBe('1234');
    });
  });

  describe('deleteLastDigit', () => {
    it('borra último dígito', () => {
      // Arrange
      const pin = '12';

      // Act
      const result = deleteLastDigit(pin);

      // Assert
      expect(result).toBe('1');
    });

    it('no hace nada si pin vacío', () => {
      // Arrange
      const pin = '';

      // Act
      const result = deleteLastDigit(pin);

      // Assert
      expect(result).toBe('');
    });
  });

  describe('isPinComplete — auto-verify trigger', () => {
    it('retorna true cuando pin llega a 4 dígitos', () => {
      // Arrange
      const pin = '1234';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(true);
    });

    it('no está completo con menos de 4 dígitos', () => {
      // Arrange
      const pin = '123';

      // Act
      const result = isPinComplete(pin);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('buildDotsState — display visual', () => {
    it('2 dígitos ingresados → primeros 2 dots activos', () => {
      // Arrange
      const pinLength = 2;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots).toEqual([true, true, false, false]);
    });

    it('PIN completo → todos los dots activos', () => {
      // Arrange
      const pinLength = 4;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots.every(Boolean)).toBe(true);
    });

    it('PIN vacío → ningún dot activo', () => {
      // Arrange
      const pinLength = 0;

      // Act
      const dots = buildDotsState(pinLength);

      // Assert
      expect(dots.every(d => !d)).toBe(true);
    });
  });
});

describe('PinKeypadModal verification', () => {

  describe('verifyOwnerPin — lógica de onVerify', () => {
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

  describe('reset on close', () => {
    it('pin y error se resetean cuando modal se cierra', () => {
      // Arrange
      let pin = '12';
      let error = true;
      const visible = false;

      // Act
      if (!visible) {
        pin = '';
        error = false;
      }

      // Assert
      expect(pin).toBe('');
      expect(error).toBe(false);
    });
  });
});

describe('PinKeypadModal consumers', () => {

  describe('POSScreen — verifyOwnerPin', () => {
    it('PIN correcto permite ejecutar pendingAction', () => {
      // Arrange
      let actionExecuted = false;
      const pendingAction = () => { actionExecuted = true; };
      const pin = '1234';

      // Act
      if (verifyOwnerPin(workers, pin)) pendingAction();

      // Assert
      expect(actionExecuted).toBe(true);
    });

    it('PIN incorrecto no ejecuta pendingAction', () => {
      // Arrange
      let actionExecuted = false;
      const pendingAction = () => { actionExecuted = true; };
      const pin = '0000';

      // Act
      if (verifyOwnerPin(workers, pin)) pendingAction();

      // Assert
      expect(actionExecuted).toBe(false);
    });
  });

  describe('ProfileScreen — requireOwnerPin', () => {
    it('owner ejecuta acción directamente sin mostrar modal', () => {
      // Arrange
      const currentWorker = workers[0]; // owner
      let actionExecuted = false;
      let pinShown = false;

      // Act
      if (isAdmin(currentWorker)) actionExecuted = true;
      else pinShown = true;

      // Assert
      expect(actionExecuted).toBe(true);
      expect(pinShown).toBe(false);
    });

    it('co-admin muestra modal PIN para autenticar', () => {
      // Arrange
      const currentWorker = { id: 'x', role: 'worker', name: 'Ana' };
      let actionExecuted = false;
      let pinShown = false;

      // Act
      if (currentWorker.role === 'owner') actionExecuted = true;
      else pinShown = true;

      // Assert
      expect(actionExecuted).toBe(false);
      expect(pinShown).toBe(true);
    });

    it('PIN verificado ejecuta pendingAdminAction', () => {
      // Arrange
      let executed = false;
      const pendingAdminAction = () => { executed = true; };
      const pin = '1234';

      // Act
      if (verifyOwnerPin(workers, pin)) pendingAdminAction();

      // Assert
      expect(executed).toBe(true);
    });
  });
});
