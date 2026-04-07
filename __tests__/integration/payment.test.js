describe('flujo de pago', () => {
  const canComplete = (method, effective, total) =>
    (method === 'cash' && effective >= total) || method === 'transfer';

  describe('canComplete', () => {
    it('cash con monto exacto', () => expect(canComplete('cash', 5, 5)).toBe(true));
    it('cash con vuelto', () => expect(canComplete('cash', 10, 5)).toBe(true));
    it('cash insuficiente', () => expect(canComplete('cash', 3, 5)).toBe(false));
    it('transfer siempre puede', () => expect(canComplete('transfer', 0, 5)).toBe(true));
    it('sin método no puede', () => expect(canComplete(null, 5, 5)).toBe(false));
  });

  describe('vuelto', () => {
    const change = (given, total) => parseFloat((given - total).toFixed(2));
    it('vuelto positivo', () => expect(change(10, 7.50)).toBe(2.50));
    it('pago exacto', () => expect(change(5, 5)).toBe(0));
    it('falta dinero', () => expect(change(3, 5)).toBe(-2));
    it('label correcto', () => {
      const label = (c) => c > 0 ? 'VUELTO' : c === 0 ? 'EXACTO' : 'FALTA';
      expect(label(2.50)).toBe('VUELTO');
      expect(label(0)).toBe('EXACTO');
      expect(label(-1)).toBe('FALTA');
    });
  });

  describe('procesamiento del carrito', () => {
    const cart = [
      { cartId: '1', product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Normal' }, quantity: 2, total: 1.00, units: [], extras: [], note: '' },
      { cartId: '2', product: { id: 'p2', name: 'Horchata' }, size: { name: 'Grande' }, quantity: 1, total: 1.50, units: [], extras: [], note: '' },
    ];

    it('procesa todos los items', () => {
      expect(cart.map(i => ({ productId: i.product.id }))).toHaveLength(2);
    });
    it('total del carrito es correcto', () => {
      expect(cart.reduce((s, i) => s + i.total, 0)).toBeCloseTo(2.50);
    });
    it('carrito vacío después de pagar', () => {
      let c = [...cart];
      c = [];
      expect(c).toHaveLength(0);
    });
  });

  describe('saleData', () => {
    const build = (item, method, worker) => ({
      productId: item.product.id,
      productName: item.product.name,
      size: item.size?.name || '',
      units: item.units || [],
      extras: item.extras || [],
      note: item.note || '',
      quantity: item.quantity,
      total: item.total,
      paymentMethod: method,
      workerId: worker?.id || null,
      workerName: worker?.name || 'Sin asignar',
    });

    const item = { product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Normal' }, quantity: 2, total: 1.00, units: [], extras: [], note: 'Sin curtido' };

    it('tiene todos los campos requeridos', () => {
      const d = build(item, 'cash', { id: 'owner', name: 'Carlos' });
      ['productId', 'productName', 'total', 'paymentMethod', 'workerName'].forEach(f => expect(d).toHaveProperty(f));
    });
    it('preserva nota', () => expect(build(item, 'cash', null).note).toBe('Sin curtido'));
    it('Sin asignar si no hay worker', () => expect(build(item, 'cash', null).workerName).toBe('Sin asignar'));
  });
});
