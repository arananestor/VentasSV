import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function convertTo24h(timeStr, isPM) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h) || h < 1 || h > 12 || isNaN(m) || m < 0 || m > 59) return '';
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

export function isValidTime12(str) {
  if (!str) return false;
  const [hStr, mStr] = str.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  return h >= 1 && h <= 12 && m >= 0 && m <= 59;
}

export default function TimeInputAmPm({ label, value, isPM, onChangeTime, onChangeAmPm }) {
  const { theme } = useTheme();

  const handleText = (raw) => {
    onChangeTime(formatTimeInput(raw));
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
          placeholder="07:00"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          maxLength={5}
          value={value}
          onChangeText={handleText}
        />
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: !isPM ? theme.accent : theme.bg, borderColor: !isPM ? theme.accent : theme.cardBorder }]}
          onPress={() => onChangeAmPm(false)}
        >
          <Text style={[styles.chipText, { color: !isPM ? theme.accentText : theme.textMuted }]}>AM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: isPM ? theme.accent : theme.bg, borderColor: isPM ? theme.accent : theme.cardBorder }]}
          onPress={() => onChangeAmPm(true)}
        >
          <Text style={[styles.chipText, { color: isPM ? theme.accentText : theme.textMuted }]}>PM</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '700' },
});
