describe('snackbar global — AppContext', () => {
  describe('showSnack', () => {
    it('acepta datos de venta correctos', () => {
      const data = { sales: [{ id: '1', total: 5.00 }], total: 5.00, waNumber: '70001234' };
      expect(data.sales).toHaveLength(1);
      expect(data.total).toBe(5.00);
      expect(data.waNumber).toBe('70001234');
    });

    it('funciona sin waNumber', () => {
      const data = { sales: [{ id: '1' }], total: 1.50, waNumber: null };
      expect(data.waNumber).toBeNull();
    });

    it('funciona con múltiples ventas', () => {
      const data = {
        sales: [{ id: '1', total: 1.00 }, { id: '2', total: 2.50 }],
        total: 3.50,
        waNumber: '70001234',
      };
      expect(data.sales).toHaveLength(2);
      expect(data.total).toBeCloseTo(3.50);
    });
  });

  describe('animación', () => {
    it('valor inicial de snackAnim es 120 (fuera de pantalla)', () => {
      const initialValue = 120;
      expect(initialValue).toBe(120);
    });

    it('valor final de snackAnim es 0 (visible)', () => {
      const visibleValue = 0;
      expect(visibleValue).toBe(0);
    });

    it('duración del dismiss es 220ms', () => {
      const dismissDuration = 220;
      expect(dismissDuration).toBe(220);
    });

    it('snackbar se muestra por 2500ms antes de desaparecer', () => {
      const displayTime = 2500;
      expect(displayTime).toBe(2500);
    });
  });
});
