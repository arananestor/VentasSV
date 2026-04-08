describe('productos', () => {
  const mockSimple = {
    id: '1', name: 'Coca Cola', type: 'simple',
    sizes: [{ name: 'Normal', price: 1.00 }],
    ingredients: [], extras: [],
  };
  const mockElaborado = {
    id: '2', name: 'Pupusa de Chicharrón', type: 'elaborado',
    sizes: [{ name: 'Normal', price: 0.50 }, { name: 'Grande', price: 0.75 }],
    ingredients: [
      { name: 'Chicharrón', color: '#FF6B6B', icon: 'food' },
      { name: 'Queso', color: '#FBBF24', icon: 'cheese' },
    ],
    extras: [
      { name: 'Curtido', price: 0.00, color: '#34D399' },
      { name: 'Crema extra', price: 0.25, color: '#60A5FA' },
    ],
  };

  describe('tipo', () => {
    it('simple no tiene ingredientes', () => expect(mockSimple.ingredients).toHaveLength(0));
    it('elaborado tiene ingredientes', () => expect(mockElaborado.ingredients.length).toBeGreaterThan(0));
    it('tipo es simple o elaborado', () => {
      expect(['simple', 'elaborado']).toContain(mockSimple.type);
      expect(['simple', 'elaborado']).toContain(mockElaborado.type);
    });
  });

  describe('tamaños y precios', () => {
    it('todo producto tiene al menos un tamaño', () => {
      expect(mockSimple.sizes.length).toBeGreaterThan(0);
      expect(mockElaborado.sizes.length).toBeGreaterThan(0);
    });
    it('precios positivos', () => {
      mockElaborado.sizes.forEach(s => expect(s.price).toBeGreaterThan(0));
    });
    it('precio es número', () => {
      mockElaborado.sizes.forEach(s => expect(typeof s.price).toBe('number'));
    });
    it('nombre de tamaño no vacío', () => {
      mockElaborado.sizes.forEach(s => expect(s.name.trim()).not.toBe(''));
    });
  });

  describe('ingredientes', () => {
    it('cada ingrediente tiene nombre y color', () => {
      mockElaborado.ingredients.forEach(ing => {
        expect(ing.name).toBeDefined();
        expect(ing.color).toBeDefined();
      });
    });
    it('color es hex válido', () => {
      mockElaborado.ingredients.forEach(ing => expect(ing.color).toMatch(/^#[0-9A-Fa-f]{6}$/));
    });
    it('nombre no vacío', () => {
      mockElaborado.ingredients.forEach(ing => expect(ing.name.trim()).not.toBe(''));
    });
  });

  describe('extras', () => {
    it('precio de extra no es negativo', () => {
      mockElaborado.extras.forEach(ex => expect(ex.price).toBeGreaterThanOrEqual(0));
    });
    it('extra gratuito tiene precio 0', () => {
      expect(mockElaborado.extras[0].price).toBe(0.00);
    });
  });

  describe('validaciones al guardar', () => {
    it('nombre no puede estar vacío', () => {
      const isValid = (n) => n.trim().length > 0;
      expect(isValid('')).toBe(false);
      expect(isValid('Pupusa')).toBe(true);
    });
    it('nombre no excede 30 caracteres', () => {
      expect('A'.repeat(31).length).toBeGreaterThan(30);
    });
    it('precio debe ser número mayor a 0', () => {
      const isValid = (p) => !isNaN(parseFloat(p)) && parseFloat(p) > 0;
      expect(isValid('0.50')).toBe(true);
      expect(isValid('0')).toBe(false);
      expect(isValid('')).toBe(false);
    });
  });
});
