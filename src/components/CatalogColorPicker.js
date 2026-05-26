import React, { useState } from 'react';
import { View, TouchableOpacity, Text, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const CATALOG_COLORS = [
  '#2B9348', '#06D6A0', '#118AB2', '#4361EE',
  '#7209B7', '#B5179E', '#D62828', '#F77F00',
  '#FCBF49', '#1C1C1E', '#6B7280', '#F472B6',
];

export function isValidHex(hex) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

export default function CatalogColorPicker({ value, onChange }) {
  const { theme } = useTheme();
  const [customHex, setCustomHex] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [hexError, setHexError] = useState('');

  const handleCustomSubmit = () => {
    if (isValidHex(customHex)) {
      onChange(customHex);
      setShowCustom(false);
      setHexError('');
    } else {
      setHexError('Formato inválido (#RGB o #RRGGBB)');
    }
  };

  return (
    <View>
      <View style={styles.grid}>
        {CATALOG_COLORS.map(color => (
          <TouchableOpacity
            key={color}
            style={[styles.swatch, { backgroundColor: color }, value === color && styles.selected]}
            onPress={() => onChange(color)}
          >
            {value === color && <Feather name="check" size={16} color="#fff" />}
          </TouchableOpacity>
        ))}
      </View>
      {!value && <Text style={[styles.hint, { color: theme.textMuted }]}>Seleccioná un color</Text>}
      <TouchableOpacity onPress={() => setShowCustom(!showCustom)}>
        <Text style={[styles.customLink, { color: theme.textSecondary }]}>
          {showCustom ? 'Cancelar' : 'Mi color'}
        </Text>
      </TouchableOpacity>
      {showCustom && (
        <View style={styles.customRow}>
          <TextInput
            style={[styles.hexInput, { color: theme.text, borderColor: hexError ? theme.danger : theme.cardBorder, backgroundColor: theme.bg }]}
            placeholder="#FF5733"
            placeholderTextColor={theme.textMuted}
            value={customHex}
            onChangeText={v => { setCustomHex(v); setHexError(''); }}
            autoCapitalize="characters"
            maxLength={7}
          />
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: theme.accent }]} onPress={handleCustomSubmit}>
            <Text style={{ color: theme.accentText, fontWeight: '700', fontSize: 13 }}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      )}
      {hexError ? <Text style={[styles.error, { color: theme.danger }]}>{hexError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  selected: { borderWidth: 3, borderColor: '#fff' },
  hint: { textAlign: 'center', fontSize: 12, fontWeight: '500', marginTop: 8 },
  customLink: { textAlign: 'center', fontSize: 12, fontWeight: '600', marginTop: 10 },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  hexInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '600' },
  applyBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  error: { fontSize: 11, fontWeight: '500', marginTop: 4 },
});
