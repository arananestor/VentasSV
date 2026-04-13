import { getRoleForPuesto, buildOwnerData } from '../../src/utils/workerLogic';

const migrateWorkers = (workers) => {
  return workers.map(w => {
    if (w.role === 'admin' || w.id === 'admin') {
      return { ...w, id: 'owner', role: 'owner', puesto: 'Dueño' };
    }
    if (!w.puesto) return { ...w, puesto: 'Cajero' };
    return w;
  });
};

describe('migrateWorkers v1→v2', () => {
  it('convierte admin a owner', () => {
    // Arrange
    const workers = [{ id: 'admin', name: 'Carlos', role: 'admin', pin: '1234' }];

    // Act
    const result = migrateWorkers(workers);

    // Assert
    expect(result[0].role).toBe('owner');
    expect(result[0].id).toBe('owner');
    expect(result[0].puesto).toBe('Dueño');
  });

  it('preserva nombre y PIN del admin al migrar', () => {
    // Arrange
    const workers = [{ id: 'admin', name: 'Carlos', role: 'admin', pin: '1234' }];

    // Act
    const result = migrateWorkers(workers);

    // Assert
    expect(result[0].name).toBe('Carlos');
    expect(result[0].pin).toBe('1234');
  });

  it('asigna Cajero a workers sin puesto', () => {
    // Arrange
    const workers = [{ id: '1', name: 'Ana', role: 'worker', pin: '5678' }];

    // Act
    const result = migrateWorkers(workers);

    // Assert
    expect(result[0].puesto).toBe('Cajero');
  });

  it('no sobreescribe puesto existente', () => {
    // Arrange
    const workers = [{ id: '1', name: 'Ana', role: 'worker', pin: '5678', puesto: 'Cocinero' }];

    // Act
    const result = migrateWorkers(workers);

    // Assert
    expect(result[0].puesto).toBe('Cocinero');
  });

  it('maneja array vacío sin errores', () => {
    // Arrange
    const workers = [];

    // Act + Assert
    expect(() => migrateWorkers(workers)).not.toThrow();
    expect(migrateWorkers(workers)).toHaveLength(0);
  });

  it('no muta el array original', () => {
    // Arrange
    const workers = [{ id: 'admin', name: 'Carlos', role: 'admin', pin: '1234' }];
    const original = JSON.stringify(workers);

    // Act
    migrateWorkers(workers);

    // Assert
    expect(JSON.stringify(workers)).toBe(original);
  });

  it('maneja múltiples workers correctamente', () => {
    // Arrange
    const workers = [
      { id: 'admin', name: 'Dueño', role: 'admin', pin: '1111' },
      { id: '1', name: 'Ana', role: 'worker', pin: '2222' },
      { id: '2', name: 'Luis', role: 'worker', pin: '3333', puesto: 'Cocinero' },
    ];

    // Act
    const result = migrateWorkers(workers);

    // Assert
    expect(result[0].role).toBe('owner');
    expect(result[1].puesto).toBe('Cajero');
    expect(result[2].puesto).toBe('Cocinero');
  });
});

describe('getRoleForPuesto — lógica de roles post-migración', () => {
  it('Encargado obtiene rol co-admin', () => {
    // Arrange
    const puesto = 'Encargado';

    // Act
    const role = getRoleForPuesto(puesto);

    // Assert
    expect(role).toBe('co-admin');
  });

  it('Cajero obtiene rol worker', () => {
    // Arrange
    const puesto = 'Cajero';

    // Act
    const role = getRoleForPuesto(puesto);

    // Assert
    expect(role).toBe('worker');
  });

  it('Cocinero obtiene rol worker', () => {
    // Arrange
    const puesto = 'Cocinero';

    // Act
    const role = getRoleForPuesto(puesto);

    // Assert
    expect(role).toBe('worker');
  });

  it('Motorista obtiene rol worker', () => {
    // Arrange
    const puesto = 'Motorista';

    // Act
    const role = getRoleForPuesto(puesto);

    // Assert
    expect(role).toBe('worker');
  });
});

describe('buildOwnerData — estructura del dueño', () => {
  it('construye el objeto owner con id fijo', () => {
    // Arrange
    const pin = '1234';
    const name = 'Carlos López';

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

  it('owner tiene puesto Dueño', () => {
    // Arrange
    const pin = '1234';
    const name = 'Carlos';

    // Act
    const owner = buildOwnerData(pin, name);

    // Assert
    expect(owner.puesto).toBe('Dueño');
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
});
