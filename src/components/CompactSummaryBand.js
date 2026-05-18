import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { computeShiftSummary } from '../utils/shiftSummary';

function formatLiveDuration(shiftStartedAt, now) {
  if (!shiftStartedAt) return '—';
  const ms = new Date(now).getTime() - new Date(shiftStartedAt).getTime();
  if (ms < 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function CompactSummaryBand({ shiftStartedAt, sales, currentWorker }) {
  const { theme } = useTheme();
  const [now, setNow] = useState(new Date().toISOString());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().toISOString()), 60000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date().toISOString());
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, []);

  if (!shiftStartedAt) return null;

  const summary = computeShiftSummary({
    shiftStartedAt,
    sales,
    workerId: currentWorker?.id,
    now,
  });

  return (
    <View style={[styles.band, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.cell}>
        <Text style={[styles.label, { color: theme.textMuted }]}>VENTAS HOY</Text>
        <Text style={[styles.value, { color: theme.text }]}>${summary.total.toFixed(2)}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <View style={styles.cell}>
        <Text style={[styles.label, { color: theme.textMuted }]}>TICKETS</Text>
        <Text style={[styles.value, { color: theme.text }]}>{summary.ticketCount}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <View style={styles.cell}>
        <Text style={[styles.label, { color: theme.textMuted }]}>TURNO</Text>
        <Text style={[styles.value, { color: theme.text }]}>{formatLiveDuration(shiftStartedAt, now)}</Text>
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
