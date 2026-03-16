import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, TextInput, Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const getTextColor = (bgColor) => {
  if (!bgColor) return '#FFF';
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#000' : '#FFF';
};

export default function OrderBuilderScreen({ route, navigation }) {
  const { product } = route.params;
  const { theme } = useTheme();
  const scrollRef = useRef(null);

  const [units, setUnits] = useState([makeUnit(1)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);

  function makeUnit(num) {
    return {
      id: Date.now().toString() + '_' + num,
      number: num,
      flavors: [],
      toppings: [],
      notes: '',
    };
  }

  const active = units[activeIdx] || units[0];
  const maxF = product.maxFlavors || 3;
  const hasFlavors = product.flavors && product.flavors.length > 0;
  const hasToppings = product.toppings && product.toppings.length > 0;

  const updateUnit = (idx, changes) => {
    setUnits(prev => prev.map((u, i) => i === idx ? { ...u, ...changes } : u));
  };

  const toggleFlavor = (flavorName) => {
    const current = active.flavors;
    if (current.includes(flavorName)) {
      updateUnit(activeIdx, { flavors: current.filter(f => f !== flavorName) });
    } else if (current.length < maxF) {
      updateUnit(activeIdx, { flavors: [...current, flavorName] });
    }
  };

  const toggleTopping = (toppingName) => {
    const current = active.toppings;
    if (current.includes(toppingName)) {
      updateUnit(activeIdx, { toppings: current.filter(t => t !== toppingName) });
    } else {
      updateUnit(activeIdx, { toppings: [...current, toppingName] });
    }
  };

  const setNotes = (text) => {
    updateUnit(activeIdx, { notes: text.slice(0, 60) });
  };

  const addUnit = () => {
    const newUnit = makeUnit(units.length + 1);
    const newUnits = [...units, newUnit];
    setUnits(newUnits);
    setActiveIdx(newUnits.length - 1);
  };

  const duplicateCurrent = () => {
    const source = units[activeIdx];
    const newUnit = {
      ...makeUnit(units.length + 1),
      flavors: [...source.flavors],
      toppings: [...source.toppings],
      notes: source.notes,
    };
    const newUnits = [...units, newUnit];
    setUnits(newUnits);
    setActiveIdx(newUnits.length - 1);
  };

  const removeUnit = (idx) => {
    if (units.length <= 1) return;
    const newUnits = units.filter((_, i) => i !== idx).map((u, i) => ({ ...u, number: i + 1 }));
    setUnits(newUnits);
    setActiveIdx(Math.min(activeIdx, newUnits.length - 1));
  };

  const goNext = () => {
    if (activeIdx < units.length - 1) {
      setActiveIdx(activeIdx + 1);
    } else {
      addUnit();
    }
  };

  const calcTotal = () => {
    const base = product.sizes[selectedSize]?.price || 0;
    const toppingExtra = units.reduce((sum, u) => {
      return sum + u.toppings.reduce((ts, tName) => {
        const t = product.toppings?.find(tp => tp.name === tName);
        return ts + (t && !t.isDefault ? t.price : 0);
      }, 0);
    }, 0);
    return base * units.length + toppingExtra;
  };

  const handleCobrar = () => {
    navigation.navigate('Payment', {
      order: {
        product,
        size: product.sizes[selectedSize],
        quantity: units.length,
        total: calcTotal(),
        units: units.map(u => ({
          flavors: u.flavors,
          toppings: u.toppings,
          notes: u.notes,
        })),
        toppings: [...new Set(units.flatMap(u => u.toppings))],
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
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

      {/* Size */}
      {product.sizes.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sizeBar}>
          {product.sizes.map((s, i) => (
            <TouchableOpacity key={s.name}
              style={[styles.sizeChip,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                selectedSize === i && { backgroundColor: theme.accent, borderColor: theme.accent }]}
              onPress={() => setSelectedSize(i)}
            >
              <Text style={[styles.sizeChipText,
                { color: theme.textSecondary },
                selectedSize === i && { color: theme.accentText }]}>
                {s.name} · ${s.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Unit tabs */}
      <View style={styles.unitTabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          ref={scrollRef} contentContainerStyle={styles.unitTabs}>
          {units.map((u, i) => {
            const isActive = i === activeIdx;
            const dots = u.flavors.map(fn => {
              const f = product.flavors?.find(fl => fl.name === fn);
              return f?.color || '#888';
            });
            return (
              <TouchableOpacity key={u.id}
                style={[styles.unitTab,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  isActive && { borderColor: theme.accent, borderWidth: 2.5 }]}
                onPress={() => setActiveIdx(i)}
              >
                <View style={styles.unitTabHeader}>
                  <Text style={[styles.unitNum, { color: isActive ? theme.text : theme.textMuted }]}>
                    #{u.number}
                  </Text>
                  {units.length > 1 && (
                    <TouchableOpacity style={styles.unitRemove} onPress={() => removeUnit(i)}>
                      <Text style={{ color: theme.danger, fontSize: 11, fontWeight: '800' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.dotRow}>
                  {dots.length > 0 ? dots.map((c, di) => (
                    <View key={di} style={[styles.dot, { backgroundColor: c }]} />
                  )) : (
                    <View style={[styles.dot, { backgroundColor: theme.cardBorder }]} />
                  )}
                </View>
                {u.notes ? (
                  <Text style={[styles.unitNote, { color: theme.textMuted }]} numberOfLines={1}>📝</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.unitAddBtn, { borderColor: theme.textMuted }]} onPress={addUnit}>
            <Text style={[styles.unitAddText, { color: theme.textMuted }]}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Builder area */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.builderContent}>
        {/* Active indicator */}
        <View style={styles.activeLabel}>
          <Text style={[styles.activeLabelText, { color: theme.text }]}>
            {product.name} #{active.number}
          </Text>
          <TouchableOpacity onPress={duplicateCurrent}
            style={[styles.dupBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.dupBtnText, { color: theme.textSecondary }]}>📋 Duplicar</Text>
          </TouchableOpacity>
        </View>

        {/* Flavors */}
        {hasFlavors && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SABORES</Text>
              <Text style={[styles.sectionCounter, { color: theme.accent }]}>
                {active.flavors.length}/{maxF}
              </Text>
            </View>
            <View style={styles.flavorGrid}>
              {product.flavors.map(f => {
                const sel = active.flavors.includes(f.name);
                const txtColor = getTextColor(f.color);
                return (
                  <TouchableOpacity key={f.name}
                    style={[styles.flavorBtn,
                      { backgroundColor: sel ? f.color : theme.card, borderColor: sel ? f.color : theme.cardBorder }]}
                    onPress={() => toggleFlavor(f.name)}
                  >
                    <View style={[styles.flavorDotSmall, { backgroundColor: f.color }]} />
                    <Text style={[styles.flavorName,
                      { color: sel ? txtColor : theme.textSecondary }]}
                      numberOfLines={1}>
                      {f.name}
                    </Text>
                    {sel && <Text style={[styles.flavorCheck, { color: txtColor }]}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Toppings */}
        {hasToppings && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>TOPPINGS</Text>
            <View style={styles.toppingGrid}>
              {product.toppings.map(t => {
                const sel = active.toppings.includes(t.name);
                return (
                  <TouchableOpacity key={t.name}
                    style={[styles.toppingBtn,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      sel && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => toggleTopping(t.name)}
                  >
                    <Text style={[styles.toppingName,
                      { color: theme.textSecondary },
                      sel && { color: theme.accentText }]}>
                      {t.name}
                    </Text>
                    {t.price > 0 && !t.isDefault && (
                      <Text style={[styles.toppingPrice,
                        { color: theme.textMuted },
                        sel && { color: theme.accentText }]}>
                        +${t.price.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NOTA RÁPIDA</Text>
          <View style={[styles.notesRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={styles.notesIcon}>📝</Text>
            <TextInput
              style={[styles.notesInput, { color: theme.text }]}
              value={active.notes}
              onChangeText={setNotes}
              placeholder="Ej: sin hielo, sabor mango..."
              placeholderTextColor={theme.textMuted}
              maxLength={60}
            />
            {active.notes.length > 0 && (
              <Text style={[styles.notesCount, { color: theme.textMuted }]}>{active.notes.length}/60</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={goNext}
          >
            <Text style={[styles.nextBtnText, { color: theme.text }]}>
              {activeIdx < units.length - 1 ? `#${activeIdx + 2} →` : '+ Otra'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cobrarBtn, { backgroundColor: theme.accent }]} onPress={handleCobrar}>
            <Text style={[styles.cobrarText, { color: theme.accentText }]}>COBRAR</Text>
            <Text style={[styles.cobrarPrice, { color: theme.accentText }]}>${calcTotal().toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
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
  sizeChipText: { fontSize: 13, fontWeight: '700' },
  unitTabsWrap: { height: 80, marginBottom: 4 },
  unitTabs: { paddingHorizontal: 16, gap: 8, alignItems: 'flex-start' },
  unitTab: {
    width: 70, height: 70, borderRadius: 16, borderWidth: 1.5,
    padding: 8, justifyContent: 'space-between',
  },
  unitTabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitNum: { fontSize: 13, fontWeight: '800' },
  unitRemove: { padding: 2 },
  dotRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  unitNote: { fontSize: 10 },
  unitAddBtn: {
    width: 70, height: 70, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  unitAddText: { fontSize: 24, fontWeight: '300' },
  builderContent: { paddingHorizontal: 16, paddingBottom: 120 },
  activeLabel: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, marginTop: 8,
  },
  activeLabelText: { fontSize: 18, fontWeight: '900' },
  dupBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dupBtnText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 10 },
  sectionCounter: { fontSize: 14, fontWeight: '900' },
  flavorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flavorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
    minWidth: (width - 48) / 3,
  },
  flavorDotSmall: { width: 14, height: 14, borderRadius: 7 },
  flavorName: { fontSize: 14, fontWeight: '700', flex: 1 },
  flavorCheck: { fontSize: 14, fontWeight: '900' },
  toppingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toppingBtn: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  toppingName: { fontSize: 13, fontWeight: '700' },
  toppingPrice: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  notesRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    paddingHorizontal: 14, borderWidth: 1, gap: 8,
  },
  notesIcon: { fontSize: 16 },
  notesInput: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 14 },
  notesCount: { fontSize: 11, fontWeight: '700' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 34, borderTopWidth: 1,
  },
  bottomRow: { flexDirection: 'row', gap: 10 },
  nextBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', borderWidth: 1,
  },
  nextBtnText: { fontSize: 16, fontWeight: '800' },
  cobrarBtn: {
    flex: 2, borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
  },
  cobrarText: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  cobrarPrice: { fontSize: 18, fontWeight: '900' },
});