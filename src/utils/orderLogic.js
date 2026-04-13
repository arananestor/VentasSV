const STATUS = {
  new:        { label: 'NUEVOS',     color: '#F77F00' },
  processing: { label: 'EN PROCESO', color: '#4361EE' },
  done:       { label: 'LISTOS',     color: '#2B9348' },
};

const STATUS_KEYS = ['new', 'processing', 'done'];

const filterByStatus = (sales, status) =>
  sales.filter(s => (s.orderStatus || 'new') === status);

const getNextStatus = (currentStatus) => {
  const idx = STATUS_KEYS.indexOf(currentStatus || 'new');
  return idx < STATUS_KEYS.length - 1 ? STATUS_KEYS[idx + 1] : null;
};

const getPrevStatus = (currentStatus) => {
  const idx = STATUS_KEYS.indexOf(currentStatus || 'new');
  return idx > 0 ? STATUS_KEYS[idx - 1] : null;
};

const isValidUnit = (unit) =>
  unit != null && typeof unit === 'object';

module.exports = { STATUS, STATUS_KEYS, filterByStatus, getNextStatus, getPrevStatus, isValidUnit };
