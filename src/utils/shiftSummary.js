/**
 * Computes a summary of a worker's shift from sales data.
 * Pure function — no side effects, fully testable.
 */

export function computeShiftSummary({ shiftStartedAt, sales, workerId, now }) {
  const nowDate = now ? new Date(now) : new Date();

  if (!shiftStartedAt) {
    return {
      durationMs: null,
      durationLabel: '—',
      ticketCount: 0,
      total: 0,
      byMethod: {},
      productsSummary: [],
    };
  }

  const shiftStart = new Date(shiftStartedAt);
  const durationMs = nowDate.getTime() - shiftStart.getTime();

  const shiftSales = sales.filter(s => {
    const ts = new Date(s.timestamp);
    if (ts < shiftStart) return false;
    if (s.workerId && s.workerId !== workerId) return false;
    return true;
  });

  const total = shiftSales.reduce((sum, s) => sum + (s.total || 0), 0);

  const byMethod = {};
  shiftSales.forEach(s => {
    const method = s.paymentMethod || 'efectivo';
    byMethod[method] = (byMethod[method] || 0) + (s.total || 0);
  });

  const productMap = {};
  shiftSales.forEach(s => {
    (s.items || []).forEach(item => {
      const name = item.productName || item.name || 'Producto';
      const units = (item.units?.length) || item.quantity || 1;
      productMap[name] = (productMap[name] || 0) + units;
    });
  });

  const productsSummary = Object.entries(productMap)
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units);

  return {
    durationMs,
    durationLabel: formatDuration(durationMs),
    ticketCount: shiftSales.length,
    total,
    byMethod,
    productsSummary,
    shiftSales,
  };
}

function formatDuration(ms) {
  if (ms == null || ms < 0) return '—';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}
