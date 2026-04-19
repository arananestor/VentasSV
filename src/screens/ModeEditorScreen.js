import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ScreenHeader from '../components/ScreenHeader';
import ThemedTextInput from '../components/ThemedTextInput';
import PrimaryButton from '../components/PrimaryButton';
import CenterModal from '../components/CenterModal';
import { validateModeForm, buildOverridesPatch, reorderTabOrder } from '../utils/modeManagement';
import { appendScheduledActivation, removeScheduledActivation, isScheduleValid } from '../utils/modeScheduling';

export default function ModeEditorScreen({ route, navigation }) {
  const { modeId } = route.params;
  const { modes, products, updateMode, showSnack } = useApp();
  const { tabs } = useTab();
  const { theme } = useTheme();

  const mode = modes.find(m => m.id === modeId);
  const [name, setName] = useState(mode?.name || '');
  const [desc, setDesc] = useState(mode?.description || '');
  const [overrides, setOverrides] = useState(mode?.productOverrides || {});
  const [tabOrd, setTabOrd] = useState(mode?.tabOrder || []);
  const [nameError, setNameError] = useState('');
  const initPriceInputs = {};
  products.forEach(p => {
    const ov = (mode?.productOverrides || {})[p.id];
    initPriceInputs[p.id] = ov?.priceOverride != null ? String(ov.priceOverride) : '';
  });
  const [priceInputs, setPriceInputs] = useState(initPriceInputs);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedStartsAt, setSchedStartsAt] = useState('');
  const [schedEndsAt, setSchedEndsAt] = useState('');
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
    // Parse raw price inputs into overrides
    const finalOverrides = { ...overrides };
    for (const [pid, raw] of Object.entries(priceInputs)) {
      if (finalOverrides[pid]) {
        const num = raw === '' ? null : parseFloat(raw);
        finalOverrides[pid] = { ...finalOverrides[pid], priceOverride: (num != null && !isNaN(num)) ? num : null };
      }
    }
    await updateMode(modeId, { name: name.trim(), description: desc.trim(), productOverrides: finalOverrides, tabOrder: tabOrd });
    showSnack({ message: 'Cambios guardados' });
    navigation.goBack();
  };

  const toggleProduct = (productId) => {
    const current = overrides[productId] || { active: true, priceOverride: null };
    setOverrides(buildOverridesPatch({ currentOverrides: overrides, productId, patch: { active: !current.active } }));
  };

  const setPriceOverride = (productId, value) => {
    setPriceInputs(prev => ({ ...prev, [productId]: value }));
  };

  const moveTab = (from, to) => {
    if (to < 0 || to >= tabOrd.length) return;
    setTabOrd(reorderTabOrder(tabOrd, from, to));
  };

  const handleAddSchedule = async () => {
    if (!isScheduleValid({ startsAt: schedStartsAt, endsAt: schedEndsAt || null })) {
      setSchedError('Fecha inválida'); return;
    }
    const updated = appendScheduledActivation(mode, { startsAt: schedStartsAt, endsAt: schedEndsAt || null, previousModeId: null });
    await updateMode(modeId, { scheduledActivations: updated.scheduledActivations });
    setShowSchedule(false); setSchedStartsAt(''); setSchedEndsAt(''); setSchedError('');
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
            return (
              <View key={p.id} style={[styles.productRow, { borderColor: theme.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                  {singleSize && ov.active && (
                    <ThemedTextInput
                      value={priceInputs[p.id] || ''}
                      onChangeText={v => setPriceOverride(p.id, v)}
                      placeholder={`Base: $${p.sizes[0]?.price?.toFixed(2) || '0.00'}`}
                      keyboardType="decimal-pad"
                    />
                  )}
                  {!singleSize && (
                    <Text style={[styles.multiSize, { color: theme.textMuted }]}>Múltiples precios — sin override disponible</Text>
                  )}
                </View>
                <Switch
                  value={ov.active}
                  onValueChange={() => toggleProduct(p.id)}
                  trackColor={{ false: '#D1D1D6', true: theme.accent }}
                  thumbColor="#FFF"
                />
              </View>
            );
          })}

          <Text style={[styles.section, { color: theme.textMuted }]}>ORDEN DE PESTAÑAS</Text>
          {tabOrd.map((tId, i) => {
            const tab = tabsLookup[tId];
            if (!tab) return null;
            return (
              <View key={tId} style={[styles.tabRow, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.tabName, { color: theme.text }]}>{tab.name}</Text>
                <View style={styles.tabBtns}>
                  <TouchableOpacity onPress={() => moveTab(i, i - 1)} disabled={i === 0}>
                    <Feather name="chevron-up" size={20} color={i === 0 ? theme.cardBorder : theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveTab(i, i + 1)} disabled={i === tabOrd.length - 1}>
                    <Feather name="chevron-down" size={20} color={i === tabOrd.length - 1 ? theme.cardBorder : theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <Text style={[styles.section, { color: theme.textMuted }]}>ACTIVACIONES PROGRAMADAS</Text>
          {(mode.scheduledActivations || []).map(entry => (
            <View key={entry.id} style={[styles.schedRow, { borderColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.schedDate, { color: theme.text }]}>Desde: {entry.startsAt}</Text>
                {entry.endsAt && <Text style={[styles.schedDate, { color: theme.textMuted }]}>Hasta: {entry.endsAt}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleRemoveSchedule(entry.id)}>
                <Feather name="trash-2" size={16} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.schedAddBtn, { borderColor: theme.cardBorder }]}
            onPress={() => setShowSchedule(true)}
          >
            <Feather name="clock" size={14} color={theme.textMuted} />
            <Text style={[styles.schedAddText, { color: theme.textMuted }]}>Programar activación</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
          <PrimaryButton label="GUARDAR CAMBIOS" onPress={handleSave} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CenterModal visible={showSchedule} onClose={() => { setShowSchedule(false); setSchedError(''); }} title="PROGRAMAR ACTIVACIÓN">
        <ThemedTextInput label="INICIO (ISO)" value={schedStartsAt} onChangeText={setSchedStartsAt} placeholder="2026-04-15T08:00:00" />
        <ThemedTextInput label="FIN (ISO, opcional)" value={schedEndsAt} onChangeText={setSchedEndsAt} placeholder="2026-04-15T18:00:00" error={schedError} />
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="PROGRAMAR" onPress={handleAddSchedule} />
        </View>
      </CenterModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  notFound: { textAlign: 'center', marginTop: 60, fontSize: 15, fontWeight: '600' },
  section: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  productName: { fontSize: 15, fontWeight: '700' },
  multiSize: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  tabRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  tabName: { flex: 1, fontSize: 14, fontWeight: '700' },
  tabBtns: { flexDirection: 'row', gap: 8 },
  schedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  schedDate: { fontSize: 12, fontWeight: '600' },
  schedAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderStyle: 'dashed', marginTop: 8,
  },
  schedAddText: { fontSize: 13, fontWeight: '700' },
});
