import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
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

export default function TimeInputAmPm({ label, hour, minute, isPM, onChangeHour, onChangeMinute, onChangeAmPm, nextRef, hourRef: externalHourRef }) {
  const { theme } = useTheme();
  const internalHourRef = useRef(null);
  const hourRef = externalHourRef || internalHourRef;
  const minuteRef = useRef(null);

  const handleHourChange = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 2);
    onChangeHour(digits);
    if (digits.length === 2) minuteRef.current?.focus();
  };

  const handleMinuteChange = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 2);
    onChangeMinute(digits);
    if (digits.length === 2 && nextRef?.current) nextRef.current.focus();
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>}
      <View style={styles.row}>
        <TextInput
          ref={hourRef}
          style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
          placeholder="07"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          value={hour}
          onChangeText={handleHourChange}
          selectTextOnFocus
        />
        <Text style={[styles.colon, { color: theme.text }]}>:</Text>
        <TextInput
          ref={minuteRef}
          style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
          placeholder="30"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          value={minute}
          onChangeText={handleMinuteChange}
          onBlur={() => {
            if (minute && minute.length === 1) onChangeMinute(minute.padStart(2, '0'));
          }}
          selectTextOnFocus
        />
        <TouchableOpacity
          style={[styles.toggle, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
          onPress={() => onChangeAmPm(!isPM)}
        >
          <Text style={[styles.toggleText, { color: theme.text }]}>{isPM ? 'PM' : 'AM'}</Text>
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
  toggle: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  toggleText: { fontSize: 13, fontWeight: '700' },
});
