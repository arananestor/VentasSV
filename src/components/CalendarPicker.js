import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CalendarPicker({ selectedDate, onSelect, minDate }) {
  const { theme } = useTheme();
  const now = new Date();
  const initial = selectedDate || now;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const selStr = selectedDate ? `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}` : null;

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={prev}><Feather name="chevron-left" size={20} color={theme.text} /></TouchableOpacity>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={next}><Feather name="chevron-right" size={20} color={theme.text} /></TouchableOpacity>
      </View>
      <View style={styles.daysHeader}>
        {DAYS.map((d, i) => <Text key={i} style={[styles.dayLabel, { color: theme.textMuted }]}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const dayStr = `${viewYear}-${viewMonth}-${day}`;
          const isToday = dayStr === todayStr;
          const isSel = dayStr === selStr;
          return (
            <TouchableOpacity key={i} style={[styles.cell, isToday && !isSel && { backgroundColor: theme.accent + '22', borderRadius: 18 }, isSel && { backgroundColor: theme.accent, borderRadius: 18 }]}
              onPress={() => onSelect(new Date(viewYear, viewMonth, day))}
            >
              <Text style={[styles.dayText, { color: isSel ? theme.accentText : theme.text }]}>{day}</Text>
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
});
