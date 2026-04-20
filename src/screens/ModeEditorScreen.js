import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image,
  KeyboardAvoidingView, Platform, Animated, PanResponder, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ScreenHeader from '../components/ScreenHeader';
import ThemedTextInput from '../components/ThemedTextInput';
import PrimaryButton from '../components/PrimaryButton';
import CenterModal from '../components/CenterModal';
import CalendarPicker from '../components/CalendarPicker';
import TimeWheelPicker from '../components/TimeWheelPicker';
import { validateModeForm, buildOverridesPatch, reorderTabOrder } from '../utils/modeManagement';
import { appendScheduledActivation, removeScheduledActivation, isScheduleValid } from '../utils/modeScheduling';
import { formatDateTimeReadable } from '../utils/formatters';

function SwipeRow({ isActive, onToggle, children, theme }) {
  const pan = useRef(new Animated.Value(0)).current;
  const activeRef = useRef(isActive);
  const toggleRef = useRef(onToggle);
  useEffect(() => { activeRef.current = isActive; }, [isActive]);
  useEffect(() => { toggleRef.current = onToggle; }, [onToggle]);

  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderMove: (_, g) => pan.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (g.dx > 60 && !activeRef.current) { toggleRef.current(); }
      else if (g.dx < -60 && activeRef.current) { toggleRef.current(); }
      Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  return (
    <View style={{ overflow: 'hidden', borderBottomWidth: 1, borderColor: theme.cardBorder }}>
      <View style={[styles.swipeBg, { backgroundColor: isActive ? '#FF3B3022' : '#30D15822' }]}>
        <Text style={[styles.swipeBgText, { color: isActive ? '#FF3B30' : '#30D158' }]}>
          {isActive ? 'Desactivar' : 'Activar'}
        </Text>
      </View>
      <Animated.View {...responder.panHandlers} style={[styles.productRow, { transform: [{ translateX: pan }], backgroundColor: theme.bg }]}>
        {children}
      </Animated.View>
    </View>
  );
}

export default function ModeEditorScreen({ route, navigation }) {
  const { modeId } = route.params;
  const { modes, products, updateMode, showSnack } = useApp();
  const { workers } = useAuth();
  const { tabs } = useTab();
  const { theme } = useTheme();

  const mode = modes.find(m => m.id === modeId);
  const [name, setName] = useState(mode?.name || '');
  const [desc, setDesc] = useState(mode?.description || '');
  const [overrides, setOverrides] = useState(mode?.productOverrides || {});
  const [tabOrd, setTabOrd] = useState(mode?.tabOrder || []);
  const [assignedIds, setAssignedIds] = useState(mode?.assignedWorkerIds || []);
  const [nameError, setNameError] = useState('');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const initPriceInputs = {};
  products.forEach(p => {
    const ov = (mode?.productOverrides || {})[p.id];
    initPriceInputs[p.id] = ov?.priceOverride != null ? String(ov.priceOverride) : '';
  });
  const [priceInputs, setPriceInputs] = useState(initPriceInputs);

  const [showSchedule, setShowSchedule] = useState(false);
  const [schedStart, setSchedStart] = useState(null);
  const [schedEnd, setSchedEnd] = useState(null);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [startTime, setStartTime] = useState({ hours: 8, minutes: 0 });
  const [endTime, setEndTime] = useState({ hours: 18, minutes: 0 });
  const [schedError, setSchedError] = useState('');

  if (!mode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="EDITOR" onBack={() => navigation.goBack()} />
        <Text style={[styles.notFound, { color: theme.textMuted }]}>Catálogo no encontrado</Text>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const { ok, error } = validateModeForm({ name, existingModes: modes, editingId: modeId });
    if (!ok) { setNameError(error); return; }
    const finalOverrides = { ...overrides };
    for (const [pid, raw] of Object.entries(priceInputs)) {
      if (finalOverrides[pid]) {
        const num = raw === '' ? null : parseFloat(raw);
        finalOverrides[pid] = { ...finalOverrides[pid], priceOverride: (num != null && !isNaN(num)) ? num : null };
      }
    }
    await updateMode(modeId, {
      name: name.trim(), description: desc.trim(),
      productOverrides: finalOverrides, tabOrder: tabOrd,
      assignedWorkerIds: assignedIds,
    });
    showSnack({ message: 'Cambios guardados' });
    navigation.goBack();
  };

  const toggleProduct = (pid) => {
    const cur = overrides[pid] || { active: true, priceOverride: null };
    setOverrides(buildOverridesPatch({ currentOverrides: overrides, productId: pid, patch: { active: !cur.active } }));
  };

  const toggleWorker = (wid) => {
    setAssignedIds(prev => prev.includes(wid) ? prev.filter(id => id !== wid) : [...prev, wid]);
  };

  const toggleExpand = (pid) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedProduct(prev => prev === pid ? null : pid);
  };

  const moveTab = (from, to) => {
    if (to < 0 || to >= tabOrd.length) return;
    setTabOrd(reorderTabOrder(tabOrd, from, to));
  };

  const buildIso = (date, time, useTime) => {
    if (!date) return null;
    const h = useTime ? time.hours : 0;
    const m = useTime ? time.minutes : 0;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).toISOString();
  };

  const handleAddSchedule = async () => {
    const startsAt = buildIso(schedStart, startTime, showStartTime);
    const endsAt = schedEnd ? buildIso(schedEnd, endTime, showEndTime) : null;
    if (!startsAt || !isScheduleValid({ startsAt, endsAt })) { setSchedError('Fecha inválida'); return; }
    const updated = appendScheduledActivation(mode, { startsAt, endsAt, previousModeId: null });
    await updateMode(modeId, { scheduledActivations: updated.scheduledActivations });
    setShowSchedule(false); setSchedError(''); setSchedStart(null); setSchedEnd(null);
    setShowStartTime(false); setShowEndTime(false);
  };

  const handleRemoveSchedule = async (entryId) => {
    const updated = removeScheduledActivation(mode, entryId);
    await updateMode(modeId, { scheduledActivations: updated.scheduledActivations });
  };

  const tabsLookup = {};
  tabs.forEach(t => { tabsLookup[t.id] = t; });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={`EDITAR: ${mode.name}`} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <ThemedTextInput label="NOMBRE" value={name} onChangeText={v => { setName(v); setNameError(''); }} placeholder="Nombre del catálogo" error={nameError} />
          <ThemedTextInput label="DESCRIPCIÓN" value={desc} onChangeText={setDesc} placeholder="Opcional" />

          <Text style={[styles.section, { color: theme.textMuted }]}>PRODUCTOS</Text>
          {products.map(p => {
            const ov = overrides[p.id] || { active: true, priceOverride: null };
            const singleSize = p.sizes?.length === 1;
            const isExp = expandedProduct === p.id;
            return (
              <SwipeRow key={p.id} isActive={ov.active} onToggle={() => toggleProduct(p.id)} theme={theme}>
                <View style={[styles.statusDot, { backgroundColor: ov.active ? '#30D158' : '#D1D1D6' }]} />
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => toggleExpand(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                    <Feather name={isExp ? 'chevron-up' : 'chevron-down'} size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                  {isExp && (
                    <View style={{ marginTop: 8, gap: 4 }}>
                      {singleSize && ov.active && (
                        <ThemedTextInput value={priceInputs[p.id] || ''} onChangeText={v => setPriceInputs(prev => ({ ...prev, [p.id]: v }))}
                          placeholder={`Base: $${p.sizes[0]?.price?.toFixed(2) || '0.00'}`} keyboardType="decimal-pad" />
                      )}
                      {!singleSize && <Text style={[styles.multiSize, { color: theme.textMuted }]}>Múltiples precios — sin override</Text>}
                      {(p.ingredients || p.flavors || []).length > 0 && (
                        <View style={{ marginTop: 4 }}>
                          <Text style={[styles.detailLabel, { color: theme.textMuted }]}>INGREDIENTES</Text>
                          {(p.ingredients || p.flavors || []).map((ing, idx) => (
                            <Text key={idx} style={[styles.detailItem, { color: theme.textSecondary }]}>• {ing.name || ing}</Text>
                          ))}
                        </View>
                      )}
                      {(p.extras || p.toppings || []).length > 0 && (
                        <View style={{ marginTop: 4 }}>
                          <Text style={[styles.detailLabel, { color: theme.textMuted }]}>EXTRAS</Text>
                          {(p.extras || p.toppings || []).map((ex, idx) => (
                            <Text key={idx} style={[styles.detailItem, { color: theme.textSecondary }]}>• {ex.name || ex}{ex.price ? ` +$${ex.price.toFixed(2)}` : ''}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </SwipeRow>
            );
          })}

          <Text style={[styles.section, { color: theme.textMuted }]}>EMPLEADOS</Text>
          {workers.map(w => {
            const assigned = assignedIds.includes(w.id);
            return (
              <SwipeRow key={w.id} isActive={assigned} onToggle={() => toggleWorker(w.id)} theme={theme}>
                <View style={[styles.statusDot, { backgroundColor: assigned ? '#30D158' : '#D1D1D6' }]} />
                {w.photo ? <Image source={{ uri: w.photo }} style={styles.workerBubble} />
                  : <View style={[styles.workerBubble, { backgroundColor: w.color || theme.accent, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={styles.workerInitial}>{w.name?.charAt(0)?.toUpperCase()}</Text>
                    </View>}
                <Text style={[styles.workerName, { color: theme.text }]}>{w.name}</Text>
              </SwipeRow>
            );
          })}

          <Text style={[styles.section, { color: theme.textMuted }]}>ORDEN DE PESTAÑAS</Text>
          {tabOrd.map((tId, i) => {
            const tab = tabsLookup[tId]; if (!tab) return null;
            return (
              <View key={tId} style={[styles.tabRow, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.tabName, { color: theme.text }]}>{tab.name}</Text>
                <View style={styles.tabBtns}>
                  <TouchableOpacity onPress={() => moveTab(i, i - 1)} disabled={i === 0}><Feather name="chevron-up" size={20} color={i === 0 ? theme.cardBorder : theme.text} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => moveTab(i, i + 1)} disabled={i === tabOrd.length - 1}><Feather name="chevron-down" size={20} color={i === tabOrd.length - 1 ? theme.cardBorder : theme.text} /></TouchableOpacity>
                </View>
              </View>
            );
          })}

          <Text style={[styles.section, { color: theme.textMuted }]}>ACTIVACIONES PROGRAMADAS</Text>
          {(mode.scheduledActivations || []).map(entry => (
            <View key={entry.id} style={[styles.schedRow, { borderColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.schedDate, { color: theme.text }]}>Desde: {formatDateTimeReadable(entry.startsAt)}</Text>
                {entry.endsAt && <Text style={[styles.schedDate, { color: theme.textMuted }]}>Hasta: {formatDateTimeReadable(entry.endsAt)}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleRemoveSchedule(entry.id)}><Feather name="trash-2" size={16} color={theme.danger} /></TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={[styles.schedAddBtn, { borderColor: theme.cardBorder }]} onPress={() => setShowSchedule(true)}>
            <Feather name="clock" size={14} color={theme.textMuted} />
            <Text style={[styles.schedAddText, { color: theme.textMuted }]}>Programar activación</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
          <PrimaryButton label="GUARDAR CAMBIOS" onPress={handleSave} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CenterModal visible={showSchedule} onClose={() => { setShowSchedule(false); setSchedError(''); }} title="PROGRAMAR ACTIVACIÓN">
        <CalendarPicker startDate={schedStart} endDate={schedEnd} onSelectStart={setSchedStart} onSelectEnd={setSchedEnd} />
        {schedStart && (
          <Text style={[styles.schedSummary, { color: theme.textMuted }]}>
            Inicio: {schedStart.getDate()}/{schedStart.getMonth() + 1}/{schedStart.getFullYear()}
            {schedEnd ? ` → Fin: ${schedEnd.getDate()}/${schedEnd.getMonth() + 1}/${schedEnd.getFullYear()}` : ' (día completo)'}
          </Text>
        )}
        {!showStartTime ? (
          <TouchableOpacity onPress={() => setShowStartTime(true)} style={styles.timeToggle}>
            <Feather name="clock" size={14} color={theme.textMuted} />
            <Text style={[styles.timeToggleText, { color: theme.textMuted }]}>Agregar hora de inicio</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>HORA DE INICIO</Text>
            <TimeWheelPicker value={startTime} onChange={setStartTime} />
          </View>
        )}
        {schedEnd && !showEndTime ? (
          <TouchableOpacity onPress={() => setShowEndTime(true)} style={styles.timeToggle}>
            <Feather name="clock" size={14} color={theme.textMuted} />
            <Text style={[styles.timeToggleText, { color: theme.textMuted }]}>Agregar hora de fin</Text>
          </TouchableOpacity>
        ) : schedEnd && showEndTime ? (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>HORA DE FIN</Text>
            <TimeWheelPicker value={endTime} onChange={setEndTime} />
          </View>
        ) : null}
        {schedError ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>{schedError}</Text> : null}
        <View style={{ marginTop: 16 }}><PrimaryButton label="PROGRAMAR" onPress={handleAddSchedule} /></View>
      </CenterModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  notFound: { textAlign: 'center', marginTop: 60, fontSize: 15, fontWeight: '600' },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  productName: { fontSize: 15, fontWeight: '700' },
  multiSize: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  swipeBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 20 },
  swipeBgText: { fontSize: 13, fontWeight: '700' },
  detailLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  detailItem: { fontSize: 12, fontWeight: '500', paddingLeft: 4 },
  workerBubble: { width: 28, height: 28, borderRadius: 14 },
  workerInitial: { color: '#fff', fontSize: 12, fontWeight: '900' },
  workerName: { fontSize: 14, fontWeight: '700', flex: 1 },
  tabRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  tabName: { flex: 1, fontSize: 14, fontWeight: '700' },
  tabBtns: { flexDirection: 'row', gap: 8 },
  schedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  schedDate: { fontSize: 12, fontWeight: '600' },
  schedAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderStyle: 'dashed', marginTop: 8 },
  schedAddText: { fontSize: 13, fontWeight: '700' },
  schedSummary: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  timeToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginTop: 4 },
  timeToggleText: { fontSize: 13, fontWeight: '600' },
});
