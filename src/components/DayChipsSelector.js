import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export default function DayChipsSelector({ value = [], onChange }) {
  const { theme } = useTheme();

  const toggle = (day) => {
    onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day]);
  };

  return (
    <View>
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => {
          const active = value.includes(i);
          return (
            <TouchableOpacity
              key={i}
              style={[styles.chip, {
                backgroundColor: active ? theme.accent : theme.bg,
                borderColor: active ? theme.accent : theme.cardBorder,
              }]}
              onPress={() => toggle(i)}
            >
              <Text style={[styles.chipText, { color: active ? theme.accentText : theme.textMuted }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.helpers}>
        <TouchableOpacity onPress={() => onChange([0, 1, 2, 3, 4, 5, 6])}>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>Toda la semana</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange([1, 2, 3, 4, 5])}>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>Lun a Vie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  chip: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  helpers: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  helperText: { fontSize: 12, fontWeight: '600' },
});
