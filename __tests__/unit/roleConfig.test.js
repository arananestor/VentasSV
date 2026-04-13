import { ALL_TABS, PUESTO_TABS, getTabsForWorker } from '../../src/utils/roleConfig';

describe('getTabsForWorker', () => {
  it('owner gets all 4 tabs', () => {
    // Arrange
    const worker = { id: 'owner', role: 'owner', puesto: 'Dueño' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Venta', 'Comandas', 'Ventas', 'Perfil']);
  });

  it('co-admin gets all 4 tabs', () => {
    // Arrange
    const worker = { id: '2', role: 'co-admin', puesto: 'Encargado' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Venta', 'Comandas', 'Ventas', 'Perfil']);
  });

  it('Cajero gets Venta, Ventas, Perfil — NOT Comandas', () => {
    // Arrange
    const worker = { id: '3', role: 'worker', puesto: 'Cajero' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Venta', 'Ventas', 'Perfil']);
    expect(tabs).not.toContain('Comandas');
  });

  it('Cocinero gets Comandas, Perfil — NOT Venta, NOT Ventas', () => {
    // Arrange
    const worker = { id: '4', role: 'worker', puesto: 'Cocinero' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Comandas', 'Perfil']);
    expect(tabs).not.toContain('Venta');
    expect(tabs).not.toContain('Ventas');
  });

  it('Motorista gets Perfil only', () => {
    // Arrange
    const worker = { id: '5', role: 'worker', puesto: 'Motorista' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Perfil']);
  });

  it('Camarero gets Perfil only', () => {
    // Arrange
    const worker = { id: '6', role: 'worker', puesto: 'Camarero' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Perfil']);
  });

  it('null worker falls back to Perfil only', () => {
    // Arrange
    const worker = null;
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Perfil']);
  });

  it('undefined worker falls back to Perfil only', () => {
    // Arrange
    const worker = undefined;
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Perfil']);
  });

  it('worker with unknown puesto falls back to Perfil only', () => {
    // Arrange
    const worker = { id: '7', role: 'worker', puesto: 'PuestoInventado' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    expect(tabs).toEqual(['Perfil']);
  });

  it('every returned tab is a member of ALL_TABS', () => {
    // Arrange
    const workers = [
      { role: 'owner', puesto: 'Dueño' },
      { role: 'co-admin', puesto: 'Encargado' },
      { role: 'worker', puesto: 'Cajero' },
      { role: 'worker', puesto: 'Cocinero' },
      { role: 'worker', puesto: 'Motorista' },
      { role: 'worker', puesto: 'Camarero' },
    ];
    // Act
    const allReturnedTabs = workers.flatMap(w => getTabsForWorker(w));
    // Assert
    allReturnedTabs.forEach(tab => expect(ALL_TABS).toContain(tab));
  });

  it('Perfil is always present for every role', () => {
    // Arrange
    const workers = [
      { role: 'owner', puesto: 'Dueño' },
      { role: 'co-admin', puesto: 'Encargado' },
      { role: 'worker', puesto: 'Cajero' },
      { role: 'worker', puesto: 'Cocinero' },
      { role: 'worker', puesto: 'Motorista' },
      { role: 'worker', puesto: 'Camarero' },
      null,
    ];
    // Act / Assert
    workers.forEach(w => {
      const tabs = getTabsForWorker(w);
      expect(tabs).toContain('Perfil');
    });
  });

  it('tab order matches ALL_TABS order', () => {
    // Arrange
    const worker = { role: 'worker', puesto: 'Cajero' };
    // Act
    const tabs = getTabsForWorker(worker);
    // Assert
    const indices = tabs.map(t => ALL_TABS.indexOf(t));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it('returns a new array each call — no shared references', () => {
    // Arrange
    const worker = { role: 'owner', puesto: 'Dueño' };
    // Act
    const first = getTabsForWorker(worker);
    const second = getTabsForWorker(worker);
    // Assert
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});

describe('ALL_TABS', () => {
  it('has exactly 4 tabs', () => {
    // Arrange / Act
    const count = ALL_TABS.length;
    // Assert
    expect(count).toBe(4);
  });

  it('correct order', () => {
    // Arrange / Act / Assert
    expect(ALL_TABS).toEqual(['Venta', 'Comandas', 'Ventas', 'Perfil']);
  });
});

describe('PUESTO_TABS', () => {
  it('has entries for all worker puestos', () => {
    // Arrange
    const puestos = ['Cajero', 'Cocinero', 'Motorista', 'Camarero'];
    // Act
    const missing = puestos.filter(p => !PUESTO_TABS[p]);
    // Assert
    expect(missing).toHaveLength(0);
  });

  it('every tab in PUESTO_TABS is a valid ALL_TABS member', () => {
    // Arrange
    const allPuestoTabs = Object.values(PUESTO_TABS).flat();
    // Act
    const invalid = allPuestoTabs.filter(t => !ALL_TABS.includes(t));
    // Assert
    expect(invalid).toHaveLength(0);
  });
});
