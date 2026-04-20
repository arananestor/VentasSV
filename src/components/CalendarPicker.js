import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const dayKey = (d) => d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null;
const isBetween = (d, start, end) => {
  if (!start || !end || !d) return false;
  const t = d.getTime();
  return t > start.getTime() && t < end.getTime();
};

export default function CalendarPicker({ startDate, endDate, onSelectStart, onSelectEnd, minDate }) {
  const { theme } = useTheme();
  const now = new Date();
  const initial = startDate || now;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [picker, setPicker] = useState(null); // null | 'month' | 'year'

  const todayKey = dayKey(now);
  const startKey = dayKey(startDate);
  const endKey = dayKey(endDate);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => { if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); } else setViewMonth(viewMonth + 1); };

  const handleDayPress = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    if (!startDate || (startDate && endDate)) {
      onSelectStart(date);
      if (onSelectEnd) onSelectEnd(null);
    } else if (startDate && !endDate) {
      if (date.getTime() < startDate.getTime()) {
        onSelectStart(date);
      } else if (dayKey(date) === startKey) {
        onSelectStart(null);
      } else {
        if (onSelectEnd) onSelectEnd(date);
      }
    }
  };

  if (picker === 'month') {
    return (
      <View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPicker(null)}><Feather name="x" size={18} color={theme.textMuted} /></TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.text }]}>Elegir mes</Text>
          <View style={{ width: 18 }} />
        </View>
        <View style={styles.monthGrid}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity key={i} style={[styles.monthCell, i === viewMonth && { backgroundColor: theme.accent + '22' }]}
              onPress={() => { setViewMonth(i); setPicker(null); }}>
              <Text style={[styles.monthCellText, { color: i === viewMonth ? theme.accent : theme.text }]}>{m.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (picker === 'year') {
    return (
      <View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPicker(null)}><Feather name="x" size={18} color={theme.textMuted} /></TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.text }]}>Elegir año</Text>
          <View style={{ width: 18 }} />
        </View>
        <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
          {YEARS.map(y => (
            <TouchableOpacity key={y} style={[styles.yearRow, y === viewYear && { backgroundColor: theme.accent + '22' }]}
              onPress={() => { setViewYear(y); setPicker(null); }}>
              <Text style={[styles.yearText, { color: y === viewYear ? theme.accent : theme.text }]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={prev}><Feather name="chevron-left" size={20} color={theme.text} /></TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={() => setPicker('month')}>
            <Text style={[styles.monthLabel, { color: theme.text }]}>{MONTHS[viewMonth]}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPicker('year')}>
            <Text style={[styles.monthLabel, { color: theme.textMuted }]}>{viewYear}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={next}><Feather name="chevron-right" size={20} color={theme.text} /></TouchableOpacity>
      </View>
      <View style={styles.daysHeader}>
        {DOW.map((d, i) => <Text key={i} style={[styles.dayLabel, { color: theme.textMuted }]}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const date = new Date(viewYear, viewMonth, day);
          const dk = dayKey(date);
          const isToday = dk === todayKey;
          const isStart = dk === startKey;
          const isEnd = dk === endKey;
          const inRange = isBetween(date, startDate, endDate);
          return (
            <TouchableOpacity key={i}
              style={[
                styles.cell,
                inRange && { backgroundColor: theme.accent + '14' },
                isToday && !isStart && !isEnd && { backgroundColor: theme.accent + '22', borderRadius: 18 },
                (isStart || isEnd) && { backgroundColor: theme.accent, borderRadius: 18 },
              ]}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[styles.dayText, { color: (isStart || isEnd) ? theme.accentText : theme.text }]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  monthLabel: { fontSize: 15, fontWeight: '700' },
  daysHeader: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', height: 36, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingVertical: 12 },
  monthCell: { width: '28%', paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  monthCellText: { fontSize: 14, fontWeight: '600' },
  yearRow: { paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  yearText: { fontSize: 16, fontWeight: '700' },
});
