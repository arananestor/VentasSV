import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView, StyleSheet, Image, Animated, PanResponder } from 'react-native';
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
import useCan from '../hooks/useCan';
import useResponsive from '../hooks/useResponsive';

function SwipeableCatalogCard({ children, canSwipe, canDelete, onSwipeRight, onSwipeLeft, onLongPress, onTap, screenWidth, theme }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwiping = useRef(false);
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);
  const threshold = screenWidth * 0.6;

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => canSwipe && Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderGrant: () => {
      isSwiping.current = true;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    },
    onPanResponderMove: (_, gs) => {
      if (!isSwiping.current) return;
      let dx = gs.dx;
      if (dx < 0 && !canDelete) dx = 0;
      translateX.setValue(dx);
    },
    onPanResponderRelease: (_, gs) => {
      isSwiping.current = false;
      if (gs.dx > threshold && onSwipeRight) {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start(() => {
          onSwipeRight();
        });
      } else if (gs.dx < -threshold && canDelete && onSwipeLeft) {
        Animated.timing(translateX, { toValue: -screenWidth, duration: 200, useNativeDriver: true }).start(() => {
          translateX.setValue(0);
          onSwipeLeft();
        });
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
        // Small movement that PanResponder captured — treat as tap if no long press
        if (Math.abs(gs.dx) < 30 && !didLongPress.current && onTap) {
          onTap();
        }
      }
    },
  })).current;

  const handlePressIn = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (onLongPress) onLongPress();
    }, 700);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTap = () => {
    if (!didLongPress.current && !isSwiping.current && onTap) onTap();
  };

  const revealRightOpacity = translateX.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const revealLeftOpacity = translateX.interpolate({
    inputRange: [-threshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.swipeContainer}>
      {/* Reveal backgrounds */}
      <Animated.View style={[styles.revealBg, styles.revealRight, { backgroundColor: '#2B9348', opacity: revealRightOpacity }]}>
        <Feather name="copy" size={22} color="#fff" />
      </Animated.View>
      {canDelete && (
        <Animated.View style={[styles.revealBg, styles.revealLeft, { backgroundColor: '#D62828', opacity: revealLeftOpacity }]}>
          <Feather name="trash-2" size={22} color="#fff" />
        </Animated.View>
      )}
      {/* Card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...pan.panHandlers}
      >
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleTap}
        >
          <View>{children}</View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </View>
  );
}

export default function ManageModesScreen({ navigation }) {
  const { modes, currentModeId, createModeFromForm, deleteMode, cloneMode, setCurrentMode, showNotif } = useApp();
  const { currentWorker, workers } = useAuth();
  const { theme } = useTheme();
  const canEdit = useCan('edit-catalogs');
  const { width: screenWidth } = useResponsive();

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
    await cloneMode(modeId, `Copia de ${source.name}`);
    showNotif(`Catálogo duplicado como Copia de ${source.name}`);
  };

  const handleActivate = async (modeId) => {
    if (currentModeId === modeId) {
      showNotif('Este catálogo ya está activo');
      return;
    }
    await setCurrentMode(modeId);
    const m = modes.find(mm => mm.id === modeId);
    showNotif(`Catálogo ${m?.name || ''} activo ahora`);
    setShowConfirm(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="CATÁLOGOS" onBack={() => navigation.goBack()} />

      {!canEdit && (
        <View style={[styles.consultaBadge, { backgroundColor: theme.bg }]}>
          <Text style={[styles.consultaText, { color: theme.textMuted }]}>CONSULTA</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {modes.map(mode => {
          const isActive = mode.id === currentModeId;
          const activeCount = Object.values(mode.productOverrides || {}).filter(o => o.active).length;
          return (
            <SwipeableCatalogCard
              key={mode.id}
              canSwipe={canEdit}
              canDelete={!mode.isDefault && !isActive}
              onSwipeRight={() => handleClone(mode.id)}
              onSwipeLeft={() => setShowConfirm({ type: 'delete', modeId: mode.id, name: mode.name })}
              onLongPress={() => {
                if (canEdit) {
                  if (isActive) { showNotif('Este catálogo ya está activo'); }
                  else { setShowConfirm({ type: 'activate', modeId: mode.id, name: mode.name }); }
                }
              }}
              onTap={() => navigation.navigate('CatalogDetail', { modeId: mode.id })}
              screenWidth={screenWidth}
              theme={theme}
            >
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardName, { color: theme.text }]}>{mode.name}</Text>
                    <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
                      {activeCount} productos activos
                    </Text>
                  </View>
                  <View style={styles.badges}>
                    {mode.isDefault && (
                      <View style={[styles.badge, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                        <Text style={[styles.badgeText, { color: theme.accent }]}>Principal</Text>
                      </View>
                    )}
                    {isActive && (
                      <View style={[styles.badge, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
                        <Text style={[styles.badgeText, { color: theme.success }]}>Activo</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.workerRow}>
                  {(mode.assignedWorkerIds || []).map(wId => {
                    const w = workers.find(wr => wr.id === wId);
                    if (!w) return null;
                    return w.photo ? (
                      <Image key={w.id} source={{ uri: w.photo }} style={styles.workerBubble} />
                    ) : (
                      <View key={w.id} style={[styles.workerBubble, { backgroundColor: w.role === 'owner' ? theme.accent : (w.color || '#1C1C1E'), alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={[styles.workerInitial, { color: w.role === 'owner' ? theme.accentText : '#fff' }]}>{w.name?.charAt(0)?.toUpperCase()}</Text>
                      </View>
                    );
                  })}
                  {(mode.assignedWorkerIds || []).length === 0 && (
                    <Text style={[styles.unassigned, { color: theme.textMuted }]}>Tocá para ver detalles</Text>
                  )}
                </View>
              </View>
            </SwipeableCatalogCard>
          );
        })}

        {canEdit && (
          <TouchableOpacity
            style={[styles.createBtn, { borderColor: theme.cardBorder }]}
            onPress={() => setShowCreate(true)}
          >
            <Feather name="plus" size={18} color={theme.textMuted} />
            <Text style={[styles.createBtnText, { color: theme.textMuted }]}>Crear nuevo catálogo</Text>
          </TouchableOpacity>
        )}

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
        <ThemedTextInput label="NOMBRE" value={newName} onChangeText={setNewName} placeholder="Ej: Festival del mango" autoFocus selectTextOnFocus error={createError} />
        <ThemedTextInput label="DESCRIPCIÓN" value={newDesc} onChangeText={setNewDesc} placeholder="Opcional" />
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="CREAR" onPress={handleCreate} />
        </View>
      </CenterModal>

      <CenterModal
        visible={showConfirm?.type === 'delete'}
        onClose={() => setShowConfirm(null)}
        title="ELIMINAR CATÁLOGO"
      >
        <Text style={[styles.confirmText, { color: theme.textMuted }]}>
          ¿Eliminar "{showConfirm?.name}"? Esta acción no se puede deshacer.
        </Text>
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="ELIMINAR" variant="danger" onPress={() => handleDelete(showConfirm?.modeId)} />
        </View>
      </CenterModal>

      <CenterModal
        visible={showConfirm?.type === 'activate'}
        onClose={() => setShowConfirm(null)}
        title="ACTIVAR AHORA"
      >
        <Text style={[styles.confirmText, { color: theme.textMuted }]}>
          ¿Activar "{showConfirm?.name}" como catálogo activo ahora?
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }} onPress={() => setShowConfirm(null)}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textMuted }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: theme.accent }} onPress={() => handleActivate(showConfirm?.modeId)}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.accentText }}>ACTIVAR</Text>
          </TouchableOpacity>
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
  swipeContainer: { position: 'relative', marginBottom: 10, overflow: 'hidden', borderRadius: 16 },
  revealBg: { position: 'absolute', top: 0, bottom: 0, width: '100%', alignItems: 'center', justifyContent: 'center' },
  revealRight: { left: 0, alignItems: 'flex-start', paddingLeft: 24 },
  revealLeft: { right: 0, alignItems: 'flex-end', paddingRight: 24 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
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
  consultaBadge: { alignSelf: 'flex-start', marginLeft: 16, marginBottom: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  consultaText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
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
