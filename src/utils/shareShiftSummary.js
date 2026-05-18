/**
 * Formats and shares a shift summary message.
 * Pure formatting + expo-sharing integration.
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { methodLabel } from './formatters';

export function formatShiftSummaryMessage(summary, worker, businessName) {
  const lines = [];

  if (businessName) lines.push(businessName);
  lines.push(`Resumen de turno — ${worker?.name || 'Empleado'}`);
  lines.push('');

  if (summary.ticketCount === 0) {
    lines.push('Sin ventas registradas en este turno.');
    return lines.join('\n');
  }

  lines.push(`Duración: ${summary.durationLabel}`);
  lines.push(`Total del turno: $${summary.total.toFixed(2)}`);
  lines.push(`Tickets: ${summary.ticketCount}`);
  lines.push('');

  const methods = Object.entries(summary.byMethod);
  if (methods.length > 0) {
    lines.push('Desglose por método:');
    methods.forEach(([method, amount]) => {
      lines.push(`  ${methodLabel(method)}: $${amount.toFixed(2)}`);
    });
    lines.push('');
  }

  if (summary.topProducts.length > 0) {
    lines.push('Más vendidos:');
    summary.topProducts.forEach(p => {
      lines.push(`  ${p.name} x${p.units}`);
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
