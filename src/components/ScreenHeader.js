import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ScreenHeader({ title, onBack, rightAction }) {
  const { theme } = useTheme();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={onBack}
      >
        <Feather name="chevron-left" size={22} color={theme.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
      {rightAction || <View style={{ width: 44 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
});
