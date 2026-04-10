import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PrimaryButton({ label, onPress, disabled, variant = 'primary' }) {
  const { theme } = useTheme();

  const bg = variant === 'danger' ? theme.danger
    : variant === 'secondary' ? theme.card
    : theme.accent;

  const textColor = variant === 'secondary' ? theme.text : theme.accentText;

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg }, disabled && { opacity: 0.3 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '900', letterSpacing: 3 },
});
