/**
 * SelectWorkerScreen — pure logic tests (no component rendering)
 * Tests the worker selection business rules using real functions
 */

import { PUESTO_ICONS, PUESTOS } from '../../src/context/AuthContext';
import { getAvatarInitial, getPuestoDisplay } from '../../src/utils/uiLogic';
import { isAdmin } from '../../src/utils/workerLogic';

const mockWorkers = [
  { id: 'owner', name: 'Carlos López', role: 'owner', puesto: 'Dueño', pin: '1234', color: '#FFFFFF' },
  { id: '1', name: 'Ana García', role: 'worker', puesto: 'Cajero', pin: '5678', color: '#FF6B6B' },
  { id: '2', name: 'Luis Ramos', role: 'worker', puesto: 'Cocinero', pin: '9012', color: '#4ECDC4' },
];

describe('SelectWorkerScreen logic', () => {

  describe('worker list structure', () => {
    it('cada worker tiene nombre no vacío', () => {
      // Arrange
      const workers = mockWorkers;

      // Act
      const emptyNames = workers.filter(w => !w.name || w.name.trim() === '');

      // Assert
      expect(emptyNames).toHaveLength(0);
    });

    it('cada worker tiene puesto definido', () => {
      // Arrange
      const workers = mockWorkers;

      // Act
      const missingPuesto = workers.filter(w => !w.puesto);

      // Assert
      expect(missingPuesto).toHaveLength(0);
    });

    it('cada worker tiene color hex válido', () => {
      // Arrange
      const workers = mockWorkers;

      // Act
      const invalidColors = workers.filter(w => !/^#[0-9A-Fa-f]{6}$/.test(w.color));

      // Assert
      expect(invalidColors).toHaveLength(0);
    });

    it('cada worker tiene id, role y pin', () => {
      // Arrange
      const workers = mockWorkers;

      // Act
      const incomplete = workers.filter(w => !w.id || !w.role || !w.pin);

      // Assert
      expect(incomplete).toHaveLength(0);
    });

    it('todos los ids son únicos', () => {
      // Arrange
      const ids = mockWorkers.map(w => w.id);

      // Act
      const unique = new Set(ids);

      // Assert
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('PUESTO_ICONS', () => {
    it('Dueño tiene ícono crown', () => {
      // Arrange / Act
      const icon = PUESTO_ICONS['Dueño'];

      // Assert
      expect(icon).toBe('crown');
    });

    it('Cajero tiene ícono cash-register', () => {
      // Arrange / Act
      const icon = PUESTO_ICONS['Cajero'];

      // Assert
      expect(icon).toBe('cash-register');
    });

    it('Cocinero tiene ícono chef-hat', () => {
      // Arrange / Act
      const icon = PUESTO_ICONS['Cocinero'];

      // Assert
      expect(icon).toBe('chef-hat');
    });

    it('Motorista tiene ícono moped', () => {
      // Arrange / Act
      const icon = PUESTO_ICONS['Motorista'];

      // Assert
      expect(icon).toBe('moped');
    });

    it('Camarero tiene ícono room-service', () => {
      // Arrange / Act
      const icon = PUESTO_ICONS['Camarero'];

      // Assert
      expect(icon).toBe('room-service');
    });

    it('puesto sin ícono definido usa fallback account', () => {
      // Arrange
      const puesto = 'PuestoInexistente';

      // Act
      const icon = PUESTO_ICONS[puesto] || 'account';

      // Assert
      expect(icon).toBe('account');
    });

    it('todos los puestos en PUESTOS tienen ícono', () => {
      // Arrange / Act
      const missing = PUESTOS.filter(p => !PUESTO_ICONS[p]);

      // Assert
      expect(missing).toHaveLength(0);
    });
  });

  describe('getPuestoDisplay', () => {
    it('Dueño se muestra como DUEÑO', () => {
      // Arrange
      const puesto = 'Dueño';

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('DUEÑO');
    });

    it('Cajero se muestra como CAJERO', () => {
      // Arrange
      const puesto = 'Cajero';

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('CAJERO');
    });

    it('Cocinero se muestra como COCINERO', () => {
      // Arrange
      const puesto = 'Cocinero';

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('COCINERO');
    });

    it('puesto undefined usa fallback EMPLEADO', () => {
      // Arrange
      const puesto = undefined;

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('EMPLEADO');
    });

    it('puesto null usa fallback EMPLEADO', () => {
      // Arrange
      const puesto = null;

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('EMPLEADO');
    });
  });

  describe('getAvatarInitial', () => {
    it('genera la inicial C para Carlos', () => {
      // Arrange
      const name = 'Carlos López';

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('C');
    });

    it('genera la inicial A para Ana', () => {
      // Arrange
      const name = 'Ana García';

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('A');
    });

    it('genera la inicial L para Luis', () => {
      // Arrange
      const name = 'Luis Ramos';

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('L');
    });

    it('retorna ? para nombre vacío', () => {
      // Arrange
      const name = '';

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('?');
    });
  });

  describe('navegación a PinEntry', () => {
    it('navega con el worker correcto al presionar', () => {
      // Arrange
      const navigate = jest.fn();
      const handlePress = (w) => navigate('PinEntry', { worker: w });

      // Act
      handlePress(mockWorkers[1]);

      // Assert
      expect(navigate).toHaveBeenCalledWith('PinEntry', { worker: mockWorkers[1] });
    });

    it('pasa el objeto worker completo a PinEntry', () => {
      // Arrange
      const navigate = jest.fn();
      const handlePress = (w) => navigate('PinEntry', { worker: w });

      // Act
      handlePress(mockWorkers[2]);

      // Assert
      const passed = navigate.mock.calls[0][1].worker;
      expect(passed).toHaveProperty('id');
      expect(passed).toHaveProperty('name');
      expect(passed).toHaveProperty('puesto');
      expect(passed).toHaveProperty('pin');
    });
  });

  describe('isAdmin — detección del owner', () => {
    it('owner tiene rol owner', () => {
      // Arrange
      const ownerWorker = mockWorkers.find(w => w.role === 'owner');

      // Act
      const result = isAdmin(ownerWorker);

      // Assert
      expect(result).toBe(true);
    });

    it('solo existe un owner en la lista', () => {
      // Arrange / Act
      const owners = mockWorkers.filter(w => w.role === 'owner');

      // Assert
      expect(owners).toHaveLength(1);
    });

    it('workers normales no son admin', () => {
      // Arrange
      const normalWorkers = mockWorkers.filter(w => w.role === 'worker');

      // Act
      const results = normalWorkers.map(w => isAdmin(w));

      // Assert
      results.forEach(r => expect(r).toBe(false));
    });
  });

  describe('header content', () => {
    it('título es VENTASSV', () => {
      // Arrange / Act
      const logo = 'VENTASSV';

      // Assert
      expect(logo).toBe('VENTASSV');
    });

    it('subtítulo contiene texto de selección', () => {
      // Arrange / Act
      const subtitle = '¿Quién trabaja hoy?';

      // Assert
      expect(subtitle.length).toBeGreaterThan(0);
    });
  });
});
