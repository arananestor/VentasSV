import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import CenterModal from '../components/CenterModal';
import ThemedTextInput from '../components/ThemedTextInput';
import PrimaryButton from '../components/PrimaryButton';
import RequiresQentas from '../components/RequiresQentas';
import UpsellCard from '../components/UpsellCard';
import { canManageModesLocally, validateModeForm } from '../utils/modeManagement';

export default function ManageModesScreen({ navigation }) {
  const { modes, currentModeId, setCurrentMode, createModeFromForm, deleteMode, cloneMode, showSnack } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);

  if (!canManageModesLocally(currentWorker)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="GESTIÓN DE MODOS" onBack={() => navigation.goBack()} />
        <View style={styles.denied}>
          <Feather name="lock" size={32} color={theme.textMuted} />
          <Text style={[styles.deniedText, { color: theme.textMuted }]}>Solo el dueño puede gestionar Modos</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.deniedBtn, { borderColor: theme.cardBorder }]}>
            <Text style={[styles.deniedBtnText, { color: theme.text }]}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCreate = async () => {
    const { ok, error } = validateModeForm({ name: newName, existingModes: modes });
    if (!ok) { setCreateError(error); return; }
    await createModeFromForm({ name: newName.trim(), description: newDesc.trim() });
    setShowCreate(false); setNewName(''); setNewDesc(''); setCreateError('');
    showSnack({ total: 0, sales: [] });
  };

  const handleActivate = async (modeId) => {
    await setCurrentMode(modeId);
    setShowConfirm(null);
  };

  const handleDelete = async (modeId) => {
    try {
      await deleteMode(modeId);
      setShowConfirm(null);
    } catch (e) {
      setShowConfirm(null);
    }
  };

  const handleClone = async (modeId) => {
    const source = modes.find(m => m.id === modeId);
    if (!source) return;
    await cloneMode(modeId, `${source.name} (copia)`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="GESTIÓN DE MODOS" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {modes.map(mode => {
          const isActive = mode.id === currentModeId;
          const activeCount = Object.values(mode.productOverrides || {}).filter(o => o.active).length;
          return (
            <View key={mode.id} style={[styles.card, { backgroundColor: theme.card, borderColor: isActive ? theme.accent : theme.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: theme.text }]}>{mode.name}</Text>
                  <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
                    {activeCount} productos activos
                  </Text>
                </View>
                <View style={styles.badges}>
                  {isActive && (
                    <View style={[styles.badge, { backgroundColor: theme.success + '22', borderColor: theme.success }]}>
                      <Text style={[styles.badgeText, { color: theme.success }]}>Activo</Text>
                    </View>
                  )}
                  {mode.isDefault && (
                    <View style={[styles.badge, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                      <Text style={[styles.badgeText, { color: theme.accent }]}>Default</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                {!isActive && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.success }]}
                    onPress={() => setShowConfirm({ type: 'activate', modeId: mode.id, name: mode.name })}
                  >
                    <Text style={[styles.actionText, { color: theme.success }]}>Activar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: theme.cardBorder }]}
                  onPress={() => navigation.navigate('ModeEditor', { modeId: mode.id })}
                >
                  <Text style={[styles.actionText, { color: theme.text }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: theme.cardBorder }]}
                  onPress={() => handleClone(mode.id)}
                >
                  <Text style={[styles.actionText, { color: theme.text }]}>Clonar</Text>
                </TouchableOpacity>
                {!mode.isDefault && !isActive && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.danger }]}
                    onPress={() => setShowConfirm({ type: 'delete', modeId: mode.id, name: mode.name })}
                  >
                    <Text style={[styles.actionText, { color: theme.danger }]}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.createBtn, { borderColor: theme.cardBorder }]}
          onPress={() => setShowCreate(true)}
        >
          <Feather name="plus" size={18} color={theme.textMuted} />
          <Text style={[styles.createBtnText, { color: theme.textMuted }]}>Crear nuevo Modo</Text>
        </TouchableOpacity>

        <View style={styles.upsellSection}>
          <RequiresQentas fallback={
            <View style={{ gap: 12 }}>
              <UpsellCard title="Control remoto de Modos" description="Cambiá el Modo activo del cajero desde tu celular" />
              <UpsellCard title="Programación server-side" description="Los cambios programados corren sin que la app esté abierta" />
              <UpsellCard title="Delegación a Encargado" description="Permití que un co-admin cambie el Modo en tiempo real" />
              <UpsellCard title="Panel de Modos por dispositivo" description="Visibilidad de qué Modo corre cada cajero" />
            </View>
          }>
            <Text style={[styles.comingSoon, { color: theme.textMuted }]}>Próximamente</Text>
          </RequiresQentas>
        </View>
      </ScrollView>

      <CenterModal visible={showCreate} onClose={() => { setShowCreate(false); setCreateError(''); }} title="NUEVO MODO">
        <ThemedTextInput label="NOMBRE" value={newName} onChangeText={setNewName} placeholder="Ej: Festival del mango" autoFocus error={createError} />
        <ThemedTextInput label="DESCRIPCIÓN" value={newDesc} onChangeText={setNewDesc} placeholder="Opcional" />
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="CREAR" onPress={handleCreate} />
        </View>
      </CenterModal>

      <CenterModal
        visible={!!showConfirm}
        onClose={() => setShowConfirm(null)}
        title={showConfirm?.type === 'activate' ? 'ACTIVAR MODO' : 'ELIMINAR MODO'}
      >
        <Text style={[styles.confirmText, { color: theme.textMuted }]}>
          {showConfirm?.type === 'activate'
            ? `¿Activar "${showConfirm?.name}" en este dispositivo?`
            : `¿Eliminar "${showConfirm?.name}"? Esta acción no se puede deshacer.`
          }
        </Text>
        <View style={{ marginTop: 16 }}>
          <PrimaryButton
            label={showConfirm?.type === 'activate' ? 'ACTIVAR' : 'ELIMINAR'}
            variant={showConfirm?.type === 'delete' ? 'danger' : 'primary'}
            onPress={() => showConfirm?.type === 'activate'
              ? handleActivate(showConfirm.modeId)
              : handleDelete(showConfirm.modeId)
            }
          />
        </View>
      </CenterModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  deniedText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  deniedBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1 },
  deniedBtnText: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardName: { fontSize: 16, fontWeight: '800' },
  cardMeta: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '700' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderStyle: 'dashed', marginTop: 8,
  },
  createBtnText: { fontSize: 14, fontWeight: '700' },
  upsellSection: { marginTop: 24 },
  comingSoon: { fontSize: 14, fontWeight: '600', textAlign: 'center', padding: 20 },
  confirmText: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
});
