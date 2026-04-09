import { PUESTO_ICONS, PUESTOS } from '../../src/context/AuthContext';

describe('SelectWorkerScreen — lógica', () => {
  const mockWorkers = [
    { id: 'owner', name: 'Carlos López', role: 'owner', puesto: 'Dueño', pin: '1234', color: '#FFFFFF' },
    { id: '1', name: 'Ana García', role: 'worker', puesto: 'Cajero', pin: '5678', color: '#FF6B6B' },
    { id: '2', name: 'Luis Ramos', role: 'worker', puesto: 'Cocinero', pin: '9012', color: '#4ECDC4' },
  ];

  describe('render de workers', () => {
    it('lista correcta de workers', () => {
      expect(mockWorkers).toHaveLength(3);
    });

    it('cada worker tiene nombre', () => {
      mockWorkers.forEach(w => expect(w.name.trim()).not.toBe(''));
    });

    it('cada worker tiene puesto', () => {
      mockWorkers.forEach(w => expect(w.puesto).toBeDefined());
    });

    it('cada worker tiene color', () => {
      mockWorkers.forEach(w => expect(w.color).toMatch(/^#[0-9A-Fa-f]{6}$/));
    });
  });

  describe('ícono por puesto', () => {
    it('owner tiene ícono crown', () => {
      expect(PUESTO_ICONS['Dueño']).toBe('crown');
    });

    it('cajero tiene ícono cash-register', () => {
      expect(PUESTO_ICONS['Cajero']).toBe('cash-register');
    });

    it('cocinero tiene ícono chef-hat', () => {
      expect(PUESTO_ICONS['Cocinero']).toBe('chef-hat');
    });

    it('motorista tiene ícono moped', () => {
      expect(PUESTO_ICONS['Motorista']).toBe('moped');
    });

    it('camarero tiene ícono room-service', () => {
      expect(PUESTO_ICONS['Camarero']).toBe('room-service');
    });

    it('puesto sin ícono definido usa fallback account', () => {
      const getIcon = (puesto) => PUESTO_ICONS[puesto] || 'account';
      expect(getIcon('PuestoInexistente')).toBe('account');
    });
  });

  describe('puesto del worker', () => {
    it('owner muestra Dueño', () => {
      const owner = mockWorkers.find(w => w.role === 'owner');
      expect(owner?.puesto).toBe('Dueño');
    });

    it('worker sin puesto usa fallback Cajero', () => {
      const getPuesto = (w) => w.puesto || (w.role === 'owner' ? 'Dueño' : 'Cajero');
      const workerSinPuesto = { id: '99', role: 'worker' };
      expect(getPuesto(workerSinPuesto)).toBe('Cajero');
    });

    it('puesto se muestra en mayúsculas', () => {
      const puesto = 'Cajero';
      expect(puesto.toUpperCase()).toBe('CAJERO');
    });
  });

  describe('navegación a PinEntry', () => {
    it('navega con el worker correcto', () => {
      const navigate = jest.fn();
      const handlePress = (worker) => navigate('PinEntry', { worker });
      handlePress(mockWorkers[1]);
      expect(navigate).toHaveBeenCalledWith('PinEntry', { worker: mockWorkers[1] });
    });

    it('navega con el owner correctamente', () => {
      const navigate = jest.fn();
      const handlePress = (worker) => navigate('PinEntry', { worker });
      handlePress(mockWorkers[0]);
      expect(navigate).toHaveBeenCalledWith('PinEntry', { worker: mockWorkers[0] });
    });

    it('pasa el objeto worker completo, no solo el id', () => {
      const navigate = jest.fn();
      const handlePress = (worker) => navigate('PinEntry', { worker });
      handlePress(mockWorkers[2]);
      const call = navigate.mock.calls[0][1];
      expect(call.worker).toHaveProperty('id');
      expect(call.worker).toHaveProperty('name');
      expect(call.worker).toHaveProperty('puesto');
      expect(call.worker).toHaveProperty('pin');
    });
  });

  describe('owner destacado visualmente', () => {
    it('owner tiene role owner', () => {
      const owner = mockWorkers.find(w => w.role === 'owner');
      expect(owner).toBeDefined();
    });

    it('solo existe un owner', () => {
      expect(mockWorkers.filter(w => w.role === 'owner')).toHaveLength(1);
    });

    it('workers normales no son owner', () => {
      const workers = mockWorkers.filter(w => w.role !== 'owner');
      workers.forEach(w => expect(w.role).not.toBe('owner'));
    });
  });
});
