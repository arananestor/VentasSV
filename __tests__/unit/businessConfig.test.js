describe('businessConfig', () => {
  describe('validación WhatsApp', () => {
    const isValid = (num) => num.replace(/\D/g, '').length >= 8;
    it('acepta número válido', () => expect(isValid('70001234')).toBe(true));
    it('acepta número con guión', () => expect(isValid('7000-1234')).toBe(true));
    it('rechaza número corto', () => expect(isValid('1234')).toBe(false));
    it('rechaza vacío', () => expect(isValid('')).toBe(false));
  });

  describe('buildTicketMessage', () => {
    const build = (sale) => {
      const methods = { cash: 'Efectivo', transfer: 'Transferencia' };
      return encodeURIComponent([
        `Pedido #${sale.orderNumber || '----'}`,
        `${sale.productName}`,
        `Total: $${sale.total?.toFixed(2)}`,
        `Pago: ${methods[sale.paymentMethod] || sale.paymentMethod}`,
      ].join('\n'));
    };
    const sale = { orderNumber: '0001', productName: 'Pupusa', total: 1.50, paymentMethod: 'cash' };

    it('genera mensaje sin errores', () => expect(() => build(sale)).not.toThrow());
    it('incluye número de orden', () => expect(decodeURIComponent(build(sale))).toContain('0001'));
    it('incluye total', () => expect(decodeURIComponent(build(sale))).toContain('1.50'));
    it('incluye nombre del producto', () => expect(decodeURIComponent(build(sale))).toContain('Pupusa'));
    it('muestra método en español', () => expect(decodeURIComponent(build(sale))).toContain('Efectivo'));
  });

  describe('datos bancarios', () => {
    const isComplete = (bc) => !!(bc?.bank?.trim() && bc?.holder?.trim() && bc?.account?.trim());
    it('completo cuando tiene banco, titular y cuenta', () => {
      expect(isComplete({ bank: 'Agrícola', holder: 'Carlos', account: '123' })).toBe(true);
    });
    it('incompleto si falta algún campo', () => {
      expect(isComplete({ bank: '', holder: 'Ana', account: '123' })).toBe(false);
    });
    it('incompleto si es null', () => expect(isComplete(null)).toBe(false));
  });
});
