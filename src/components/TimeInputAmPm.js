import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export function convertTo24h(hourStr, minuteStr, isPM) {
  let h = parseInt(hourStr, 10);
  const m = parseInt(minuteStr || '0', 10);
  if (isNaN(h) || h < 1 || h > 12 || isNaN(m) || m < 0 || m > 59) return '';
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isValidTime12(hourStr, minuteStr) {
  const h = parseInt(hourStr, 10);
  const m = parseInt(minuteStr || '0', 10);
  return !isNaN(h) && h >= 1 && h <= 12 && !isNaN(m) && m >= 0 && m <= 59;
}

export function padMinutes(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 2);
  return digits;
}

export default function TimeInputAmPm({ label, hour, minute, isPM, onChangeHour, onChangeMinute, onChangeAmPm }) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
          placeholder="07"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          value={hour}
          onChangeText={v => onChangeHour(v.replace(/\D/g, '').slice(0, 2))}
        />
        <Text style={[styles.colon, { color: theme.text }]}>:</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
          placeholder="30"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          value={minute}
          onChangeText={v => onChangeMinute(v.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => {
            if (minute && minute.length === 1) onChangeMinute(minute.padStart(2, '0'));
          }}
        />
        <TouchableOpacity
          style={[styles.toggle, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
          onPress={() => onChangeAmPm(!isPM)}
        >
          <Text style={[styles.toggleText, { color: theme.text }]}>{isPM ? 'PM' : 'AM'}</Text>
          <Feather name="repeat" size={12} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { width: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  colon: { fontSize: 18, fontWeight: '900' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  toggleText: { fontSize: 13, fontWeight: '700' },
});
