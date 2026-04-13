import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemedTextInput({
  label, value, onChangeText, placeholder, error,
  prefix, keyboardType, maxLength, autoFocus, secureTextEntry,
  autoCapitalize, multiline, style,
}) {
  const { theme } = useTheme();

  return (
    <View>
      {label ? (
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      ) : null}
      <View style={[
        styles.inputRow,
        { backgroundColor: theme.input, borderColor: error ? '#FF3B30' : theme.inputBorder },
        style,
      ]}>
        {prefix ? (
          <Text style={[styles.prefix, { color: theme.textMuted }]}>{prefix}</Text>
        ) : null}
        <TextInput
          style={[prefix ? styles.inputWithPrefix : styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoFocus={autoFocus}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
        />
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6, marginTop: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 16, borderWidth: 1,
  },
  prefix: { fontSize: 15, fontWeight: '600', marginRight: 8 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 14 },
  inputWithPrefix: { flex: 1, fontSize: 17, fontWeight: '600', paddingVertical: 16 },
  error: { fontSize: 12, fontWeight: '600', color: '#FF3B30', marginTop: 6 },
});
