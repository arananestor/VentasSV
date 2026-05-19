/**
 * CSV generation for sales data.
 * Pure functions — no side effects, fully testable.
 */

import { methodLabel } from './formatters';

export function formatCSVCell(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const HEADER = [
  'No. Pedido', 'Fecha', 'Hora', 'Producto', 'Tamaño',
  'Cantidad', 'Extras', 'Nota', 'Subtotal item',
  'Método de pago', 'Total venta', 'Cajero',
  'Latitud', 'Longitud', 'Precisión (m)',
].map(formatCSVCell).join(',');

export function buildSalesCSV(sales) {
  const rows = [];

  sales.forEach(s => {
    const items = s.items || [];
    if (items.length === 0) return;

    const d = new Date(s.timestamp);
    const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const hora = d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const orderNum = `#${s.orderNumber || s.id?.slice(-4) || '0000'}`;
    const method = methodLabel(s.paymentMethod || 'cash');
    const totalVenta = (s.total || 0).toFixed(2);
    const cajero = s.workerName || '';
    const lat = s.geo?.latitude != null ? s.geo.latitude : '';
    const lon = s.geo?.longitude != null ? s.geo.longitude : '';
    const acc = s.geo?.accuracy != null ? Math.round(s.geo.accuracy) : '';

    items.forEach(item => {
      const extras = (item.extras || [])
        .map(e => typeof e === 'string' ? e : (e?.name || ''))
        .filter(Boolean)
        .join(', ');

      const row = [
        orderNum, fecha, hora,
        item.productName || item.name || '',
        item.size || '',
        item.quantity || 1,
        extras,
        item.note || '',
        (item.subtotal || item.total || 0).toFixed(2),
        method, totalVenta, cajero,
        lat, lon, acc,
      ].map(formatCSVCell).join(',');

      rows.push(row);
    });
  });

  return [HEADER, ...rows].join('\n');
}
