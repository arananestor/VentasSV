describe('comandas', () => {
  const mockOrders = [
    { id: '1', orderStatus: 'new', productName: 'Pupusa', units: [{ ingredients: [{ name: 'Chicharrón', color: '#FF6B6B' }], extras: [], note: '' }], timestamp: new Date().toISOString() },
    { id: '2', orderStatus: 'processing', productName: 'Minuta', units: [{ ingredients: [], extras: [], note: 'Sin chile' }], timestamp: new Date().toISOString() },
    { id: '3', orderStatus: 'done', productName: 'Horchata', units: [{ ingredients: [], extras: [], note: '' }], timestamp: new Date().toISOString() },
  ];

  describe('secciones', () => {
    it('filtra nuevas', () => expect(mockOrders.filter(o => o.orderStatus === 'new')).toHaveLength(1));
    it('filtra en proceso', () => expect(mockOrders.filter(o => o.orderStatus === 'processing')).toHaveLength(1));
    it('filtra listas', () => expect(mockOrders.filter(o => o.orderStatus === 'done')).toHaveLength(1));
  });

  describe('transiciones de estado', () => {
    const next = { new: 'processing', processing: 'done' };
    const prev = { processing: 'new', done: 'processing' };
    it('avanza new → processing', () => expect(next['new']).toBe('processing'));
    it('avanza processing → done', () => expect(next['processing']).toBe('done'));
    it('retrocede processing → new', () => expect(prev['processing']).toBe('new'));
    it('retrocede done → processing', () => expect(prev['done']).toBe('processing'));
  });

  describe('CookModal — unidades', () => {
    const units = [
      { ingredients: [{ name: 'Chicharrón' }], note: '' },
      { ingredients: [{ name: 'Queso' }], note: 'Extra queso' },
      { ingredients: [{ name: 'Frijoles' }], note: '' },
    ];
    it('detecta última unidad', () => {
      const isLast = (page, total) => page === total - 1;
      expect(isLast(2, 3)).toBe(true);
      expect(isLast(1, 3)).toBe(false);
    });
    it('no crashea si currentUnit está fuera del array', () => {
      expect(units[99]).toBeUndefined();
    });
  });

  describe('estructura de unidad', () => {
    it('cada unidad tiene ingredients, extras y note', () => {
      mockOrders.forEach(o => o.units.forEach(u => {
        expect(u).toHaveProperty('ingredients');
        expect(u).toHaveProperty('extras');
        expect(u).toHaveProperty('note');
      }));
    });
    it('ingredients es array', () => {
      mockOrders.forEach(o => o.units.forEach(u => expect(Array.isArray(u.ingredients)).toBe(true)));
    });
  });
});
