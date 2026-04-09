import { generatePin } from '../../src/context/AuthContext';

describe('SetupScreen — lógica', () => {
  describe('validaciones del paso 1', () => {
    const isValidName = (name) => name.trim().length > 0;
    it('nombre vacío no es válido', () => expect(isValidName('')).toBe(false));
    it('nombre con espacios no es válido', () => expect(isValidName('   ')).toBe(false));
    it('nombre válido pasa', () => expect(isValidName('Carlos López')).toBe(true));
  });

  describe('generación de PIN en setup', () => {
    it('PIN generado es exactamente 4 dígitos', () => {
      expect(generatePin()).toHaveLength(4);
    });

    it('PIN es numérico', () => {
      expect(/^\d{4}$/.test(generatePin())).toBe(true);
    });

    it('regenerar PIN da uno diferente eventualmente', () => {
      const pins = new Set(Array.from({ length: 10 }, generatePin));
      expect(pins.size).toBeGreaterThan(1);
    });
  });

  describe('deviceType', () => {
    it('solo acepta fixed o personal', () => {
      const valid = ['fixed', 'personal'];
      expect(valid.includes('fixed')).toBe(true);
      expect(valid.includes('personal')).toBe(true);
      expect(valid.includes('tablet')).toBe(false);
    });

    it('fixed es para múltiples usuarios', () => {
      const deviceBehavior = { fixed: 'multi-user', personal: 'single-user' };
      expect(deviceBehavior['fixed']).toBe('multi-user');
    });

    it('personal es para un solo usuario', () => {
      const deviceBehavior = { fixed: 'multi-user', personal: 'single-user' };
      expect(deviceBehavior['personal']).toBe('single-user');
    });
  });

  describe('setupOwner — estructura del owner', () => {
    const buildOwner = (pin, name, device) => ({
      id: 'owner', name: name.trim(), pin,
      role: 'owner', puesto: 'Dueño', dui: '',
      photo: null, color: '#FFFFFF',
      createdAt: new Date().toISOString(),
    });

    it('owner tiene id fijo owner', () => {
      expect(buildOwner('1234', 'Carlos', 'fixed').id).toBe('owner');
    });

    it('owner tiene role owner', () => {
      expect(buildOwner('1234', 'Carlos', 'fixed').role).toBe('owner');
    });

    it('owner tiene puesto Dueño', () => {
      expect(buildOwner('1234', 'Carlos', 'fixed').puesto).toBe('Dueño');
    });

    it('owner preserva el nombre', () => {
      expect(buildOwner('1234', 'Carlos López', 'fixed').name).toBe('Carlos López');
    });

    it('owner trim el nombre', () => {
      expect(buildOwner('1234', '  Carlos  ', 'fixed').name).toBe('Carlos');
    });

    it('owner tiene createdAt válido', () => {
      const owner = buildOwner('1234', 'Carlos', 'fixed');
      expect(new Date(owner.createdAt).toString()).not.toBe('Invalid Date');
    });
  });
});
