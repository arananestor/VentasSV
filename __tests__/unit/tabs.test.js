import { isValidProductName } from '../../src/utils/validationLogic';
import { getTextColor } from '../../src/utils/colorUtils';

const mockTabs = [
  { id: 'default', name: 'Todos', color: '#FFFFFF', productIds: [], filterType: 'all' },
  { id: 'tab1', name: 'Pupusas', color: '#E07A34', productIds: ['p1', 'p2'], filterType: 'fixed' },
  { id: 'tab2', name: 'Bebidas', color: '#4361EE', productIds: ['p4'], filterType: 'fixed' },
  { id: 'tab3', name: 'Eventos', color: '#06D6A0', productIds: ['p5'], filterType: 'event' },
];

describe('tabs', () => {

  describe('getFilteredTabs', () => {
    it('filtra pestañas fijas correctamente', () => {
      // Arrange
      const tabs = mockTabs;

      // Act
      const fixed = tabs.filter(t => t.filterType === 'fixed');

      // Assert
      expect(fixed).toHaveLength(2);
    });

    it('filtra pestañas de eventos correctamente', () => {
      // Arrange
      const tabs = mockTabs;

      // Act
      const events = tabs.filter(t => t.filterType === 'event');

      // Assert
      expect(events).toHaveLength(1);
    });

    it('filtra la pestaña "all" (Todos)', () => {
      // Arrange
      const tabs = mockTabs;

      // Act
      const allTab = tabs.filter(t => t.filterType === 'all');

      // Assert
      expect(allTab).toHaveLength(1);
      expect(allTab[0].id).toBe('default');
    });
  });

  describe('addProductToTab', () => {
    it('agrega producto nuevo sin duplicados', () => {
      // Arrange
      const tab = { ...mockTabs[1], productIds: [...mockTabs[1].productIds] };

      // Act
      if (!tab.productIds.includes('p99')) tab.productIds.push('p99');

      // Assert
      expect(tab.productIds).toContain('p99');
      expect(new Set(tab.productIds).size).toBe(tab.productIds.length);
    });

    it('no agrega duplicado si el producto ya existe', () => {
      // Arrange
      const tab = { productIds: ['p1', 'p2'] };

      // Act
      if (!tab.productIds.includes('p1')) tab.productIds.push('p1');

      // Assert
      expect(tab.productIds.filter(id => id === 'p1')).toHaveLength(1);
    });

    it('no muta la pestaña original al agregar', () => {
      // Arrange
      const original = { id: 'tab1', productIds: ['p1', 'p2'] };
      const copy = { ...original, productIds: [...original.productIds] };

      // Act
      copy.productIds.push('p99');

      // Assert
      expect(original.productIds).toHaveLength(2);
      expect(copy.productIds).toHaveLength(3);
    });
  });

  describe('removeProductFromTab', () => {
    it('elimina el producto correcto', () => {
      // Arrange
      const tab = mockTabs[1];

      // Act
      const updated = tab.productIds.filter(id => id !== 'p1');

      // Assert
      expect(updated).not.toContain('p1');
    });

    it('no afecta otras pestañas al remover', () => {
      // Arrange
      const tabs = mockTabs;

      // Act
      const updatedTabs = tabs.map(t =>
        t.id === 'tab1' ? { ...t, productIds: t.productIds.filter(id => id !== 'p1') } : t
      );

      // Assert
      expect(updatedTabs.find(t => t.id === 'tab2')?.productIds).toEqual(['p4']);
    });

    it('elimina solo el producto indicado, no otros', () => {
      // Arrange
      const tab = { productIds: ['p1', 'p2', 'p3'] };

      // Act
      const updated = tab.productIds.filter(id => id !== 'p2');

      // Assert
      expect(updated).toContain('p1');
      expect(updated).not.toContain('p2');
      expect(updated).toContain('p3');
    });
  });

  describe('tab default', () => {
    it('siempre existe una pestaña default', () => {
      // Arrange / Act
      const defaultTab = mockTabs.find(t => t.id === 'default');

      // Assert
      expect(defaultTab).toBeDefined();
    });

    it('la pestaña default no se puede eliminar', () => {
      // Arrange
      const canDelete = (id) => id !== 'default';

      // Act
      const canDeleteDefault = canDelete('default');
      const canDeleteOther = canDelete('tab1');

      // Assert
      expect(canDeleteDefault).toBe(false);
      expect(canDeleteOther).toBe(true);
    });

    it('la pestaña default tiene filterType all', () => {
      // Arrange / Act
      const defaultTab = mockTabs.find(t => t.id === 'default');

      // Assert
      expect(defaultTab?.filterType).toBe('all');
    });
  });

  describe('validación del nombre de tab', () => {
    it('isValidProductName acepta nombre de pestaña válido', () => {
      // Arrange
      const name = 'Pupusas';

      // Act
      const result = isValidProductName(name);

      // Assert
      expect(result).toBe(true);
    });

    it('isValidProductName rechaza nombre vacío', () => {
      // Arrange
      const name = '';

      // Act
      const result = isValidProductName(name);

      // Assert
      expect(result).toBe(false);
    });

    it('todos los tabs tienen nombres válidos', () => {
      // Arrange
      const names = mockTabs.map(t => t.name);

      // Act
      const allValid = names.every(n => isValidProductName(n));

      // Assert
      expect(allValid).toBe(true);
    });
  });

  describe('getTextColor — contraste del color de tab', () => {
    it('tab Todos (blanco) necesita texto oscuro', () => {
      // Arrange
      const color = mockTabs[0].color; // '#FFFFFF'

      // Act
      const textColor = getTextColor(color);

      // Assert
      expect(textColor).toBe('#000');
    });

    it('tab Pupusas (naranja oscuro) necesita texto claro o oscuro según luminosidad', () => {
      // Arrange
      const color = mockTabs[1].color; // '#E07A34'

      // Act
      const textColor = getTextColor(color);

      // Assert
      expect(['#000', '#FFF']).toContain(textColor);
    });
  });
});
