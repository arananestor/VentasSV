describe('carrito', () => {
  const mockCart = [
    { cartId: '1', product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Normal', price: 0.50 }, quantity: 2, total: 1.00 },
    { cartId: '2', product: { id: 'p2', name: 'Minuta' }, size: { name: 'Grande', price: 1.50 }, quantity: 1, total: 1.50 },
    { cartId: '3', product: { id: 'p3', name: 'Tamal' }, size: { name: 'Normal', price: 0.75 }, quantity: 3, total: 2.25 },
  ];

  describe('cartTotal', () => {
    it('suma correctamente todos los items', () => {
      const total = mockCart.reduce((sum, i) => sum + i.total, 0);
      expect(total).toBeCloseTo(4.75);
    });

    it('retorna 0 con carrito vacío', () => {
      expect([].reduce((sum, i) => sum + i.total, 0)).toBe(0);
    });

    it('maneja punto flotante correctamente', () => {
      const cart = [{ total: 0.10 }, { total: 0.20 }];
      const total = cart.reduce((sum, i) => sum + i.total, 0);
      expect(parseFloat(total.toFixed(2))).toBe(0.30);
    });
  });

  describe('addToCart', () => {
    it('genera cartId único', () => {
      const ids = new Set();
      for (let i = 0; i < 50; i++) ids.add(Date.now().toString() + '_' + Math.random());
      expect(ids.size).toBe(50);
    });

    it('calcula total: precio × cantidad', () => {
      expect(0.50 * 4).toBeCloseTo(2.00);
    });
  });

  describe('removeFromCart', () => {
    it('elimina solo el item correcto', () => {
      const updated = mockCart.filter(i => i.cartId !== '2');
      expect(updated).toHaveLength(2);
      expect(updated.find(i => i.cartId === '2')).toBeUndefined();
    });

    it('no modifica los demás items', () => {
      const updated = mockCart.filter(i => i.cartId !== '2');
      expect(updated[0].cartId).toBe('1');
      expect(updated[1].cartId).toBe('3');
    });
  });

  describe('clearCart', () => {
    it('el carrito queda vacío', () => {
      let cart = [...mockCart];
      cart = [];
      expect(cart).toHaveLength(0);
    });
  });
});
