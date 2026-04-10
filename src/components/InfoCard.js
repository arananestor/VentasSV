import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function InfoCard({ label, value, icon }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <View style={styles.valueRow}>
        {icon || null}
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', borderRadius: 14, padding: 16, borderWidth: 1 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  value: { fontSize: 14, fontWeight: '700' },
});
