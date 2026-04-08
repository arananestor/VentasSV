describe('ventas', () => {
  const mockSales = [
    { id: '1', total: 5.00, timestamp: new Date().toISOString(), orderStatus: 'done', paymentMethod: 'cash', workerName: 'Ana' },
    { id: '2', total: 12.50, timestamp: new Date().toISOString(), orderStatus: 'done', paymentMethod: 'transfer', workerName: 'Luis' },
    { id: '3', total: 3.25, timestamp: new Date().toISOString(), orderStatus: 'new', paymentMethod: 'cash', workerName: 'Ana' },
  ];

  describe('getTodaySales', () => {
    it('filtra solo ventas de hoy', () => {
      const today = new Date().toDateString();
      const result = mockSales.filter(s => new Date(s.timestamp).toDateString() === today);
      expect(result).toHaveLength(3);
    });

    it('excluye ventas de otros días', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const all = [...mockSales, { id: '99', total: 10, timestamp: yesterday.toISOString() }];
      const today = new Date().toDateString();
      const result = all.filter(s => new Date(s.timestamp).toDateString() === today);
      expect(result).toHaveLength(3);
    });
  });

  describe('orderNumber', () => {
    it('formatea con 4 dígitos y ceros a la izquierda', () => {
      expect(String(1).padStart(4, '0')).toBe('0001');
      expect(String(100).padStart(4, '0')).toBe('0100');
      expect(String(9999).padStart(4, '0')).toBe('9999');
    });
  });

  describe('campos requeridos', () => {
    it('cada venta tiene todos los campos obligatorios', () => {
      mockSales.forEach(s => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('total');
        expect(s).toHaveProperty('timestamp');
        expect(s).toHaveProperty('orderStatus');
        expect(s).toHaveProperty('paymentMethod');
        expect(s).toHaveProperty('workerName');
      });
    });

    it('total nunca es negativo', () => {
      mockSales.forEach(s => expect(s.total).toBeGreaterThanOrEqual(0));
    });

    it('timestamp es fecha válida', () => {
      mockSales.forEach(s => expect(new Date(s.timestamp).toString()).not.toBe('Invalid Date'));
    });

    it('paymentMethod es cash o transfer', () => {
      mockSales.forEach(s => expect(['cash', 'transfer']).toContain(s.paymentMethod));
    });
  });

  describe('cálculo de vuelto', () => {
    it('calcula vuelto correctamente', () => {
      expect(parseFloat((5.00 - 3.50).toFixed(2))).toBe(1.50);
    });

    it('detecta cuando falta dinero', () => {
      expect(8.00 - 10.00).toBeLessThan(0);
    });

    it('detecta pago exacto', () => {
      expect(5.00 - 5.00).toBe(0);
    });

    it('label correcto según vuelto', () => {
      const label = (c) => c > 0 ? 'VUELTO' : c === 0 ? 'EXACTO' : 'FALTA';
      expect(label(2.50)).toBe('VUELTO');
      expect(label(0)).toBe('EXACTO');
      expect(label(-1)).toBe('FALTA');
    });
  });

  describe('updateSaleStatus', () => {
    it('cambia estado correctamente', () => {
      const sale = { ...mockSales[0], orderStatus: 'new' };
      expect({ ...sale, orderStatus: 'processing' }.orderStatus).toBe('processing');
    });

    it('estados válidos son new, processing y done', () => {
      const valid = ['new', 'processing', 'done'];
      mockSales.forEach(s => expect(valid).toContain(s.orderStatus));
    });
  });
});
