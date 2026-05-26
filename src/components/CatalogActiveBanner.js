import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export function formatCountdown(minutes) {
  if (minutes == null || minutes <= 0) return '';
  if (minutes >= 24 * 60) {
    const days = Math.floor(minutes / (24 * 60));
    const hrs = Math.floor((minutes % (24 * 60)) / 60);
    return `${days}d ${hrs}h`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}h ${mins}min`;
  return `${mins}min`;
}

export default function CatalogActiveBanner({ currentMode, modes, onPress }) {
  const { theme } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, []);

  if (!currentMode || currentMode.isDefault) return null;

  const activeActivation = (currentMode.scheduledActivations || []).find(a => {
    if (!a.endsAt) return false;
    return new Date(a.endsAt).getTime() > now.getTime();
  });

  const minutesLeft = activeActivation
    ? Math.max(0, Math.round((new Date(activeActivation.endsAt).getTime() - now.getTime()) / 60000))
    : null;

  const countdown = minutesLeft != null ? formatCountdown(minutesLeft) : '';

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: theme.success + '18' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: theme.success }]}>VENDIENDO AHORA</Text>
        <Text style={[styles.name, { color: theme.text }]}>
          {currentMode.name}
          {countdown ? ` · Vuelve a Principal en ${countdown}` : ''}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 12, marginBottom: 8,
    borderRadius: 12,
  },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  name: { fontSize: 13, fontWeight: '700' },
});
