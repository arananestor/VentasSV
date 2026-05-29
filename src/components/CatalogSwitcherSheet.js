import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import BottomSheetModal from './BottomSheetModal';

export default function CatalogSwitcherSheet({ visible, onClose, modes, currentModeId, onSelect }) {
  const { theme } = useTheme();

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="CAMBIAR CATÁLOGO AHORA">
      <View style={styles.list}>
        {(modes || []).map(mode => {
          const isActive = mode.id === currentModeId;
          const color = mode.color || theme.accent;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[styles.row, { borderColor: theme.cardBorder }, isActive && { opacity: 0.5 }]}
              onPress={() => { if (!isActive) { onSelect(mode.id); onClose(); } }}
              activeOpacity={isActive ? 1 : 0.7}
            >
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              <Text style={[styles.name, { color: theme.text }]}>{mode.name}</Text>
              <View style={styles.badges}>
                {mode.isDefault && (
                  <View style={[styles.badge, { backgroundColor: theme.accent + '15' }]}>
                    <Text style={[styles.badgeText, { color: theme.accent }]}>PRINCIPAL</Text>
                  </View>
                )}
                {isActive && (
                  <View style={[styles.badge, { backgroundColor: theme.success + '20' }]}>
                    <Text style={[styles.badgeText, { color: theme.success }]}>ACTIVO</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 20 }} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  colorBar: { width: 4, height: 28, borderRadius: 2 },
  name: { flex: 1, fontSize: 15, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});
