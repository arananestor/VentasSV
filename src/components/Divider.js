import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Divider({ spacing }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: theme.cardBorder },
        spacing != null && { marginTop: spacing, marginBottom: spacing },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: { height: 1 },
});
