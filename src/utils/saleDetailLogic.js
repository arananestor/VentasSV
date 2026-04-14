const getItemSections = (sale) =>
  (sale.items || []).map((item, index) => ({
    index,
    productName: item.productName || '',
    size: item.size || '',
    quantity: item.quantity || 1,
    extras: item.extras || [],
    note: item.note || '',
    subtotal: item.subtotal || 0,
    units: item.units || [],
  }));

const shouldShowNote = (item) => !!(item.note && item.note.trim());

const formatExtras = (extras) => {
  if (!extras || extras.length === 0) return '';
  return extras.map(e => typeof e === 'string' ? e : e.name || '').join(', ');
};

const formatItemLine = (item) => {
  const parts = [item.productName];
  if (item.size) parts.push(item.size);
  parts.push(`${item.quantity}x`);
  return parts.join(' · ');
};

const hasPaymentDetails = (sale) =>
  sale.paymentMethod === 'cash' && sale.cashGiven != null;

module.exports = { getItemSections, shouldShowNote, formatExtras, formatItemLine, hasPaymentDetails };
