import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { computeShiftSummary } from '../utils/shiftSummary';

export default function CompactSummaryBand({ shiftStartedAt, currentWorker, isOwnerView }) {
  const { theme } = useTheme();
  const { sales } = useApp();

  if (!shiftStartedAt && !isOwnerView) return null;

  let summary;
  if (isOwnerView) {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
    summary = computeShiftSummary({
      shiftStartedAt: new Date(new Date().toDateString()).toISOString(),
      sales: todaySales,
      workerId: null,
    });
    // Include all today's sales for owner regardless of workerId
    summary.ticketCount = todaySales.length;
    summary.total = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  } else {
    summary = computeShiftSummary({
      shiftStartedAt,
      sales,
      workerId: currentWorker?.id,
    });
  }

  const startTime = shiftStartedAt
    ? new Date(shiftStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';

  return (
    <View style={[styles.band, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.cell}>
        <Text style={[styles.label, { color: theme.textMuted }]}>
          {isOwnerView ? 'VENTAS DÍA' : 'VENTAS HOY'}
        </Text>
        <Text style={[styles.value, { color: theme.text }]}>${summary.total.toFixed(2)}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <View style={styles.cell}>
        <Text style={[styles.label, { color: theme.textMuted }]}>TICKETS</Text>
        <Text style={[styles.value, { color: theme.text }]}>{summary.ticketCount}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <View style={styles.cell}>
        <Text style={[styles.label, { color: theme.textMuted }]}>
          {isOwnerView ? 'DÍA DESDE' : 'TURNO DESDE'}
        </Text>
        <Text style={[styles.value, { color: theme.text }]}>
          {isOwnerView ? '00:00' : startTime}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, marginBottom: 12,
    height: 56,
  },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '800' },
  divider: { width: 1, height: 28 },
});
