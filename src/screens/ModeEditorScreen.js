import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, Modal, FlatList,
  KeyboardAvoidingView, Platform, Animated, PanResponder, LayoutAnimation, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ScreenHeader from '../components/ScreenHeader';
import ThemedTextInput from '../components/ThemedTextInput';
import PrimaryButton from '../components/PrimaryButton';
import CenterModal from '../components/CenterModal';
import BottomSheetModal from '../components/BottomSheetModal';
import CalendarPicker from '../components/CalendarPicker';
import TimeWheelPicker from '../components/TimeWheelPicker';
import { validateModeForm, buildOverridesPatch, reorderTabOrder } from '../utils/modeManagement';
import { appendScheduledActivation, removeScheduledActivation, isScheduleValid } from '../utils/modeScheduling';
import { formatDateTimeReadable } from '../utils/formatters';
import { cycleColor } from '../utils/productEditorLogic';
import { FOOD_ICONS, CARD_COLORS, INGREDIENT_COLORS, getIconBtnSize, getIconCols } from '../constants/productConstants';

function SwipeRow({ isActive, onToggle, onLongPress, children, theme }) {
  const pan = useRef(new Animated.Value(0)).current;
  const activeRef = useRef(isActive);
  const toggleRef = useRef(onToggle);
  useEffect(() => { activeRef.current = isActive; }, [isActive]);
  useEffect(() => { toggleRef.current = onToggle; }, [onToggle]);

  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dx > 10,
    onPanResponderMove: (_, g) => { if (g.dx > 0) pan.setValue(g.dx); },
    onPanResponderRelease: (_, g) => {
      if (g.dx > 60) { toggleRef.current(); }
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
  const { modes, products, updateMode, updateProduct, showNotif, currentModeId, setCurrentMode } = useApp();
  const { workers } = useAuth();
  const { tabs } = useTab();
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const ICON_BTN_SIZE = getIconBtnSize(screenWidth);
  const ICON_COLS_DYN = getIconCols(screenWidth);

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdSizes, setEditProdSizes] = useState([]);
  const [editProdIngredients, setEditProdIngredients] = useState([]);
  const [editProdExtras, setEditProdExtras] = useState([]);
  const [editImageMode, setEditImageMode] = useState('icon');
  const [editSelectedIcon, setEditSelectedIcon] = useState('food');
  const [editIconBgColor, setEditIconBgColor] = useState('#000000');
  const [editProductPhoto, setEditProductPhoto] = useState(null);
  const [editMaxIngredients, setEditMaxIngredients] = useState('');
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);
  const [showEditIconPicker, setShowEditIconPicker] = useState(false);
  const [showEditPalette, setShowEditPalette] = useState(false);
  const [editPaletteTarget, setEditPaletteTarget] = useState(null);
  const [showEditIngIconPicker, setShowEditIngIconPicker] = useState(false);
  const [editIconTarget, setEditIconTarget] = useState(null);

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
    showNotif('Cambios guardados');
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

  const openProductEditor = (p) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdSizes(p.sizes.map(s => ({ ...s, priceStr: String(s.price) })));
    setEditProdIngredients((p.ingredients || p.flavors || []).map(ing => ({
      name: typeof ing === 'string' ? ing : ing.name || '', color: ing.color || INGREDIENT_COLORS[0], icon: ing.icon || null,
    })));
    setEditProdExtras((p.extras || p.toppings || []).map(ex => ({
      name: typeof ex === 'string' ? ex : ex.name || '', price: ex.price || 0, priceStr: String(ex.price || 0), color: ex.color || INGREDIENT_COLORS[0],
    })));
    setEditImageMode(p.imageMode || (p.customImage ? 'photo' : 'icon'));
    setEditSelectedIcon(p.iconName || 'food');
    setEditIconBgColor(p.iconBgColor || '#000000');
    setEditProductPhoto(p.customImage || null);
    setEditMaxIngredients(p.maxIngredients ? String(p.maxIngredients) : '');
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    const sizes = editProdSizes.map(s => {
      const { priceStr, ...rest } = s;
      return { ...rest, price: parseFloat(priceStr) || 0 };
    });
    const updates = {
      name: editProdName.trim(),
      sizes,
      imageMode: editImageMode,
      iconName: editImageMode === 'icon' ? editSelectedIcon : null,
      iconBgColor: editImageMode === 'icon' ? editIconBgColor : null,
      customImage: editImageMode === 'photo' ? editProductPhoto : null,
    };
    if (editingProduct.type === 'elaborado') {
      updates.ingredients = editProdIngredients.filter(ing => ing.name.trim());
      updates.extras = editProdExtras.filter(ex => ex.name.trim()).map(ex => {
        const { priceStr, ...rest } = ex;
        return { ...rest, price: parseFloat(priceStr) || 0 };
      });
      updates.maxIngredients = editMaxIngredients ? parseInt(editMaxIngredients) || null : null;
    }
    await updateProduct(editingProduct.id, updates);
    setEditingProduct(null);
    showNotif('Producto actualizado');
  };

  const pickEditPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setEditProductPhoto(result.assets[0].uri);
  };
  const takeEditPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setEditProductPhoto(result.assets[0].uri);
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
                  <TouchableOpacity onPress={() => toggleExpand(p.id)} onLongPress={() => openProductEditor(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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

          <TouchableOpacity
            style={[styles.addProductBtn, { borderColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <Feather name="plus" size={16} color={theme.textMuted} />
            <Text style={[styles.addProductText, { color: theme.textMuted }]}>Agregar producto</Text>
          </TouchableOpacity>

          <Text style={[styles.section, { color: theme.textMuted }]}>CATÁLOGO ACTIVO</Text>
          <SwipeRow isActive={currentModeId === modeId} onToggle={() => { if (currentModeId !== modeId) { setCurrentMode(modeId); showNotif('Catálogo activado'); } }} theme={theme}>
            <View style={[styles.statusDot, { backgroundColor: currentModeId === modeId ? '#30D158' : '#D1D1D6' }]} />
            <Text style={[styles.productName, { color: theme.text, flex: 1 }]}>
              {currentModeId === modeId ? 'Este catálogo está activo' : 'Deslizá para activar permanentemente'}
            </Text>
          </SwipeRow>

          <Text style={[styles.section, { color: theme.textMuted }]}>EMPLEADOS</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textMuted, marginBottom: 8 }}>{assignedIds.length} de {workers.length} asignados</Text>
          {workers.map(w => {
            const assigned = assignedIds.includes(w.id);
            return (
              <SwipeRow key={w.id} isActive={assigned} onToggle={() => toggleWorker(w.id)} theme={theme}>
                <View style={[styles.statusDot, { backgroundColor: assigned ? '#30D158' : '#D1D1D6' }]} />
                {w.photo ? <Image source={{ uri: w.photo }} style={styles.workerBubble} />
                  : <View style={[styles.workerBubble, { backgroundColor: w.role === 'owner' ? theme.accent : (w.color || '#1C1C1E'), alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={[styles.workerInitial, { color: w.role === 'owner' ? theme.accentText : '#fff' }]}>{w.name?.charAt(0)?.toUpperCase()}</Text>
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

      <CenterModal visible={!!editingProduct} onClose={() => setEditingProduct(null)} title="EDITAR PRODUCTO">
        <ThemedTextInput label="NOMBRE" value={editProdName} onChangeText={setEditProdName} placeholder="Nombre del producto" maxLength={30} />

        <Text style={[styles.detailLabel, { color: theme.textMuted, marginTop: 16 }]}>IMAGEN</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setEditImageMode('icon')} style={[styles.modeBtn, { backgroundColor: editImageMode === 'icon' ? theme.accent : theme.card, borderColor: editImageMode === 'icon' ? theme.accent : theme.cardBorder }]}>
            <Text style={{ color: editImageMode === 'icon' ? theme.accentText : theme.textSecondary, fontWeight: '700', fontSize: 14 }}>Ícono</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditImageMode('photo')} style={[styles.modeBtn, { backgroundColor: editImageMode === 'photo' ? theme.accent : theme.card, borderColor: editImageMode === 'photo' ? theme.accent : theme.cardBorder }]}>
            <Text style={{ color: editImageMode === 'photo' ? theme.accentText : theme.textSecondary, fontWeight: '700', fontSize: 14 }}>Foto</Text>
          </TouchableOpacity>
        </View>
        {editImageMode === 'icon' && (
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: editIconBgColor, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={editSelectedIcon} size={36} color="#fff" />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setShowEditColorPicker(true)} style={[styles.pickerBtn, { borderColor: theme.cardBorder }]}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: editIconBgColor }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Color</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditIconPicker(true)} style={[styles.pickerBtn, { borderColor: theme.cardBorder }]}>
                <Feather name="grid" size={14} color={theme.textSecondary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Ícono</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {editImageMode === 'photo' && (
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {editProductPhoto ? (
              <View>
                <Image source={{ uri: editProductPhoto }} style={{ width: 80, height: 80, borderRadius: 14 }} />
                <TouchableOpacity onPress={() => setEditProductPhoto(null)} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: theme.danger, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="x" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={takeEditPhoto} style={[styles.pickerBtn, { borderColor: theme.cardBorder }]}>
                  <Feather name="camera" size={14} color={theme.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickEditPhoto} style={[styles.pickerBtn, { borderColor: theme.cardBorder }]}>
                  <Feather name="image" size={14} color={theme.textSecondary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.detailLabel, { color: theme.textMuted, marginTop: 12 }]}>TAMAÑOS Y PRECIOS</Text>
        {editProdSizes.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ flex: 1 }}><ThemedTextInput value={s.name} onChangeText={v => setEditProdSizes(prev => prev.map((ps, pi) => pi === i ? { ...ps, name: v } : ps))} placeholder="Tamaño" /></View>
            <View style={{ width: 95 }}><ThemedTextInput value={s.priceStr} onChangeText={v => setEditProdSizes(prev => prev.map((ps, pi) => pi === i ? { ...ps, priceStr: v } : ps))} placeholder="$0.00" keyboardType="decimal-pad" prefix="$" /></View>
            {editProdSizes.length > 1 && <TouchableOpacity onPress={() => setEditProdSizes(prev => prev.filter((_, pi) => pi !== i))}><Feather name="x" size={16} color={theme.danger} /></TouchableOpacity>}
          </View>
        ))}
        <TouchableOpacity onPress={() => setEditProdSizes(prev => [...prev, { name: '', price: 0, priceStr: '' }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
          <Feather name="plus" size={14} color={theme.textMuted} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>Agregar tamaño</Text>
        </TouchableOpacity>

        {editingProduct?.type === 'elaborado' && (
          <>
            <Text style={[styles.detailLabel, { color: theme.textMuted, marginTop: 16 }]}>INGREDIENTES</Text>
            {editProdIngredients.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>Máx por pedido:</Text>
                <TextInput value={editMaxIngredients} onChangeText={setEditMaxIngredients} keyboardType="numeric" placeholder="∞" placeholderTextColor={theme.textMuted}
                  style={{ width: 40, fontSize: 14, fontWeight: '700', color: theme.text, textAlign: 'center', borderBottomWidth: 1, borderColor: theme.cardBorder, paddingVertical: 4 }} />
              </View>
            )}
            {editProdIngredients.map((ing, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TouchableOpacity onPress={() => setEditProdIngredients(prev => prev.map((p, pi) => pi === i ? { ...p, color: cycleColor(p.color, INGREDIENT_COLORS) } : p))}
                  onLongPress={() => { setEditPaletteTarget({ type: 'ingredient', index: i }); setShowEditPalette(true); }} delayLongPress={400}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ing.color || INGREDIENT_COLORS[0] }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditIconTarget(i); setShowEditIngIconPicker(true); }}>
                  <MaterialCommunityIcons name={ing.icon || 'food'} size={20} color={theme.text} />
                </TouchableOpacity>
                <TextInput value={ing.name} onChangeText={v => setEditProdIngredients(prev => prev.map((p, pi) => pi === i ? { ...p, name: v } : p))} placeholder="Ingrediente" placeholderTextColor={theme.textMuted}
                  style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text, paddingVertical: 4 }} />
                <TouchableOpacity onPress={() => setEditProdIngredients(prev => prev.filter((_, pi) => pi !== i))}><Feather name="x" size={16} color={theme.danger} /></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => setEditProdIngredients(prev => [...prev, { name: '', color: INGREDIENT_COLORS[prev.length % INGREDIENT_COLORS.length], icon: null }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
              <Feather name="plus" size={14} color={theme.textMuted} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>Agregar ingrediente</Text>
            </TouchableOpacity>

            <Text style={[styles.detailLabel, { color: theme.textMuted, marginTop: 16 }]}>EXTRAS</Text>
            {editProdExtras.map((ex, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TouchableOpacity onPress={() => setEditProdExtras(prev => prev.map((p, pi) => pi === i ? { ...p, color: cycleColor(p.color, INGREDIENT_COLORS) } : p))}
                  onLongPress={() => { setEditPaletteTarget({ type: 'extra', index: i }); setShowEditPalette(true); }} delayLongPress={400}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ex.color || INGREDIENT_COLORS[0] }} />
                </TouchableOpacity>
                <TextInput value={ex.name} onChangeText={v => setEditProdExtras(prev => prev.map((p, pi) => pi === i ? { ...p, name: v } : p))} placeholder="Extra" placeholderTextColor={theme.textMuted}
                  style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text, paddingVertical: 4 }} />
                <View style={{ width: 90 }}>
                  <ThemedTextInput value={ex.priceStr} onChangeText={v => setEditProdExtras(prev => prev.map((p, pi) => pi === i ? { ...p, priceStr: v } : p))} placeholder="$" keyboardType="decimal-pad" prefix="$" />
                </View>
                <TouchableOpacity onPress={() => setEditProdExtras(prev => prev.filter((_, pi) => pi !== i))}><Feather name="x" size={16} color={theme.danger} /></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => setEditProdExtras(prev => [...prev, { name: '', price: 0, priceStr: '0', color: INGREDIENT_COLORS[prev.length % INGREDIENT_COLORS.length] }])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
              <Feather name="plus" size={14} color={theme.textMuted} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted }}>Agregar extra</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ marginTop: 16 }}><PrimaryButton label="GUARDAR" onPress={handleSaveProduct} /></View>
      </CenterModal>

      {/* Color picker for product icon bg */}
      <Modal visible={showEditColorPicker} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', paddingHorizontal: 24 }} activeOpacity={1} onPress={() => setShowEditColorPicker(false)}>
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.cardBorder }} onStartShouldSetResponder={() => true}>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>Color de fondo</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {CARD_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => { setEditIconBgColor(c); setShowEditColorPicker(false); }}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: editIconBgColor === c ? 3 : 0, borderColor: '#fff' }}>
                  {editIconBgColor === c && <Feather name="check" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Ingredient/extra color palette */}
      <Modal visible={showEditPalette} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', paddingHorizontal: 24 }} activeOpacity={1} onPress={() => { setShowEditPalette(false); setEditPaletteTarget(null); }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.cardBorder }} onStartShouldSetResponder={() => true}>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>Elegir color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {INGREDIENT_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => {
                  if (editPaletteTarget?.type === 'ingredient') setEditProdIngredients(prev => prev.map((p, pi) => pi === editPaletteTarget.index ? { ...p, color: c } : p));
                  if (editPaletteTarget?.type === 'extra') setEditProdExtras(prev => prev.map((p, pi) => pi === editPaletteTarget.index ? { ...p, color: c } : p));
                  setShowEditPalette(false); setEditPaletteTarget(null);
                }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c }} />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Icon picker for product */}
      <BottomSheetModal visible={showEditIconPicker} onClose={() => setShowEditIconPicker(false)} title="ÍCONO DEL PRODUCTO">
        <FlatList data={FOOD_ICONS} key={ICON_COLS_DYN} numColumns={ICON_COLS_DYN} keyExtractor={item => item} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setEditSelectedIcon(item); setShowEditIconPicker(false); }}
              style={{ width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, borderRadius: 12, alignItems: 'center', justifyContent: 'center', margin: 4, backgroundColor: editSelectedIcon === item ? editIconBgColor : theme.bg, borderWidth: editSelectedIcon === item ? 1.5 : 1, borderColor: editSelectedIcon === item ? editIconBgColor : theme.cardBorder }}>
              <MaterialCommunityIcons name={item} size={26} color={editSelectedIcon === item ? '#fff' : theme.text} />
            </TouchableOpacity>
          )} />
      </BottomSheetModal>

      {/* Icon picker for ingredient */}
      <BottomSheetModal visible={showEditIngIconPicker} onClose={() => { setShowEditIngIconPicker(false); setEditIconTarget(null); }} title="ÍCONO DEL INGREDIENTE">
        <FlatList data={FOOD_ICONS} key={ICON_COLS_DYN} numColumns={ICON_COLS_DYN} keyExtractor={item => item} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const curColor = editIconTarget !== null ? (editProdIngredients[editIconTarget]?.color || INGREDIENT_COLORS[0]) : theme.accent;
            const curIcon = editIconTarget !== null ? editProdIngredients[editIconTarget]?.icon : null;
            return (
              <TouchableOpacity onPress={() => {
                if (editIconTarget !== null) setEditProdIngredients(prev => prev.map((p, pi) => pi === editIconTarget ? { ...p, icon: item } : p));
                setShowEditIngIconPicker(false); setEditIconTarget(null);
              }} style={{ width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, borderRadius: 12, alignItems: 'center', justifyContent: 'center', margin: 4, backgroundColor: curIcon === item ? curColor : theme.bg, borderWidth: curIcon === item ? 1.5 : 1, borderColor: curIcon === item ? curColor : theme.cardBorder }}>
                <MaterialCommunityIcons name={item} size={26} color={curIcon === item ? '#fff' : theme.text} />
              </TouchableOpacity>
            );
          }} />
      </BottomSheetModal>
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
  modeBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  addProductBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderStyle: 'dashed', marginTop: 8,
  },
  addProductText: { fontSize: 13, fontWeight: '700' },
});
