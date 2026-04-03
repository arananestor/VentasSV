import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const getTextColor = (bg) => {
  if (!bg) return '#FFF';
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#000' : '#FFF';
};

export default function OrderBuilderScreen({ route, navigation }) {
  const { product } = route.params;
  const { theme } = useTheme();
  const { addToCart } = useApp();
  const scrollRef = useRef(null);

  // Compatibilidad: soporta tanto el formato nuevo (ingredients/extras) como el viejo (flavors/toppings)
  const productIngredients = product.ingredients || product.flavors || [];
  const productExtras = product.extras || product.toppings || [];
  const maxIng = product.maxIngredients || product.maxFlavors || null; // null = sin límite

  const makeUnit = (num) => ({
    id: Date.now().toString() + '_' + num + '_' + Math.random(),
    number: num,
    ingredients: [],
    extras: [],
    note: '',
  });

  const [units, setUnits] = useState([makeUnit(1)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [orderNote, setOrderNote] = useState(''); // nota general del pedido

  const active = units[activeIdx] || units[0];

  const updateUnit = (idx, changes) => {
    setUnits(prev => prev.map((u, i) => i === idx ? { ...u, ...changes } : u));
  };

  const toggleIngredient = (ing) => {
    const cur = active.ingredients;
    const already = cur.find(i => i.name === ing.name);
    if (already) {
      updateUnit(activeIdx, { ingredients: cur.filter(i => i.name !== ing.name) });
    } else {
      if (maxIng && cur.length >= maxIng) return;
      updateUnit(activeIdx, { ingredients: [...cur, { name: ing.name, color: ing.color, icon: ing.icon || null }] });
    }
  };

  const toggleExtra = (ex) => {
    const cur = active.extras;
    const already = cur.find(e => e.name === ex.name);
    if (already) {
      updateUnit(activeIdx, { extras: cur.filter(e => e.name !== ex.name) });
    } else {
      updateUnit(activeIdx, { extras: [...cur, { name: ex.name, color: ex.color, price: ex.price || 0 }] });
    }
  };

  const addUnit = () => {
    const u = makeUnit(units.length + 1);
    setUnits([...units, u]);
    setActiveIdx(units.length);
  };

  const duplicateCurrent = () => {
    const src = units[activeIdx];
    const u = {
      ...makeUnit(units.length + 1),
      ingredients: [...src.ingredients],
      extras: [...src.extras],
      note: src.note,
    };
    setUnits([...units, u]);
    setActiveIdx(units.length);
  };

  const removeUnit = (idx) => {
    if (units.length <= 1) return;
    const next = units.filter((_, i) => i !== idx).map((u, i) => ({ ...u, number: i + 1 }));
    setUnits(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
  };

  const calcTotal = () => {
    const base = product.sizes[selectedSize]?.price || 0;
    const extrasTotal = units.reduce((sum, u) =>
      sum + u.extras.reduce((s, e) => s + (e.price || 0), 0), 0
    );
    return base * units.length + extrasTotal;
  };

  const handleAgregar = () => {
    const size = product.sizes[selectedSize];
    addToCart({
      product,
      size,
      quantity: units.length,
      units: units.map(u => ({
        ingredients: u.ingredients,
        extras: u.extras,
        note: u.note,
      })),
      extras: [...new Set(units.flatMap(u => u.extras.map(e => e.name)))],
      note: orderNote,
      total: calcTotal(),
    });
    navigation.goBack();
  };

  const hasIngredients = productIngredients.length > 0;
  const hasExtras = productExtras.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{product.name}</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.countText, { color: theme.accentText }]}>{units.length}</Text>
        </View>
      </View>

      {/* TAMAÑOS */}
      {product.sizes.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeBar}>
          {product.sizes.map((s, i) => (
            <TouchableOpacity key={s.name}
              style={[styles.sizeChip, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                selectedSize === i && { backgroundColor: theme.accent, borderColor: theme.accent }]}
              onPress={() => setSelectedSize(i)}
            >
              <Text style={[styles.sizeText, { color: theme.textSecondary },
                selectedSize === i && { color: theme.accentText }]}>
                {s.name} · ${s.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* UNIDADES */}
      <View style={styles.unitWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollRef} contentContainerStyle={styles.unitRow}>
          {units.map((u, i) => {
            const isAct = i === activeIdx;
            return (
              <TouchableOpacity key={u.id}
                style={[styles.unitTab, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  isAct && { borderColor: theme.accent, borderWidth: 2.5 }]}
                onPress={() => setActiveIdx(i)}
                onLongPress={() => {
                  if (units.length > 1) {
                    Alert.alert(`Unidad #${u.number}`, '¿Eliminar esta unidad?', [
                      { text: 'No', style: 'cancel' },
                      { text: 'Sí', style: 'destructive', onPress: () => removeUnit(i) },
                    ]);
                  }
                }}
              >
                <Text style={[styles.unitNum, { color: isAct ? theme.text : theme.textMuted }]}>#{u.number}</Text>
                <View style={styles.dotRow}>
                  {u.ingredients.length > 0
                    ? u.ingredients.slice(0, 4).map((ing, di) => (
                        <View key={di} style={[styles.dot, { backgroundColor: ing.color || '#888' }]} />
                      ))
                    : <View style={[styles.dot, { backgroundColor: theme.cardBorder }]} />
                  }
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.unitAdd, { borderColor: theme.textMuted }]} onPress={addUnit}>
            <Feather name="plus" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.builder}>
        {/* Header de unidad activa */}
        <View style={styles.activeLabelRow}>
          <Text style={[styles.activeLabel, { color: theme.text }]}>
            {product.name} {units.length > 1 ? `#${active.number}` : ''}
          </Text>
          <TouchableOpacity
            style={[styles.dupBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={duplicateCurrent}
          >
            <MaterialCommunityIcons name="content-copy" size={14} color={theme.textSecondary} />
            <Text style={[styles.dupText, { color: theme.textSecondary }]}>Duplicar</Text>
          </TouchableOpacity>
        </View>

        {/* INGREDIENTES */}
        {hasIngredients && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>INGREDIENTES</Text>
              {maxIng
                ? <Text style={[styles.sectionCount, { color: theme.accent }]}>
                    {active.ingredients.length}/{maxIng}
                  </Text>
                : active.ingredients.length > 0 && (
                    <Text style={[styles.sectionCount, { color: theme.accent }]}>
                      {active.ingredients.length} selec.
                    </Text>
                  )
              }
            </View>
            <View style={styles.ingredientGrid}>
              {productIngredients.map(ing => {
                const sel = active.ingredients.find(i => i.name === ing.name);
                const txtC = getTextColor(ing.color);
                const atLimit = maxIng && active.ingredients.length >= maxIng && !sel;
                return (
                  <TouchableOpacity key={ing.name}
                    style={[styles.ingredientBtn,
                      { backgroundColor: sel ? ing.color : theme.card, borderColor: sel ? ing.color : theme.cardBorder },
                      atLimit && { opacity: 0.4 }]}
                    onPress={() => toggleIngredient(ing)}
                    disabled={atLimit}
                  >
                    {ing.icon ? (
                      <MaterialCommunityIcons
                        name={ing.icon}
                        size={18}
                        color={sel ? txtC : theme.textSecondary}
                      />
                    ) : (
                      <View style={[styles.ingColorDot, { backgroundColor: ing.color }]} />
                    )}
                    <Text style={[styles.ingredientName, { color: sel ? txtC : theme.textSecondary }]} numberOfLines={1}>
                      {ing.name}
                    </Text>
                    {sel && <Feather name="check" size={13} color={txtC} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* EXTRAS */}
        {hasExtras && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>EXTRAS</Text>
            <View style={styles.extraGrid}>
              {productExtras.map(ex => {
                const sel = active.extras.find(e => e.name === ex.name);
                return (
                  <TouchableOpacity key={ex.name}
                    style={[styles.extraBtn,
                      { backgroundColor: sel ? (ex.color || theme.accent) : theme.card,
                        borderColor: sel ? (ex.color || theme.accent) : theme.cardBorder }]}
                    onPress={() => toggleExtra(ex)}
                  >
                    <View style={[styles.extraColorBar, { backgroundColor: ex.color || theme.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.extraName, { color: sel ? '#fff' : theme.textSecondary }]}>
                        {ex.name}
                      </Text>
                      {ex.price > 0 && (
                        <Text style={[styles.extraPrice, { color: sel ? 'rgba(255,255,255,0.8)' : theme.textMuted }]}>
                          +${ex.price.toFixed(2)}
                        </Text>
                      )}
                    </View>
                    {sel && <Feather name="check" size={14} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* NOTA DE LA UNIDAD */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NOTA PARA ESTA UNIDAD</Text>
          <View style={[styles.notesBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.notesInput, { color: theme.text }]}
              value={active.note}
              onChangeText={text => updateUnit(activeIdx, { note: text })}
              placeholder="Ej: sin chile, bien frío, extra crema..."
              placeholderTextColor={theme.textMuted}
              multiline
            />
          </View>
        </View>

        {/* NOTA GENERAL DEL PEDIDO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NOTA GENERAL DEL PEDIDO</Text>
          <View style={[styles.notesBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.notesInput, { color: theme.text }]}
              value={orderNote}
              onChangeText={setOrderNote}
              placeholder="Ej: cliente espera afuera, alergia a maní..."
              placeholderTextColor={theme.textMuted}
              multiline
            />
          </View>
        </View>

      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity style={[styles.agregarBtn, { backgroundColor: theme.accent }]} onPress={handleAgregar}>
          <Text style={[styles.agregarText, { color: theme.accentText }]}>AGREGAR AL PEDIDO</Text>
          <Text style={[styles.agregarPrice, { color: theme.accentText }]}>${calcTotal().toFixed(2)}</Text>
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
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', flex: 1, textAlign: 'center' },
  countBadge: { minWidth: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
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
  activeLabel: { fontSize: 18, fontWeight: '900', flex: 1 },
  dupBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dupText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 12 },
  sectionCount: { fontSize: 14, fontWeight: '900' },
  // Ingredientes
  ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
    minWidth: (width - 48) / 3,
  },
  ingColorDot: { width: 14, height: 14, borderRadius: 7 },
  ingredientName: { fontSize: 13, fontWeight: '700', flex: 1 },
  // Extras
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
    minWidth: (width - 48) / 2.5, overflow: 'hidden',
  },
  extraColorBar: { width: 4, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  extraName: { fontSize: 13, fontWeight: '700' },
  extraPrice: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  // Notas
  notesBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1 },
  notesInput: { fontSize: 15, fontWeight: '600', paddingVertical: 12, minHeight: 60 },
  // Bottom
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 34, borderTopWidth: 1,
  },
  agregarBtn: {
    borderRadius: 16, paddingVertical: 18, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24,
  },
  agregarText: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  agregarPrice: { fontSize: 20, fontWeight: '900' },
});