import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, Image, Modal, FlatList, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import BottomSheetModal from '../components/BottomSheetModal';
import { FOOD_ICONS, CARD_COLORS, INGREDIENT_COLORS, getIconBtnSize, getIconCols } from '../constants/productConstants';

export default function AddProductScreen({ navigation }) {
  const { addProduct } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const ICON_BTN_SIZE = getIconBtnSize(screenWidth);
  const ICON_COLS_DYN = getIconCols(screenWidth);
  const { tabs, activeTabId, addProductToMultipleTabs } = useTab();

  // Tipo de producto
  const [productType, setProductType] = useState(null); // 'simple' | 'elaborado'

  // Campos comunes
  const [name, setName] = useState('');
  const [imageMode, setImageMode] = useState('icon');
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconBgColor, setIconBgColor] = useState('#000000');
  const [productPhoto, setProductPhoto] = useState(null);
  const [sizes, setSizes] = useState([{ name: '', price: '' }]);
  const [selectedTabs, setSelectedTabs] = useState([activeTabId]);

  // Solo elaborado
  const [ingredients, setIngredients] = useState([]);
  const [extras, setExtras] = useState([]);
  const [maxIngredients, setMaxIngredients] = useState('');

  // Modales
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  // Paleta de ingrediente
  const [paletteTarget, setPaletteTarget] = useState(null); // { type: 'ingredient'|'extra', index }
  const [showPalette, setShowPalette] = useState(false);
  // Selector de ícono de ingrediente
  const [iconTarget, setIconTarget] = useState(null); // index del ingrediente
  const [showIngredientIconPicker, setShowIngredientIconPicker] = useState(false);

  // ── Tabs ──
  const toggleTab = (tabId) => {
    setSelectedTabs(prev =>
      prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId]
    );
  };

  // ── Foto de producto ──
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

  // ── Tamaños ──
  const addSize = () => setSizes([...sizes, { name: '', price: '' }]);
  const updateSize = (i, f, v) => { const n = [...sizes]; n[i][f] = v; setSizes(n); };
  const removeSize = (i) => setSizes(sizes.filter((_, idx) => idx !== i));

  // ── Ingredientes ──
  const addIngredient = () => {
    const color = INGREDIENT_COLORS[ingredients.length % INGREDIENT_COLORS.length];
    setIngredients([...ingredients, { name: '', color, icon: null }]);
  };
  const updateIngredient = (i, f, v) => {
    const n = [...ingredients]; n[i][f] = v; setIngredients(n);
  };
  const removeIngredient = (i) => setIngredients(ingredients.filter((_, idx) => idx !== i));

  const cycleIngredientColor = (i) => {
    const cur = INGREDIENT_COLORS.indexOf(ingredients[i].color);
    const next = INGREDIENT_COLORS[(cur + 1) % INGREDIENT_COLORS.length];
    updateIngredient(i, 'color', next);
  };

  // ── Extras ──
  const addExtra = () => {
    const color = INGREDIENT_COLORS[extras.length % INGREDIENT_COLORS.length];
    setExtras([...extras, { name: '', price: '', color }]);
  };
  const updateExtra = (i, f, v) => { const n = [...extras]; n[i][f] = v; setExtras(n); };
  const removeExtra = (i) => setExtras(extras.filter((_, idx) => idx !== i));

  const cycleExtraColor = (i) => {
    const cur = INGREDIENT_COLORS.indexOf(extras[i].color);
    const next = INGREDIENT_COLORS[(cur + 1) % INGREDIENT_COLORS.length];
    updateExtra(i, 'color', next);
  };

  // ── Guardar ──
  const handleSave = async () => {
    if (currentWorker?.role !== 'owner' && currentWorker?.role !== 'co-admin') {
      Alert.alert('', 'Solo el dueño o encargado puede agregar productos'); return;
    }
    if (!productType) { Alert.alert('', 'Elegí el tipo de producto'); return; }
    if (!name.trim()) { Alert.alert('', 'Ponele un nombre'); return; }
    if (!sizes[0]?.price) { Alert.alert('', 'Agregá al menos un precio'); return; }
    if (selectedTabs.length === 0) { Alert.alert('', 'Seleccioná al menos una pestaña'); return; }

    const newProduct = await addProduct({
      type: productType,
      name: name.trim(),
      iconName: imageMode === 'icon' ? selectedIcon : null,
      iconBgColor: imageMode === 'icon' ? iconBgColor : null,
      customImage: imageMode === 'photo' ? productPhoto : null,
      imageMode,
      sizes: sizes.filter(s => s.price).map(s => ({
        name: s.name || 'Normal',
        price: parseFloat(s.price) || 0,
      })),
      ingredients: productType === 'elaborado'
        ? ingredients.filter(f => f.name).map(f => ({
            name: f.name.trim(),
            color: f.color,
            icon: f.icon || null,
          }))
        : [],
      extras: productType === 'elaborado'
        ? extras.filter(t => t.name).map(t => ({
            name: t.name,
            price: parseFloat(t.price) || 0,
            color: t.color,
          }))
        : [],
      maxIngredients: productType === 'elaborado'
        ? (parseInt(maxIngredients) || null)
        : null,
    });

    if (newProduct?.id) {
      await addProductToMultipleTabs(selectedTabs, newProduct.id);
    }
    navigation.goBack();
  };

  // ── Si no eligió tipo aún, mostrar selector ──
  if (!productType) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="NUEVO PRODUCTO" onBack={() => navigation.goBack()} />

        <View style={styles.typeScreen}>
          <Text style={[styles.typeTitle, { color: theme.text }]}>¿Qué tipo de producto es?</Text>
          <Text style={[styles.typeSubtitle, { color: theme.textMuted }]}>
            Esto define cómo se toma el pedido
          </Text>

          <TouchableOpacity
            style={[styles.typeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setProductType('simple')}
            activeOpacity={0.85}
          >
            <View style={[styles.typeIconWrap, { backgroundColor: '#4361EE' + '18' }]}>
              <MaterialCommunityIcons name="tag-outline" size={36} color="#4361EE" />
            </View>
            <View style={styles.typeCardText}>
              <Text style={[styles.typeCardTitle, { color: theme.text }]}>Producto simple</Text>
              <Text style={[styles.typeCardDesc, { color: theme.textMuted }]}>
                Lo vendés tal cual. Tiene precio fijo.{'\n'}
                Ropa, bebidas enlatadas, snacks, artículos.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setProductType('elaborado')}
            activeOpacity={0.85}
          >
            <View style={[styles.typeIconWrap, { backgroundColor: '#F77F00' + '18' }]}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={36} color="#F77F00" />
            </View>
            <View style={styles.typeCardText}>
              <Text style={[styles.typeCardTitle, { color: theme.text }]}>Producto elaborado</Text>
              <Text style={[styles.typeCardDesc, { color: theme.textMuted }]}>
                Lo preparás al momento. Tiene ingredientes y extras.{'\n'}
                Pupusas, minutas, licuados, platos, bebidas.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Formulario principal ──
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title={productType === 'simple' ? 'PRODUCTO SIMPLE' : 'PRODUCTO ELABORADO'}
        onBack={() => setProductType(null)}
      />

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
          placeholder="Ej: Pupusa de chicharrón"
          placeholderTextColor={theme.textMuted}
          maxLength={30}
        />

        {/* IMAGEN */}
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

        {imageMode === 'icon' && (
          <View style={styles.iconSection}>
            <View style={[styles.iconPreviewWrap, { backgroundColor: iconBgColor }]}>
              {selectedIcon
                ? <MaterialCommunityIcons name={selectedIcon} size={54} color="#fff" />
                : <Feather name="image" size={36} color="rgba(255,255,255,0.35)" />
              }
            </View>
            <TouchableOpacity
              style={[styles.pickerRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowColorPicker(true)}
            >
              <View style={[styles.colorDot, { backgroundColor: iconBgColor }]} />
              <Text style={[styles.pickerRowText, { color: theme.text }]}>Color de fondo</Text>
              <Feather name="chevron-right" size={16} color={theme.textMuted} />
            </TouchableOpacity>
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

        {/* TAMAÑOS Y PRECIOS */}
        <Text style={[styles.label, { color: theme.textMuted }]}>TAMAÑOS Y PRECIOS</Text>
        {sizes.map((s, i) => (
          <View key={i} style={styles.fieldRow}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={s.name} onChangeText={v => updateSize(i, 'name', v)}
              placeholder="Tamaño (ej: Grande)" placeholderTextColor={theme.textMuted} maxLength={20}
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

        {/* ── SOLO ELABORADO ── */}
        {productType === 'elaborado' && (
          <>
            {/* INGREDIENTES */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.label, { color: theme.textMuted, marginTop: 0 }]}>INGREDIENTES</Text>
                <Text style={[styles.sublabel, { color: theme.textMuted }]}>
                  Lo que compone el producto. Cada uno tiene su color e ícono.
                </Text>
              </View>
            </View>

            {ingredients.length > 0 && (
              <View style={[styles.maxRow, { marginBottom: 14 }]}>
                <Text style={[styles.maxLabel, { color: theme.textMuted }]}>Máx por pedido:</Text>
                <TextInput
                  style={[styles.maxInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                  value={maxIngredients}
                  onChangeText={v => setMaxIngredients(v.replace(/[^0-9]/g, ''))}
                  placeholder="Sin límite"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            )}

            {ingredients.map((ing, i) => (
              <View key={i} style={[styles.ingredientCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {/* Color + Ícono */}
                <View style={styles.ingredientVisual}>
                  <TouchableOpacity
                    style={[styles.ingredientIconWrap, { backgroundColor: ing.color }]}
                    onPress={() => cycleIngredientColor(i)}
                    onLongPress={() => {
                      setPaletteTarget({ type: 'ingredient', index: i });
                      setShowPalette(true);
                    }}
                    delayLongPress={400}
                  >
                    {ing.icon
                      ? <MaterialCommunityIcons name={ing.icon} size={22} color="#fff" />
                      : <Feather name="droplet" size={18} color="rgba(255,255,255,0.7)" />
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ingredientIconBtn, { borderColor: theme.cardBorder }]}
                    onPress={() => { setIconTarget(i); setShowIngredientIconPicker(true); }}
                  >
                    <Feather name="grid" size={13} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Nombre */}
                <TextInput
                  style={[styles.ingredientInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                  value={ing.name}
                  onChangeText={v => updateIngredient(i, 'name', v)}
                  placeholder="Ej: Chicharrón, Fresa, Vainilla"
                  placeholderTextColor={theme.textMuted}
                  maxLength={25}
                />

                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => removeIngredient(i)}
                >
                  <Feather name="x" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addRowBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={addIngredient}
            >
              <Text style={[styles.addRowText, { color: theme.textMuted }]}>+ Ingrediente</Text>
            </TouchableOpacity>

            {/* EXTRAS */}
            <Text style={[styles.label, { color: theme.textMuted }]}>EXTRAS</Text>
            <Text style={[styles.sublabel, { color: theme.textMuted }]}>
              Lo que se agrega aparte. Podés cobrar un precio adicional.
            </Text>

            {extras.map((ex, i) => (
              <View key={i} style={[styles.ingredientCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <TouchableOpacity
                  style={[styles.extraColorBtn, { backgroundColor: ex.color }]}
                  onPress={() => cycleExtraColor(i)}
                  onLongPress={() => {
                    setPaletteTarget({ type: 'extra', index: i });
                    setShowPalette(true);
                  }}
                  delayLongPress={400}
                />
                <TextInput
                  style={[styles.ingredientInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                  value={ex.name}
                  onChangeText={v => updateExtra(i, 'name', v)}
                  placeholder="Ej: Curtido, Crema, Jalapeño"
                  placeholderTextColor={theme.textMuted}
                  maxLength={25}
                />
                <View style={[styles.priceFieldSmall, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
                  <Text style={[styles.priceDollar, { color: theme.text }]}>$</Text>
                  <TextInput
                    style={[styles.priceInputSmall, { color: theme.text }]}
                    value={ex.price}
                    onChangeText={v => updateExtra(i, 'price', v)}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => removeExtra(i)}
                >
                  <Feather name="x" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addRowBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={addExtra}
            >
              <Text style={[styles.addRowText, { color: theme.textMuted }]}>+ Extra</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <PrimaryButton label="GUARDAR" onPress={handleSave} />
      </View>

      {/* ICON PICKER — producto */}
      <BottomSheetModal
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        title="ÍCONO DEL PRODUCTO"
      >
            <FlatList
              data={FOOD_ICONS}
              key={ICON_COLS_DYN}
              numColumns={ICON_COLS_DYN}
              keyExtractor={item => item}
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedIcon === item;
                return (
                  <TouchableOpacity
                    style={[styles.iconGridBtn,
                      { width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, backgroundColor: isSelected ? iconBgColor : theme.bg },
                      isSelected && { borderColor: iconBgColor }]}
                    onPress={() => { setSelectedIcon(item); setShowIconPicker(false); }}
                  >
                    <MaterialCommunityIcons name={item} size={26} color={isSelected ? '#fff' : theme.text} />
                  </TouchableOpacity>
                );
              }}
            />
      </BottomSheetModal>

      {/* ICON PICKER — ingrediente */}
      <BottomSheetModal
        visible={showIngredientIconPicker}
        onClose={() => setShowIngredientIconPicker(false)}
        title="ÍCONO DEL INGREDIENTE"
      >
            <FlatList
              data={FOOD_ICONS}
              key={ICON_COLS_DYN}
              numColumns={ICON_COLS_DYN}
              keyExtractor={item => item}
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const curIcon = iconTarget !== null ? ingredients[iconTarget]?.icon : null;
                const curColor = iconTarget !== null ? ingredients[iconTarget]?.color : theme.accent;
                const isSelected = curIcon === item;
                return (
                  <TouchableOpacity
                    style={[styles.iconGridBtn,
                      { width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, backgroundColor: isSelected ? curColor : theme.bg },
                      isSelected && { borderColor: curColor }]}
                    onPress={() => {
                      if (iconTarget !== null) updateIngredient(iconTarget, 'icon', item);
                      setShowIngredientIconPicker(false);
                      setIconTarget(null);
                    }}
                  >
                    <MaterialCommunityIcons name={item} size={26} color={isSelected ? '#fff' : theme.text} />
                  </TouchableOpacity>
                );
              }}
            />
      </BottomSheetModal>

      {/* COLOR FONDO PRODUCTO */}
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

      {/* PALETA — ingrediente o extra */}
      <Modal visible={showPalette} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.paletteOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => { setShowPalette(false); setPaletteTarget(null); }}
        >
          <View
            style={[styles.paletteModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.paletteTitle, { color: theme.text }]}>
              {paletteTarget?.type === 'ingredient' ? 'Color del ingrediente' : 'Color del extra'}
            </Text>
            <View style={styles.paletteGrid}>
              {INGREDIENT_COLORS.map(color => {
                const cur = paletteTarget?.type === 'ingredient'
                  ? ingredients[paletteTarget.index]?.color
                  : extras[paletteTarget?.index]?.color;
                const isSelected = cur === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[styles.paletteColor, { backgroundColor: color },
                      isSelected && styles.paletteColorSelected]}
                    onPress={() => {
                      if (!paletteTarget) return;
                      if (paletteTarget.type === 'ingredient') {
                        updateIngredient(paletteTarget.index, 'color', color);
                      } else {
                        updateExtra(paletteTarget.index, 'color', color);
                      }
                      setShowPalette(false);
                      setPaletteTarget(null);
                    }}
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
  // Selector de tipo
  typeScreen: { flex: 1, paddingHorizontal: 20, paddingTop: 32, gap: 16 },
  typeTitle: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  typeSubtitle: { fontSize: 14, fontWeight: '500', marginBottom: 16 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 20, padding: 20, borderWidth: 1,
  },
  typeIconWrap: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  typeCardText: { flex: 1 },
  typeCardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  typeCardDesc: { fontSize: 13, fontWeight: '500', lineHeight: 19 },

  // Formulario
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  sublabel: { fontSize: 12, fontWeight: '500', marginTop: -6, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 24 },
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
  priceFieldSmall: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, borderWidth: 1, width: 80 },
  priceDollar: { fontSize: 15, fontWeight: '900' },
  priceInput: { fontSize: 16, fontWeight: '600', paddingVertical: 14, paddingLeft: 4, flex: 1 },
  priceInputSmall: { fontSize: 14, fontWeight: '600', paddingVertical: 12, paddingLeft: 4, flex: 1 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  addRowBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4, borderWidth: 1, borderStyle: 'dashed' },
  addRowText: { fontSize: 13, fontWeight: '700' },
  maxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  maxLabel: { fontSize: 12, fontWeight: '700' },
  maxInput: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, fontWeight: '700', borderWidth: 1, width: 100,
  },

  // Ingrediente card
  ingredientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 10, borderWidth: 1, marginBottom: 8,
  },
  ingredientVisual: { alignItems: 'center', gap: 4 },
  ingredientIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  ingredientIconBtn: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  ingredientInput: {
    flex: 1, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, fontWeight: '600', borderWidth: 1,
  },
  extraColorBtn: { width: 44, height: 44, borderRadius: 22 },

  // Modales
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, borderTopWidth: 1 },
  iconGrid: { paddingHorizontal: 8, paddingBottom: 40 },
  iconGridBtn: {
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    margin: 4,
  },
  paletteOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  paletteModal: { width: 300, borderRadius: 20, padding: 24, borderWidth: 1 },
  paletteTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  paletteColor: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  paletteColorSelected: { borderWidth: 3, borderColor: '#fff' },
});
