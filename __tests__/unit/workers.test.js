import {
  loginMatch,
  isValidPin,
  isAdmin,
  canRemoveWorker,
  verifyOwnerPin,
  buildOwnerData,
  canSaveProduct,
  isPinDuplicate,
  getRoleForPuesto,
} from '../../src/utils/workerLogic';

const mockWorkers = [
  { id: 'owner', name: 'Carlos', role: 'owner', puesto: 'Dueño', pin: '1234', color: '#FFFFFF' },
  { id: '1', name: 'Ana', role: 'worker', puesto: 'Cajero', pin: '5678', color: '#FF6B6B' },
  { id: '2', name: 'Luis', role: 'co-admin', puesto: 'Encargado', pin: '9012', color: '#4ECDC4' },
  { id: '3', name: 'María', role: 'worker', puesto: 'Cocinero', pin: '3456', color: '#45B7D1' },
];

describe('loginMatch', () => {
  it('autentica con PIN correcto', () => {
    // Arrange
    const pin = '5678';
    const workerId = '1';

    // Act
    const result = loginMatch(mockWorkers, pin, workerId);

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe('1');
  });

  it('rechaza PIN incorrecto', () => {
    // Arrange
    const pin = '0000';
    const workerId = '1';

    // Act
    const result = loginMatch(mockWorkers, pin, workerId);

    // Assert
    expect(result).toBeNull();
  });

  it('rechaza worker id incorrecto', () => {
    // Arrange
    const pin = '5678';
    const workerId = '999';

    // Act
    const result = loginMatch(mockWorkers, pin, workerId);

    // Assert
    expect(result).toBeNull();
  });

  it('no permite PIN vacío', () => {
    // Arrange
    const pin = '';
    const workerId = '1';

    // Act
    const result = loginMatch(mockWorkers, pin, workerId);

    // Assert
    expect(result).toBeNull();
  });

  it('retorna el worker completo si el login es exitoso', () => {
    // Arrange
    const pin = '1234';
    const workerId = 'owner';

    // Act
    const result = loginMatch(mockWorkers, pin, workerId);

    // Assert
    expect(result).toEqual(mockWorkers[0]);
  });
});

describe('isValidPin', () => {
  it('rechaza menos de 4 dígitos', () => {
    // Arrange
    const pin = '123';

    // Act
    const result = isValidPin(pin);

    // Assert
    expect(result).toBe(false);
  });

  it('rechaza más de 4 dígitos', () => {
    // Arrange
    const pin = '12345';

    // Act
    const result = isValidPin(pin);

    // Assert
    expect(result).toBe(false);
  });

  it('rechaza letras', () => {
    // Arrange
    const pin = '12ab';

    // Act
    const result = isValidPin(pin);

    // Assert
    expect(result).toBe(false);
  });

  it('acepta exactamente 4 dígitos', () => {
    // Arrange
    const pins = ['1234', '0000', '9999'];

    // Act
    const results = pins.map(p => isValidPin(p));

    // Assert
    results.forEach(r => expect(r).toBe(true));
  });

  it('rechaza string vacío', () => {
    // Arrange
    const pin = '';

    // Act
    const result = isValidPin(pin);

    // Assert
    expect(result).toBe(false);
  });
});

describe('isAdmin', () => {
  it('owner es admin', () => {
    // Arrange / Act
    const result = isAdmin(mockWorkers[0]);

    // Assert
    expect(result).toBe(true);
  });

  it('co-admin es admin', () => {
    // Arrange / Act
    const result = isAdmin(mockWorkers[2]);

    // Assert
    expect(result).toBe(true);
  });

  it('worker normal no es admin', () => {
    // Arrange / Act
    const result = isAdmin(mockWorkers[1]);

    // Assert
    expect(result).toBe(false);
  });

  it('null no es admin', () => {
    // Arrange / Act
    const result = isAdmin(null);

    // Assert
    expect(result).toBe(false);
  });

  it('solo existe un owner en la lista', () => {
    // Arrange / Act
    const owners = mockWorkers.filter(w => w.role === 'owner');

    // Assert
    expect(owners).toHaveLength(1);
  });
});

describe('canRemoveWorker', () => {
  it('no permite eliminar al owner', () => {
    // Arrange / Act
    const result = canRemoveWorker('owner');

    // Assert
    expect(result).toBe(false);
  });

  it('permite eliminar a un worker normal', () => {
    // Arrange / Act
    const result = canRemoveWorker('1');

    // Assert
    expect(result).toBe(true);
  });

  it('permite eliminar a un co-admin', () => {
    // Arrange / Act
    const result = canRemoveWorker('2');

    // Assert
    expect(result).toBe(true);
  });
});

describe('verifyOwnerPin', () => {
  it('verifica PIN del owner correctamente', () => {
    // Arrange
    const pin = '1234';

    // Act
    const result = verifyOwnerPin(mockWorkers, pin);

    // Assert
    expect(result).toBe(true);
  });

  it('rechaza PIN incorrecto', () => {
    // Arrange
    const pin = '0000';

    // Act
    const result = verifyOwnerPin(mockWorkers, pin);

    // Assert
    expect(result).toBe(false);
  });

  it('rechaza PIN vacío', () => {
    // Arrange
    const pin = '';

    // Act
    const result = verifyOwnerPin(mockWorkers, pin);

    // Assert
    expect(result).toBe(false);
  });
});

describe('isPinDuplicate', () => {
  it('detecta PIN duplicado', () => {
    // Arrange
    const pin = '5678'; // ya existe en Ana

    // Act
    const result = isPinDuplicate(mockWorkers, pin);

    // Assert
    expect(result).toBe(true);
  });

  it('no detecta duplicado para PIN nuevo', () => {
    // Arrange
    const pin = '7777'; // no existe

    // Act
    const result = isPinDuplicate(mockWorkers, pin);

    // Assert
    expect(result).toBe(false);
  });
});

describe('getRoleForPuesto', () => {
  it('Encargado obtiene rol co-admin', () => {
    // Arrange
    const puesto = 'Encargado';

    // Act
    const result = getRoleForPuesto(puesto);

    // Assert
    expect(result).toBe('co-admin');
  });

  it('Cajero obtiene rol worker', () => {
    // Arrange
    const puesto = 'Cajero';

    // Act
    const result = getRoleForPuesto(puesto);

    // Assert
    expect(result).toBe('worker');
  });

  it('Cocinero obtiene rol worker', () => {
    // Arrange
    const puesto = 'Cocinero';

    // Act
    const result = getRoleForPuesto(puesto);

    // Assert
    expect(result).toBe('worker');
  });
});

describe('buildOwnerData', () => {
  it('construye owner con id fijo', () => {
    // Arrange
    const pin = '1234';
    const name = 'Carlos';

    // Act
    const owner = buildOwnerData(pin, name);

    // Assert
    expect(owner.id).toBe('owner');
  });

  it('owner tiene role owner', () => {
    // Arrange
    const pin = '1234';
    const name = 'Carlos';

    // Act
    const owner = buildOwnerData(pin, name);

    // Assert
    expect(owner.role).toBe('owner');
  });

  it('trim el nombre al construir', () => {
    // Arrange
    const pin = '1234';
    const name = '  Carlos  ';

    // Act
    const owner = buildOwnerData(pin, name);

    // Assert
    expect(owner.name).toBe('Carlos');
  });

  it('canSaveProduct retorna true para el owner construido', () => {
    // Arrange
    const pin = '1234';
    const name = 'Carlos';

    // Act
    const owner = buildOwnerData(pin, name);
    const canSave = canSaveProduct(owner);

    // Assert
    expect(canSave).toBe(true);
  });
});
