/**
 * Formats and shares a shift summary message.
 * Pure formatting + expo-sharing integration.
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { methodLabel } from './formatters';

export function formatShiftSummaryMessage(summary, worker, businessName) {
  const lines = [];
  const sep = '--------------------------------';

  lines.push('VENTASSV — Resumen de Turno');
  lines.push('');

  if (businessName) lines.push(`Negocio: ${businessName}`);
  lines.push(`Empleado: ${worker?.name || 'Empleado'} · ${worker?.puesto || 'Cajero'}`);

  if (summary.shiftSales && summary.shiftSales.length > 0) {
    const firstSale = summary.shiftSales[0];
    const d = new Date(firstSale.timestamp);
    lines.push(`Fecha: ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
  }

  lines.push(`Turno: ${summary.durationLabel}`);
  lines.push('');

  if (summary.ticketCount === 0) {
    lines.push('Sin ventas registradas en este turno.');
    return lines.join('\n');
  }

  lines.push(sep);
  lines.push('TOTALES');
  lines.push(`Total turno: $${summary.total.toFixed(2)}`);
  lines.push(`Tickets: ${summary.ticketCount}`);
  lines.push('');

  const methods = Object.entries(summary.byMethod);
  if (methods.length > 0) {
    lines.push('Metodos de pago:');
    methods.forEach(([method, amount]) => {
      lines.push(`  ${methodLabel(method)}: $${amount.toFixed(2)}`);
    });
    lines.push('');
  }

  lines.push(sep);
  lines.push('DETALLE DE VENTAS');

  const tickets = summary.shiftSales || [];
  tickets.forEach(sale => {
    lines.push('');
    const time = new Date(sale.timestamp);
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    lines.push(`Ticket #${sale.orderNumber || sale.id?.slice(-4)} — ${hh}:${mm}`);

    (sale.items || []).forEach(item => {
      const qty = item.quantity || 1;
      const name = item.product?.name || item.name || 'Producto';
      const size = item.size?.name ? ` · ${item.size.name}` : '';
      lines.push(`  ${qty}x ${name}${size}`);
      if (item.extras?.length > 0) {
        lines.push(`      + ${item.extras.map(e => e.name).join(', ')}`);
      }
      if (item.note) {
        lines.push(`      Nota: ${item.note}`);
      }
    });

    lines.push(`  Pago: ${methodLabel(sale.paymentMethod || 'cash')} · $${(sale.total || 0).toFixed(2)}`);
  });

  if (summary.productsSummary && summary.productsSummary.length > 0) {
    lines.push('');
    lines.push(sep);
    lines.push('MAS VENDIDOS');
    summary.productsSummary.forEach(p => {
      lines.push(`  ${p.units}x ${p.name}`);
    });
  }

  return lines.join('\n');
}

export async function shareShiftSummary(message) {
  try {
    const path = FileSystem.cacheDirectory + 'resumen-turno.txt';
    await FileSystem.writeAsStringAsync(path, message);
    await Sharing.shareAsync(path, {
      mimeType: 'text/plain',
      dialogTitle: 'Compartir resumen de turno',
    });
    return true;
  } catch (e) {
    return false;
  }
}
