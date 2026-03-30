import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
   TextInput, Dimensions, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const FLAVOR_COLORS_PALETTE = [
  '#FF6B6B', '#A855F7', '#34D399', '#FBBF24', '#7C3AED',
  '#D97706', '#F59E0B', '#FB923C', '#F97316', '#DC2626',
  '#F472B6', '#86EFAC', '#FDE047', '#92400E', '#60A5FA',
  '#818CF8', '#F87171', '#2DD4BF', '#E879F9', '#FCD34D',
  '#6EE7B7', '#93C5FD', '#C084FC', '#FCA5A5', '#FDBA74',
];

const getTextColor = (bg) => {
  if (!bg) return '#FFF';
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#000' : '#FFF';
};

export default function OrderBuilderScreen({ route, navigation }) {
  const { product, initialQty = 1 } = route.params;
  const { theme } = useTheme();
  const scrollRef = useRef(null);

  const makeUnit = (num) => ({
    id: Date.now().toString() + '_' + num + '_' + Math.random(),
    number: num,
    flavors: [],
    toppings: [],
    notes: '',
  });

  const initialUnits = Array.from({ length: initialQty }, (_, i) => makeUnit(i + 1));
  const [units, setUnits] = useState(initialUnits);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);

  const active = units[activeIdx] || units[0];
  const maxF = product.maxFlavors || 3;
  const includedToppings = product.includedToppings || 1;
  const hasFlavors = product.flavors && product.flavors.length > 0;
  const hasToppings = product.toppings && product.toppings.length > 0;

  const updateUnit = (idx, changes) => {
    setUnits(prev => prev.map((u, i) => i === idx ? { ...u, ...changes } : u));
  };

  const toggleFlavor = (name) => {
    const cur = active.flavors;
    if (cur.includes(name)) updateUnit(activeIdx, { flavors: cur.filter(f => f !== name) });
    else if (cur.length < maxF) updateUnit(activeIdx, { flavors: [...cur, name] });
  };

  const toggleTopping = (name) => {
    const cur = active.toppings;
    if (cur.includes(name)) updateUnit(activeIdx, { toppings: cur.filter(t => t !== name) });
    else updateUnit(activeIdx, { toppings: [...cur, name] });
  };

  const setNotes = (text) => updateUnit(activeIdx, { notes: text.slice(0, 60) });

  const addUnit = () => {
    const u = makeUnit(units.length + 1);
    setUnits([...units, u]);
    setActiveIdx(units.length);
  };

  const duplicateCurrent = () => {
    const src = units[activeIdx];
    const u = { ...makeUnit(units.length + 1), flavors: [...src.flavors], toppings: [...src.toppings], notes: src.notes };
    setUnits([...units, u]);
    setActiveIdx(units.length);
  };

  const removeUnit = (idx) => {
    if (units.length <= 1) return;
    const next = units.filter((_, i) => i !== idx).map((u, i) => ({ ...u, number: i + 1 }));
    setUnits(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
  };

  const getToppingExtra = (unit) => {
    const paidToppings = unit.toppings.slice(includedToppings);
    let extra = 0;
    paidToppings.forEach(tName => {
      const t = product.toppings?.find(tp => tp.name === tName);
      if (t && t.price > 0) extra += t.price;
    });
    return extra;
  };

  const calcTotal = () => {
    const base = product.sizes[selectedSize]?.price || 0;
    const toppingExtras = units.reduce((sum, u) => sum + getToppingExtra(u), 0);
    return base * units.length + toppingExtras;
  };

  const handleCobrar = () => {
    navigation.navigate('Payment', {
      order: {
        product,
        size: product.sizes[selectedSize],
        quantity: units.length,
        total: calcTotal(),
        units: units.map(u => ({
          flavors: u.flavors.map(fn => {
            const fl = product.flavors?.find(f => f.name === fn);
            return { name: fn, color: fl?.color || '#888' };
          }),
          toppings: u.toppings,
          note: u.notes,
        })),
        toppings: [...new Set(units.flatMap(u => u.toppings))],
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{product.name}</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.countText, { color: theme.accentText }]}>{units.length}</Text>
        </View>
      </View>

      {product.sizes.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeBar}>
          {product.sizes.map((s, i) => (
            <TouchableOpacity key={s.name}
              style={[styles.sizeChip, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                selectedSize === i && { backgroundColor: theme.accent, borderColor: theme.accent }]}
              onPress={() => setSelectedSize(i)}
            >
              <Text style={[styles.sizeText, { color: theme.textSecondary },
                selectedSize === i && { color: theme.accentText }]}>{s.name} · ${s.price.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.unitWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollRef} contentContainerStyle={styles.unitRow}>
          {units.map((u, i) => {
            const isAct = i === activeIdx;
            const dots = u.flavors.map(fn => product.flavors?.find(fl => fl.name === fn)?.color || '#888');
            return (
              <TouchableOpacity key={u.id}
                style={[styles.unitTab, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  isAct && { borderColor: theme.accent, borderWidth: 2.5 }]}
                onPress={() => setActiveIdx(i)}
                onLongPress={() => {
                  if (units.length > 1) {
                    Alert.alert(`#${u.number}`, 'Eliminar esta unidad?', [
                      { text: 'No', style: 'cancel' },
                      { text: 'Sí', style: 'destructive', onPress: () => removeUnit(i) },
                    ]);
                  }
                }}
              >
                <Text style={[styles.unitNum, { color: isAct ? theme.text : theme.textMuted }]}>#{u.number}</Text>
                <View style={styles.dotRow}>
                  {dots.length > 0
                    ? dots.map((c, di) => <View key={di} style={[styles.dot, { backgroundColor: c }]} />)
                    : <View style={[styles.dot, { backgroundColor: theme.cardBorder }]} />
                  }
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.unitAdd, { borderColor: theme.textMuted }]} onPress={addUnit}>
            <Text style={[{ color: theme.textMuted, fontSize: 20, fontWeight: '300' }]}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.builder}>
        <View style={styles.activeLabelRow}>
          <Text style={[styles.activeLabel, { color: theme.text }]}>{product.name} #{active.number}</Text>
          <TouchableOpacity
            style={[styles.dupBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={duplicateCurrent}
          >
            <Text style={[styles.dupText, { color: theme.textSecondary }]}>📋 Duplicar</Text>
          </TouchableOpacity>
        </View>

        {hasFlavors && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>COMPONENTES</Text>
              <Text style={[styles.sectionCount, { color: theme.accent }]}>{active.flavors.length}/{maxF}</Text>
            </View>
            <View style={styles.flavorGrid}>
              {product.flavors.map(f => {
                const sel = active.flavors.includes(f.name);
                const txtC = getTextColor(f.color);
                return (
                  <TouchableOpacity key={f.name}
                    style={[styles.flavorBtn,
                      { backgroundColor: sel ? f.color : theme.card, borderColor: sel ? f.color : theme.cardBorder }]}
                    onPress={() => toggleFlavor(f.name)}
                  >
                    <View style={[styles.flavorDot, { backgroundColor: f.color, borderWidth: sel ? 0 : 1, borderColor: 'rgba(0,0,0,0.1)' }]} />
                    <Text style={[styles.flavorName, { color: sel ? txtC : theme.textSecondary }]} numberOfLines={1}>
                      {f.name}
                    </Text>
                    {sel && <Text style={[styles.flavorCheck, { color: txtC }]}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {hasToppings && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>TOPPINGS</Text>
              <Text style={[styles.sectionCount, { color: theme.textMuted }]}>{includedToppings} gratis</Text>
            </View>
            <View style={styles.toppingGrid}>
              {product.toppings.map((t) => {
                const sel = active.toppings.includes(t.name);
                const selIndex = active.toppings.indexOf(t.name);
                const isPaid = sel && selIndex >= includedToppings;
                return (
                  <TouchableOpacity key={t.name}
                    style={[styles.toppingBtn,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      sel && !isPaid && { backgroundColor: theme.accent, borderColor: theme.accent },
                      isPaid && { backgroundColor: '#FF9500', borderColor: '#FF9500' }]}
                    onPress={() => toggleTopping(t.name)}
                  >
                    <Text style={[styles.toppingName, { color: theme.textSecondary }, sel && { color: '#FFF' }]}>
                      {t.name}
                    </Text>
                    {isPaid && t.price > 0 && (
                      <Text style={styles.toppingExtra}>+${t.price.toFixed(2)}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NOTA RÁPIDA</Text>
          <View style={[styles.notesBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.notesInput, { color: theme.text }]}
              value={active.notes}
              onChangeText={setNotes}
              placeholder="Ej: sin hielo, sabor especial..."
              placeholderTextColor={theme.textMuted}
              maxLength={60}
            />
            {active.notes.length > 0 && (
              <Text style={[styles.notesLen, { color: theme.textMuted }]}>{active.notes.length}/60</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity style={[styles.cobrarBtn, { backgroundColor: theme.accent }]} onPress={handleCobrar}>
          <Text style={[styles.cobrarText, { color: theme.accentText }]}>COBRAR</Text>
          <Text style={[styles.cobrarPrice, { color: theme.accentText }]}>${calcTotal().toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backText: { fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  countBadge: { minWidth: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  countText: { fontSize: 16, fontWeight: '900' },
  sizeBar: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  sizeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  sizeText: { fontSize: 13, fontWeight: '700' },
  unitWrap: { height: 72, marginBottom: 4 },
  unitRow: { paddingHorizontal: 16, gap: 8, alignItems: 'flex-start' },
  unitTab: { width: 64, height: 64, borderRadius: 14, borderWidth: 1.5, padding: 8, justifyContent: 'space-between' },
  unitNum: { fontSize: 12, fontWeight: '800' },
  dotRow: { flexDirection: 'row', gap: 3, flexWrap: 'wrap' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  unitAdd: {
    width: 64, height: 64, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  builder: { paddingHorizontal: 16, paddingBottom: 120 },
  activeLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, marginTop: 8,
  },
  activeLabel: { fontSize: 18, fontWeight: '900' },
  dupBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dupText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 10 },
  sectionCount: { fontSize: 14, fontWeight: '900' },
  flavorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flavorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
    minWidth: (width - 48) / 3,
  },
  flavorDot: { width: 14, height: 14, borderRadius: 7 },
  flavorName: { fontSize: 13, fontWeight: '700', flex: 1 },
  flavorCheck: { fontSize: 13, fontWeight: '900' },
  toppingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toppingBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  toppingName: { fontSize: 13, fontWeight: '700' },
  toppingExtra: { color: '#FFF', fontSize: 10, fontWeight: '800', marginTop: 2 },
  notesBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1 },
  notesInput: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 14 },
  notesLen: { fontSize: 11, fontWeight: '700' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 34, borderTopWidth: 1,
  },
  cobrarBtn: {
    borderRadius: 16, paddingVertical: 18, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24,
  },
  cobrarText: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  cobrarPrice: { fontSize: 20, fontWeight: '900' },
});