import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function StatusBadge({ label, color, size = 'small' }) {
  const { theme } = useTheme();
  const isMedium = size === 'medium';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: theme.card, borderColor: theme.cardBorder },
      isMedium && styles.badgeMedium,
    ]}>
      <View style={[
        styles.dot,
        { backgroundColor: color || theme.success },
        isMedium && styles.dotMedium,
      ]} />
      <Text style={[
        styles.label,
        { color: theme.textMuted },
        isMedium && styles.labelMedium,
      ]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1,
  },
  badgeMedium: { gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotMedium: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  labelMedium: { fontSize: 11, fontWeight: '600' },
});
