import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, Alert, Image, Modal, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';

// Verificados directamente del glyphmap de tu instalación
const FOOD_ICONS = [
  'food', 'food-outline', 'food-variant', 'food-fork-drink',
  'food-apple', 'food-apple-outline', 'food-croissant',
  'food-drumstick', 'food-drumstick-outline', 'food-drumstick-off', 'food-drumstick-off-outline',
  'food-steak', 'food-hot-dog', 'food-turkey',
  'food-halal', 'food-kosher',
  'food-takeout-box', 'food-takeout-box-outline',
  'food-off', 'food-off-outline', 'food-variant-off',
  'hamburger', 'hamburger-check', 'hamburger-plus', 'hamburger-off',
  'french-fries', 'pizza', 'taco', 'noodles', 'pasta', 'rice',
  'fruit-watermelon', 'fruit-cherries', 'fruit-cherries-off',
  'fruit-citrus', 'fruit-citrus-off',
  'fruit-grapes', 'fruit-grapes-outline',
  'fruit-pineapple', 'fruit-pear',
  'cake', 'cake-layered', 'cake-variant', 'cake-variant-outline',
  'cookie', 'cookie-outline', 'cupcake', 'muffin',
  'candy', 'candy-outline', 'candy-off', 'candy-off-outline', 'candycane',
  'bread-slice', 'bread-slice-outline', 'pretzel',
  'ice-cream', 'ice-cream-off', 'ice-pop',
  'coffee', 'coffee-outline', 'coffee-to-go', 'coffee-to-go-outline',
  'coffee-maker', 'coffee-maker-outline', 'coffee-off', 'coffee-off-outline',
  'tea', 'tea-outline',
  'cup', 'cup-outline', 'cup-water', 'cup-off', 'cup-off-outline',
  'beer', 'beer-outline',
  'bottle-wine', 'bottle-wine-outline', 'glass-wine',
  'pot-steam', 'pot-steam-outline',
  'grill', 'grill-outline',
  'toaster', 'toaster-oven', 'toaster-off',
  'room-service', 'room-service-outline',
  'egg', 'egg-outline', 'egg-fried', 'egg-off', 'egg-off-outline',
  'fish', 'fish-off',
  'mushroom', 'mushroom-outline', 'mushroom-off', 'mushroom-off-outline',
  'carrot', 'popcorn', 'peanut', 'peanut-outline',
  'peanut-off', 'peanut-off-outline', 'nut', 'nutrition',
  'kettle-steam', 'kettle-steam-outline',
];

const CARD_COLORS = [
  '#000000', '#1C1C1E', '#2C2C2E',
  '#D62828', '#F77F00', '#FCBF49',
  '#2B9348', '#007F5F', '#06D6A0',
  '#4361EE', '#4CC9F0', '#118AB2',
  '#7209B7', '#B5179E', '#F72585',
  '#533483', '#3A0CA3', '#E94560',
];

const FLAVOR_COLORS = [
  '#FF6B6B', '#A855F7', '#34D399', '#FBBF24', '#7C3AED',
  '#D97706', '#F59E0B', '#FB923C', '#F97316', '#DC2626',
  '#F472B6', '#86EFAC', '#FDE047', '#92400E', '#60A5FA',
  '#818CF8', '#F87171', '#2DD4BF', '#E879F9', '#FCD34D',
  '#6EE7B7', '#93C5FD', '#C084FC', '#FCA5A5', '#FDBA74',
];

export default function AddProductScreen({ navigation }) {
  const { addProduct } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();
  const { tabs, activeTabId, addProductToMultipleTabs } = useTab();

  const [name, setName] = useState('');
  const [imageMode, setImageMode] = useState('icon');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconBgColor, setIconBgColor] = useState('#000000');
  const [productPhoto, setProductPhoto] = useState(null);
  const [sizes, setSizes] = useState([{ name: '', price: '' }]);
  const [toppings, setToppings] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [maxFlavors, setMaxFlavors] = useState('3');
  const [includedToppings, setIncludedToppings] = useState('1');
  const [selectedTabs, setSelectedTabs] = useState([activeTabId]);
  const [showPalette, setShowPalette] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(null);

  const toggleTab = (tabId) => {
    setSelectedTabs(prev =>
      prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId]
    );
  };

  const pickProductPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!r.canceled) setProductPhoto(r.assets[0].uri);
  };

  const takeProductPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('', 'Necesitamos la cámara'); return; }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!r.canceled) setProductPhoto(r.assets[0].uri);
  };

  const addSize = () => setSizes([...sizes, { name: '', price: '' }]);
  const updateSize = (i, f, v) => { const n = [...sizes]; n[i][f] = v; setSizes(n); };
  const removeSize = (i) => setSizes(sizes.filter((_, idx) => idx !== i));

  const addTopping = () => setToppings([...toppings, { name: '', price: '', isDefault: false }]);
  const updateTopping = (i, f, v) => { const n = [...toppings]; n[i][f] = v; setToppings(n); };
  const removeTopping = (i) => setToppings(toppings.filter((_, idx) => idx !== i));

  const addFlavor = () => {
    const colorIndex = flavors.length % FLAVOR_COLORS.length;
    setFlavors([...flavors, { name: '', color: FLAVOR_COLORS[colorIndex] }]);
  };
  const updateFlavor = (i, f, v) => { const n = [...flavors]; n[i][f] = v; setFlavors(n); };
  const removeFlavor = (i) => setFlavors(flavors.filter((_, idx) => idx !== i));

  const handleColorTap = (i) => {
    const nextIdx = (FLAVOR_COLORS.indexOf(flavors[i].color) + 1) % FLAVOR_COLORS.length;
    updateFlavor(i, 'color', FLAVOR_COLORS[nextIdx]);
  };

  const handleColorLongPress = (i) => {
    setPaletteIndex(i);
    setShowPalette(true);
  };

  const selectPaletteColor = (color) => {
    if (paletteIndex !== null) updateFlavor(paletteIndex, 'color', color);
    setShowPalette(false);
    setPaletteIndex(null);
  };

  const handleSave = async () => {
    if (currentWorker?.role !== 'admin') {
      Alert.alert('', 'Solo el administrador puede agregar productos'); return;
    }
    if (!name.trim()) { Alert.alert('', 'Ponele un nombre'); return; }
    if (!sizes[0]?.price) { Alert.alert('', 'Agregá al menos un precio'); return; }
    if (selectedTabs.length === 0) { Alert.alert('', 'Seleccioná al menos una pestaña'); return; }

    const newProduct = await addProduct({
      name: name.trim(),
      iconName: imageMode === 'icon' ? selectedIcon : null,
      iconBgColor: imageMode === 'icon' ? iconBgColor : null,
      customImage: imageMode === 'photo' ? productPhoto : null,
      imageMode,
      sizes: sizes.filter(s => s.price).map(s => ({ name: s.name || 'Normal', price: parseFloat(s.price) || 0 })),
      toppings: toppings.filter(t => t.name).map(t => ({ name: t.name, price: parseFloat(t.price) || 0, isDefault: t.isDefault })),
      flavors: flavors.filter(f => f.name).map(f => ({ name: f.name.trim(), color: f.color })),
      maxFlavors: parseInt(maxFlavors) || 3,
      includedToppings: parseInt(includedToppings) || 1,
    });

    if (newProduct && newProduct.id) {
      await addProductToMultipleTabs(selectedTabs, newProduct.id);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>NUEVO PRODUCTO</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* PESTAÑAS */}
        <Text style={[styles.label, { color: theme.textMuted }]}>AGREGAR A</Text>
        <View style={styles.tabsGrid}>
          {tabs.map(tab => {
            const sel = selectedTabs.includes(tab.id);
            return (
              <TouchableOpacity key={tab.id}
                style={[styles.tabChip,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  sel && { backgroundColor: tab.color, borderColor: tab.color }]}
                onPress={() => toggleTab(tab.id)}
              >
                <Text style={[styles.tabChipText,
                  { color: theme.textSecondary },
                  sel && { color: tab.color === '#FFFFFF' ? '#000' : '#FFF' }]}>
                  {tab.name}
                </Text>
                {sel && <Feather name="check" size={12} color={tab.color === '#FFFFFF' ? '#000' : '#FFF'} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* NOMBRE */}
        <Text style={[styles.label, { color: theme.textMuted }]}>NOMBRE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
          value={name}
          onChangeText={t => setName(t.slice(0, 30))}
          placeholder="Ej: Minuta tradicional"
          placeholderTextColor={theme.textMuted}
          maxLength={30}
        />

        {/* MODO DE IMAGEN */}
        <Text style={[styles.label, { color: theme.textMuted }]}>IMAGEN</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              imageMode === 'icon' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setImageMode('icon')}
          >
            <Text style={[styles.modeText, { color: theme.textSecondary },
              imageMode === 'icon' && { color: theme.accentText }]}>Ícono</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              imageMode === 'photo' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setImageMode('photo')}
          >
            <Text style={[styles.modeText, { color: theme.textSecondary },
              imageMode === 'photo' && { color: theme.accentText }]}>Foto real</Text>
          </TouchableOpacity>
        </View>

        {/* ÍCONO */}
        {imageMode === 'icon' && (
          <View style={styles.iconSection}>
            {/* Preview */}
            <View style={[styles.iconPreviewWrap, { backgroundColor: iconBgColor }]}>
              {selectedIcon
                ? <MaterialCommunityIcons name={selectedIcon} size={54} color="#fff" />
                : <Feather name="image" size={36} color="rgba(255,255,255,0.35)" />
              }
            </View>

            {/* Color de fondo */}
            <TouchableOpacity
              style={[styles.pickerRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowColorPicker(true)}
            >
              <View style={[styles.colorDot, { backgroundColor: iconBgColor }]} />
              <Text style={[styles.pickerRowText, { color: theme.text }]}>Color de fondo</Text>
              <Feather name="chevron-right" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Ícono */}
            <TouchableOpacity
              style={[styles.pickerRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowIconPicker(true)}
            >
              {selectedIcon
                ? <MaterialCommunityIcons name={selectedIcon} size={20} color={theme.text} />
                : <Feather name="grid" size={18} color={theme.textSecondary} />
              }
              <Text style={[styles.pickerRowText, { color: theme.text }]}>
                {selectedIcon ? 'Cambiar ícono' : 'Elegir ícono'}
              </Text>
              <Feather name="chevron-right" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* FOTO */}
        {imageMode === 'photo' && (
          <View>
            {productPhoto ? (
              <View style={styles.photoWrap}>
                <Image source={{ uri: productPhoto }} style={styles.photoImg} />
                <TouchableOpacity
                  style={[styles.photoRemove, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => setProductPhoto(null)}
                >
                  <Feather name="x" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoBtns}>
                <TouchableOpacity
                  style={[styles.photoBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={takeProductPhoto}
                >
                  <MaterialCommunityIcons name="camera-outline" size={28} color={theme.textSecondary} />
                  <Text style={[styles.photoBtnText, { color: theme.textSecondary }]}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={pickProductPhoto}
                >
                  <MaterialCommunityIcons name="image-outline" size={28} color={theme.textSecondary} />
                  <Text style={[styles.photoBtnText, { color: theme.textSecondary }]}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAMAÑOS */}
        <Text style={[styles.label, { color: theme.textMuted }]}>TAMAÑOS Y PRECIOS</Text>
        {sizes.map((s, i) => (
          <View key={i} style={styles.fieldRow}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={s.name} onChangeText={v => updateSize(i, 'name', v)}
              placeholder="Tamaño" placeholderTextColor={theme.textMuted} maxLength={20}
            />
            <View style={[styles.priceField, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
              <Text style={[styles.priceDollar, { color: theme.text }]}>$</Text>
              <TextInput
                style={[styles.priceInput, { color: theme.text }]}
                value={s.price} onChangeText={v => updateSize(i, 'price', v)}
                placeholder="0.00" keyboardType="numeric" placeholderTextColor={theme.textMuted}
              />
            </View>
            {sizes.length > 1 && (
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => removeSize(i)}
              >
                <Feather name="x" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={[styles.addRowBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={addSize}
        >
          <Text style={[styles.addRowText, { color: theme.textMuted }]}>+ Tamaño</Text>
        </TouchableOpacity>

        {/* COMPONENTES */}
        <Text style={[styles.label, { color: theme.textMuted }]}>COMPONENTES</Text>
        <Text style={[styles.sublabel, { color: theme.textMuted }]}>
          Opciones que componen el producto (sabores, bases, estilos)
        </Text>
        {flavors.length > 0 && (
          <View style={styles.maxRow}>
            <Text style={[styles.maxLabel, { color: theme.textMuted }]}>Máx por unidad:</Text>
            {['1', '2', '3', '4', '5'].map(n => (
              <TouchableOpacity key={n}
                style={[styles.maxBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  maxFlavors === n && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                onPress={() => setMaxFlavors(n)}
              >
                <Text style={[styles.maxNum, { color: theme.textSecondary },
                  maxFlavors === n && { color: theme.accentText }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {flavors.map((f, i) => (
          <View key={i} style={styles.flavorRow}>
            <TouchableOpacity
              style={[styles.flavorColorBtn, { backgroundColor: f.color }]}
              onPress={() => handleColorTap(i)}
              onLongPress={() => handleColorLongPress(i)}
              delayLongPress={400}
            />
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={f.name} onChangeText={v => updateFlavor(i, 'name', v)}
              placeholder="Nombre del componente" placeholderTextColor={theme.textMuted} maxLength={20}
            />
            <TouchableOpacity
              style={[styles.removeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => removeFlavor(i)}
            >
              <Feather name="x" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.addRowBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={addFlavor}
        >
          <Text style={[styles.addRowText, { color: theme.textMuted }]}>+ Componente</Text>
        </TouchableOpacity>

        {/* TOPPINGS */}
        <Text style={[styles.label, { color: theme.textMuted }]}>EXTRAS / TOPPINGS</Text>
        {toppings.length > 0 && (
          <View style={[styles.maxRow, { marginBottom: 12, marginTop: -4 }]}>
            <Text style={[styles.maxLabel, { color: theme.textMuted }]}>Incluidos gratis:</Text>
            {['0', '1', '2', '3'].map(n => (
              <TouchableOpacity key={n}
                style={[styles.maxBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  includedToppings === n && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                onPress={() => setIncludedToppings(n)}
              >
                <Text style={[styles.maxNum, { color: theme.textSecondary },
                  includedToppings === n && { color: theme.accentText }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {toppings.map((t, i) => (
          <View key={i} style={styles.fieldRow}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={t.name} onChangeText={v => updateTopping(i, 'name', v)}
              placeholder="Extra" placeholderTextColor={theme.textMuted} maxLength={20}
            />
            <View style={[styles.priceField, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
              <Text style={[styles.priceDollar, { color: theme.text }]}>$</Text>
              <TextInput
                style={[styles.priceInput, { color: theme.text }]}
                value={t.price} onChangeText={v => updateTopping(i, 'price', v)}
                placeholder="0.00" keyboardType="numeric" placeholderTextColor={theme.textMuted}
              />
            </View>
            <TouchableOpacity
              style={[styles.removeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => removeTopping(i)}
            >
              <Feather name="x" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.addRowBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={addTopping}
        >
          <Text style={[styles.addRowText, { color: theme.textMuted }]}>+ Extra</Text>
        </TouchableOpacity>

      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
          <Text style={[styles.saveText, { color: theme.accentText }]}>GUARDAR</Text>
        </TouchableOpacity>
      </View>

      {/* ICON PICKER MODAL */}
      <Modal visible={showIconPicker} transparent animationType="slide">
        <View style={[styles.sheetOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.sheetModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>ELEGIR ÍCONO</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Feather name="x" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={FOOD_ICONS}
              numColumns={6}
              keyExtractor={item => item}
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedIcon === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.iconGridBtn,
                      { backgroundColor: isSelected ? iconBgColor : theme.bg },
                      isSelected && { borderColor: iconBgColor },
                    ]}
                    onPress={() => { setSelectedIcon(item); setShowIconPicker(false); }}
                  >
                    <MaterialCommunityIcons
                      name={item}
                      size={26}
                      color={isSelected ? '#fff' : theme.text}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* COLOR BG PICKER MODAL */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.paletteOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View
            style={[styles.paletteModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.paletteTitle, { color: theme.text }]}>Color de fondo</Text>
            <View style={styles.paletteGrid}>
              {CARD_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.paletteColor, { backgroundColor: color },
                    iconBgColor === color && styles.paletteColorSelected]}
                  onPress={() => { setIconBgColor(color); setShowColorPicker(false); }}
                >
                  {iconBgColor === color && <Feather name="check" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FLAVOR COLOR PALETTE MODAL */}
      <Modal visible={showPalette} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.paletteOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => { setShowPalette(false); setPaletteIndex(null); }}
        >
          <View
            style={[styles.paletteModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.paletteTitle, { color: theme.text }]}>Color del componente</Text>
            <View style={styles.paletteGrid}>
              {FLAVOR_COLORS.map(color => {
                const isSelected = paletteIndex !== null && flavors[paletteIndex]?.color === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[styles.paletteColor, { backgroundColor: color },
                      isSelected && styles.paletteColorSelected]}
                    onPress={() => selectPaletteColor(color)}
                  >
                    {isSelected && <Feather name="check" size={16} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  sublabel: { fontSize: 12, fontWeight: '600', marginTop: -6, marginBottom: 12 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', borderWidth: 1 },
  tabsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
  },
  tabChipText: { fontSize: 13, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  modeText: { fontSize: 14, fontWeight: '700' },
  iconSection: { gap: 10 },
  iconPreviewWrap: {
    alignSelf: 'center', width: 96, height: 96,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1,
  },
  pickerRowText: { flex: 1, fontSize: 14, fontWeight: '600' },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  photoBtns: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, borderRadius: 14, paddingVertical: 28, alignItems: 'center', gap: 8, borderWidth: 1 },
  photoBtnText: { fontSize: 12, fontWeight: '700' },
  photoWrap: { position: 'relative' },
  photoImg: { width: '100%', height: 180, borderRadius: 14, resizeMode: 'cover' },
  photoRemove: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  fieldRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  priceField: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, width: 100 },
  priceDollar: { fontSize: 16, fontWeight: '900' },
  priceInput: { fontSize: 16, fontWeight: '600', paddingVertical: 14, paddingLeft: 4, flex: 1 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  addRowBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4, borderWidth: 1, borderStyle: 'dashed' },
  addRowText: { fontSize: 13, fontWeight: '700' },
  maxRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  maxLabel: { fontSize: 12, fontWeight: '700', marginRight: 4 },
  maxBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  maxNum: { fontSize: 14, fontWeight: '800' },
  flavorRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  flavorColorBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, borderTopWidth: 1 },
  saveBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveText: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: '78%' },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  sheetTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  iconGrid: { paddingHorizontal: 12, paddingBottom: 40 },
  iconGridBtn: {
    width: 52, height: 52, margin: 4,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  paletteOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  paletteModal: { width: 300, borderRadius: 20, padding: 24, borderWidth: 1 },
  paletteTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  paletteColor: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  paletteColorSelected: { borderWidth: 3, borderColor: '#fff' },
});