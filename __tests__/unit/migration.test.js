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
    const result = migrateWorkers([{ id: 'admin', name: 'Carlos', role: 'admin', pin: '1234' }]);
    expect(result[0].role).toBe('owner');
    expect(result[0].id).toBe('owner');
    expect(result[0].puesto).toBe('Dueño');
  });

  it('preserva nombre y PIN del admin', () => {
    const result = migrateWorkers([{ id: 'admin', name: 'Carlos', role: 'admin', pin: '1234' }]);
    expect(result[0].name).toBe('Carlos');
    expect(result[0].pin).toBe('1234');
  });

  it('asigna Cajero a workers sin puesto', () => {
    const result = migrateWorkers([{ id: '1', name: 'Ana', role: 'worker', pin: '5678' }]);
    expect(result[0].puesto).toBe('Cajero');
  });

  it('no sobreescribe puesto existente', () => {
    const result = migrateWorkers([{ id: '1', name: 'Ana', role: 'worker', pin: '5678', puesto: 'Cocinero' }]);
    expect(result[0].puesto).toBe('Cocinero');
  });

  it('maneja array vacío sin errores', () => {
    expect(() => migrateWorkers([])).not.toThrow();
    expect(migrateWorkers([])).toHaveLength(0);
  });

  it('no muta el array original', () => {
    const workers = [{ id: 'admin', name: 'Carlos', role: 'admin', pin: '1234' }];
    const original = JSON.stringify(workers);
    migrateWorkers(workers);
    expect(JSON.stringify(workers)).toBe(original);
  });

  it('maneja múltiples workers correctamente', () => {
    const workers = [
      { id: 'admin', name: 'Dueño', role: 'admin', pin: '1111' },
      { id: '1', name: 'Ana', role: 'worker', pin: '2222' },
      { id: '2', name: 'Luis', role: 'worker', pin: '3333', puesto: 'Cocinero' },
    ];
    const result = migrateWorkers(workers);
    expect(result[0].role).toBe('owner');
    expect(result[1].puesto).toBe('Cajero');
    expect(result[2].puesto).toBe('Cocinero');
  });
});
