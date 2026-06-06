import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import CenterModal from './CenterModal';
import { getConflictDescription } from '../utils/conflictHelpers';

export default function EmployeeConflictModal({
  visible, onClose, conflict, modes, workers, currentModeId, onResolve,
}) {
  const { theme } = useTheme();

  if (!conflict) return null;

  const desc = getConflictDescription(conflict, modes, workers);
  const otherModeId = conflict.modeIdA === currentModeId ? conflict.modeIdB : conflict.modeIdA;
  const currentModeName = (modes || []).find(m => m.id === currentModeId)?.name || 'este catálogo';
  const otherModeName = (modes || []).find(m => m.id === otherModeId)?.name || 'otro catálogo';

  return (
    <CenterModal visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.danger + '20' }]}>
          <Feather name="alert-circle" size={24} color={theme.danger} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {desc.workerName.toUpperCase()} YA TIENE HORARIO
        </Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          {desc.workerName} ya está asignada a "{otherModeName}" el {desc.dayLabel} de {desc.timeRange}. No puede estar en dos catálogos al mismo tiempo. ¿Qué querés hacer?
        </Text>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.accent }]}
          onPress={() => onResolve('remove-from-new')}
        >
          <Text style={[styles.btnText, { color: theme.accentText }]}>QUITAR DE "{currentModeName}"</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { borderWidth: 1, borderColor: theme.cardBorder }]}
          onPress={() => onResolve('remove-from-existing')}
        >
          <Text style={[styles.btnText, { color: theme.text }]}>QUITAR DE "{otherModeName}"</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => onResolve('cancel')}>
          <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center' },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 14, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  btn: { width: '100%', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  btnText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
