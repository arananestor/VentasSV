/**
 * Shares a shift summary as CSV file via expo-sharing.
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { buildSalesCSV } from './salesCsv';

export async function shareShiftSummary(shiftSales, worker, businessName) {
  try {
    const csv = buildSalesCSV(shiftSales);
    const namePart = (worker?.name || 'turno').replace(/\s+/g, '_').toLowerCase();
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const filename = `turno_${namePart}_${date}_${hh}${mm}.csv`;
    const path = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(path, csv);
    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: 'Compartir resumen del turno',
    });
    return true;
  } catch (e) {
    return false;
  }
}
