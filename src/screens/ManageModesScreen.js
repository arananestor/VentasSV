import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Animated } from 'react-native';
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
import { canManageModesLocally, validateModeForm } from '../utils/modeManagement';

function ActionPill({ label, color, bgColor, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: bgColor, borderColor: color }]}
        onPress={handlePress} activeOpacity={0.8}
      >
        <Text style={[styles.actionText, { color }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ManageModesScreen({ navigation }) {
  const { modes, currentModeId, createModeFromForm, deleteMode, cloneMode, showNotif } = useApp();
  const { currentWorker, workers } = useAuth();
  const { theme } = useTheme();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);

  if (!canManageModesLocally(currentWorker)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="CATÁLOGOS" onBack={() => navigation.goBack()} />
        <View style={styles.denied}>
          <Feather name="lock" size={32} color={theme.textMuted} />
          <Text style={[styles.deniedText, { color: theme.textMuted }]}>Solo el dueño puede gestionar catálogos</Text>
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
    const created = await createModeFromForm({ name: newName.trim(), description: newDesc.trim() });
    setShowCreate(false); setNewName(''); setNewDesc(''); setCreateError('');
    showNotif(`Catálogo '${created.name}' creado`);
  };

  const handleDelete = async (modeId) => {
    try {
      await deleteMode(modeId);
      setShowConfirm(null);
      showNotif('Catálogo eliminado');
    } catch (e) {
      setShowConfirm(null);
    }
  };

  const handleClone = async (modeId) => {
    const source = modes.find(m => m.id === modeId);
    if (!source) return;
    const { generateCatalogName } = require('../utils/funNames');
    await cloneMode(modeId, generateCatalogName());
    showNotif('Catálogo clonado');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="CATÁLOGOS" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {modes.map(mode => {
          const isActive = mode.id === currentModeId;
          const activeCount = Object.values(mode.productOverrides || {}).filter(o => o.active).length;
          return (
            <View key={mode.id} style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              isActive && { borderLeftWidth: 4, borderLeftColor: theme.success },
            ]}>
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

              {/* Worker bubbles */}
              <View style={styles.workerRow}>
                {(mode.assignedWorkerIds || []).map(wId => {
                  const w = workers.find(wr => wr.id === wId);
                  if (!w) return null;
                  return w.photo ? (
                    <Image key={w.id} source={{ uri: w.photo }} style={styles.workerBubble} />
                  ) : (
                    <View key={w.id} style={[styles.workerBubble, { backgroundColor: w.color || theme.accent, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={styles.workerInitial}>{w.name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                  );
                })}
                {(mode.assignedWorkerIds || []).length === 0 && (
                  <Text style={[styles.unassigned, { color: theme.textMuted }]}>Toca Editar para asignar empleados</Text>
                )}
              </View>

              <View style={styles.cardActions}>
                <ActionPill label="Editar" color={theme.text} bgColor={theme.card} onPress={() => navigation.navigate('ModeEditor', { modeId: mode.id })} />
                <ActionPill label="Clonar" color={theme.text} bgColor={theme.card} onPress={() => handleClone(mode.id)} />
                {!mode.isDefault && !isActive && (
                  <ActionPill label="Eliminar" color={theme.danger} bgColor={theme.danger + '12'} onPress={() => setShowConfirm({ type: 'delete', modeId: mode.id, name: mode.name })} />
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
          <Text style={[styles.createBtnText, { color: theme.textMuted }]}>Crear nuevo catálogo</Text>
        </TouchableOpacity>

        <RequiresQentas fallback={
          <View style={styles.tipsSection}>
            <Text style={[styles.tipsTitle, { color: theme.textMuted }]}>PRÓXIMAMENTE CON QENTAS</Text>
            {[
              { icon: 'smartphone', text: 'Cambiá el catálogo activo desde tu celular' },
              { icon: 'clock', text: 'Cambios programados corren sin la app abierta' },
              { icon: 'users', text: 'Delegá el control a un Encargado en tiempo real' },
              { icon: 'monitor', text: 'Visibilidad de qué catálogo corre cada cajero' },
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Feather name={tip.icon} size={14} color={theme.textMuted} />
                <Text style={[styles.tipText, { color: theme.textMuted }]}>{tip.text}</Text>
              </View>
            ))}
          </View>
        }>
          <Text style={[styles.comingSoon, { color: theme.textMuted }]}>Próximamente</Text>
        </RequiresQentas>
      </ScrollView>

      <CenterModal visible={showCreate} onClose={() => { setShowCreate(false); setCreateError(''); }} title="NUEVO CATÁLOGO">
        <ThemedTextInput label="NOMBRE" value={newName} onChangeText={setNewName} placeholder="Ej: Festival del mango" autoFocus error={createError} />
        <ThemedTextInput label="DESCRIPCIÓN" value={newDesc} onChangeText={setNewDesc} placeholder="Opcional" />
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="CREAR" onPress={handleCreate} />
        </View>
      </CenterModal>

      <CenterModal
        visible={!!showConfirm}
        onClose={() => setShowConfirm(null)}
        title="ELIMINAR CATÁLOGO"
      >
        <Text style={[styles.confirmText, { color: theme.textMuted }]}>
          ¿Eliminar "{showConfirm?.name}"? Esta acción no se puede deshacer.
        </Text>
        <View style={{ marginTop: 16 }}>
          <PrimaryButton
            label="ELIMINAR"
            variant="danger"
            onPress={() => handleDelete(showConfirm?.modeId)}
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
  workerRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  workerBubble: { width: 28, height: 28, borderRadius: 14 },
  workerInitial: { color: '#fff', fontSize: 12, fontWeight: '900' },
  unassigned: { fontSize: 11, fontWeight: '500', fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  actionBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '700' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderStyle: 'dashed', marginTop: 8,
  },
  createBtnText: { fontSize: 14, fontWeight: '700' },
  tipsSection: { marginTop: 24, gap: 8 },
  tipsTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { fontSize: 12, fontWeight: '500', flex: 1 },
  comingSoon: { fontSize: 14, fontWeight: '600', textAlign: 'center', padding: 20 },
  confirmText: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
});
