const buildSaleItem = (cartItem) => ({
  productId: cartItem.product?.id || cartItem.productId || '',
  productName: cartItem.product?.name || cartItem.productName || '',
  size: cartItem.size?.name || cartItem.size || '',
  quantity: cartItem.quantity || 1,
  units: cartItem.units || [],
  extras: cartItem.extras || [],
  note: cartItem.note || '',
  subtotal: cartItem.total || 0,
});

const buildMultiItemSaleData = ({ cart, paymentMethod, cashGiven, change, voucherImage, worker, geo }) => {
  const items = cart.map(buildSaleItem);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return {
    items,
    total,
    paymentMethod,
    cashGiven: cashGiven != null ? cashGiven : null,
    change: change != null ? change : null,
    voucherImage: voucherImage || null,
    workerId: worker?.id || null,
    workerName: worker?.name || 'Sin asignar',
    geo: geo || null,
  };
};

const getSaleItemCount = (sale) =>
  (sale.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

const getSaleSummary = (sale) => {
  const items = sale.items || [];
  if (items.length === 0) return '';
  if (items.length === 1) return items[0].productName;
  return `${items[0].productName} +${items.length - 1}`;
};

const validateSale = (sale) => {
  if (!sale.items || sale.items.length === 0) {
    throw new Error('Sale requires non-empty items[]');
  }
  const subtotalSum = sale.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  if (Math.abs(sale.total - subtotalSum) > 0.01) {
    throw new Error(`Sale total (${sale.total}) does not match sum of subtotals (${subtotalSum})`);
  }
};

module.exports = { buildSaleItem, buildMultiItemSaleData, getSaleItemCount, getSaleSummary, validateSale };
