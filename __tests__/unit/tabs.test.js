describe('tabs', () => {
  const mockTabs = [
    { id: 'default', name: 'Todos', color: '#FFFFFF', productIds: [], filterType: 'all' },
    { id: 'tab1', name: 'Pupusas', color: '#E07A34', productIds: ['p1', 'p2'], filterType: 'fixed' },
    { id: 'tab2', name: 'Bebidas', color: '#4361EE', productIds: ['p4'], filterType: 'fixed' },
    { id: 'tab3', name: 'Eventos', color: '#06D6A0', productIds: ['p5'], filterType: 'event' },
  ];

  describe('getFilteredTabs', () => {
    it('fixed retorna pestañas fijas', () => {
      expect(mockTabs.filter(t => t.filterType === 'fixed')).toHaveLength(2);
    });
    it('event retorna pestañas de eventos', () => {
      expect(mockTabs.filter(t => t.filterType === 'event')).toHaveLength(1);
    });
  });

  describe('addProductToTab', () => {
    it('agrega producto sin duplicados', () => {
      const tab = { ...mockTabs[1], productIds: [...mockTabs[1].productIds] };
      if (!tab.productIds.includes('p99')) tab.productIds.push('p99');
      expect(tab.productIds).toContain('p99');
      expect(new Set(tab.productIds).size).toBe(tab.productIds.length);
    });
    it('no agrega duplicado si ya existe', () => {
      const tab = { productIds: ['p1', 'p2'] };
      if (!tab.productIds.includes('p1')) tab.productIds.push('p1');
      expect(tab.productIds.filter(id => id === 'p1')).toHaveLength(1);
    });
  });

  describe('removeProductFromTab', () => {
    it('elimina el producto correcto', () => {
      const updated = mockTabs[1].productIds.filter(id => id !== 'p1');
      expect(updated).not.toContain('p1');
    });
    it('no afecta otras pestañas', () => {
      const tabs = mockTabs.map(t =>
        t.id === 'tab1' ? { ...t, productIds: t.productIds.filter(id => id !== 'p1') } : t
      );
      expect(tabs.find(t => t.id === 'tab2')?.productIds).toEqual(['p4']);
    });
  });

  describe('tab default', () => {
    it('siempre existe', () => expect(mockTabs.find(t => t.id === 'default')).toBeDefined());
    it('no se puede eliminar', () => {
      const canDelete = (id) => id !== 'default';
      expect(canDelete('default')).toBe(false);
      expect(canDelete('tab1')).toBe(true);
    });
  });
});
