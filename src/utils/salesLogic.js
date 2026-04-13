const filterTodaySales = (sales) => {
  const today = new Date().toDateString();
  return sales.filter(s => new Date(s.timestamp).toDateString() === today);
};

const formatOrderNumber = (num) => String(num).padStart(4, '0');

const calculateChange = (cashGiven, totalAmount) => cashGiven - totalAmount;

const getChangeLabel = (change) => {
  if (change > 0) return 'VUELTO';
  if (change === 0) return 'EXACTO';
  return 'FALTA';
};

const canCompletePayment = (paymentMethod, effectiveAmount, totalAmount) =>
  (paymentMethod === 'cash' && effectiveAmount >= totalAmount) ||
  paymentMethod === 'transfer';

const buildSaleData = (sale, orderNumber) => ({
  ...sale,
  id: Date.now().toString(),
  orderNumber,
  orderStatus: 'new',
  timestamp: new Date().toISOString(),
});

module.exports = { filterTodaySales, formatOrderNumber, calculateChange, getChangeLabel, canCompletePayment, buildSaleData };
