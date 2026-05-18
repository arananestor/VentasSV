import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import BottomSheetModal from './BottomSheetModal';

export default function PhotoPickerSheet({ visible, onClose, onPickFromCamera, onPickFromGallery }) {
  const { theme } = useTheme();

  const handleOption = (callback) => {
    onClose();
    setTimeout(callback, 300);
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="CAMBIAR FOTO">
      <View style={styles.options}>
        <TouchableOpacity
          style={[styles.row, { borderColor: theme.cardBorder }]}
          onPress={() => handleOption(onPickFromCamera)}
        >
          <Feather name="camera" size={20} color={theme.text} />
          <Text style={[styles.rowText, { color: theme.text }]}>Tomar foto</Text>
          <Feather name="chevron-right" size={16} color={theme.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, { borderColor: theme.cardBorder }]}
          onPress={() => handleOption(onPickFromGallery)}
        >
          <Feather name="image" size={20} color={theme.text} />
          <Text style={[styles.rowText, { color: theme.text }]}>Elegir de galería</Text>
          <Feather name="chevron-right" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={{ height: 20 }} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  options: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
