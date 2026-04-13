import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function BottomSheetModal({ visible, onClose, title, children }) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, maxHeight: '78%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
});
