import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';

const STICKER_OPTIONS = [
  { type: 'minuta', label: '🍧' },
  { type: 'fresas', label: '🍓' },
  { type: 'chocobanano', label: '🍌' },
  { type: 'sorbete', label: '🍦' },
];

export default function AddProductScreen({ navigation }) {
  const { addProduct } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();
  const { tabs, activeTabId, addProductToMultipleTabs } = useTab();

  const [name, setName] = useState('');
  const [imageMode, setImageMode] = useState('sticker');
  const [stickerType, setStickerType] = useState(null);
  const [customIcon, setCustomIcon] = useState(null);
  const [productPhoto, setProductPhoto] = useState(null);
  const [sizes, setSizes] = useState([{ name: '', price: '' }]);
  const [toppings, setToppings] = useState([]);
  const [selectedTabs, setSelectedTabs] = useState([activeTabId]);

  const toggleTab = (tabId) => {
    setSelectedTabs(prev =>
      prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId]
    );
  };

  const pickCustomIcon = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.5 });
    if (!r.canceled) { setCustomIcon(r.assets[0].uri); setStickerType(null); }
  };
  const pickProductPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.6 });
    if (!r.canceled) setProductPhoto(r.assets[0].uri);
  };
  const takeProductPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('','Necesitamos la cámara'); return; }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.6 });
    if (!r.canceled) setProductPhoto(r.assets[0].uri);
  };

  const addSize = () => setSizes([...sizes, { name: '', price: '' }]);
  const updateSize = (i, f, v) => { const n=[...sizes]; n[i][f]=v; setSizes(n); };
  const removeSize = (i) => setSizes(sizes.filter((_,idx)=>idx!==i));
  const addTopping = () => setToppings([...toppings, { name: '', price: '', isDefault: false }]);
  const updateTopping = (i, f, v) => { const n=[...toppings]; n[i][f]=v; setToppings(n); };
  const removeTopping = (i) => setToppings(toppings.filter((_,idx)=>idx!==i));

  const handleSave = async () => {
    if (currentWorker?.role !== 'admin') {
      Alert.alert('', 'Solo el administrador puede agregar productos'); return;
    }
    if (!name.trim()) { Alert.alert('','Ponele un nombre'); return; }
    if (!sizes[0]?.price) { Alert.alert('','Agregá al menos un precio'); return; }
    if (selectedTabs.length === 0) { Alert.alert('','Seleccioná al menos una pestaña'); return; }

    const newProduct = await addProduct({
      name: name.trim(),
      stickerType: imageMode==='sticker'?stickerType:null,
      customImage: imageMode==='sticker'?customIcon:productPhoto,
      imageMode,
      sizes: sizes.filter(s=>s.price).map(s=>({ name: s.name||'Normal', price: parseFloat(s.price)||0 })),
      toppings: toppings.filter(t=>t.name).map(t=>({ name: t.name, price: parseFloat(t.price)||0, isDefault: t.isDefault })),
    });

    if (newProduct && newProduct.id) {
      await addProductToMultipleTabs(selectedTabs, newProduct.id);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>NUEVO PRODUCTO</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tab assignment FIRST so user knows where it goes */}
        <Text style={[styles.label, { color: theme.textMuted }]}>AGREGAR A</Text>
        <View style={styles.tabsGrid}>
          {tabs.map(tab => {
            const sel = selectedTabs.includes(tab.id);
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabChip,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  sel && { backgroundColor: tab.color, borderColor: tab.color }]}
                onPress={() => toggleTab(tab.id)}
              >
                <Text style={styles.tabChipIcon}>{tab.icon}</Text>
                <Text style={[styles.tabChipText,
                  { color: theme.textSecondary },
                  sel && { color: tab.color === '#FFFFFF' ? '#000' : '#FFF' }]}>
                  {tab.name}
                </Text>
                {sel && <Text style={[styles.tabCheck, { color: tab.color === '#FFFFFF' ? '#000' : '#FFF' }]}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: theme.textMuted }]}>NOMBRE</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
          value={name} onChangeText={setName} placeholder="Ej: Pupusa de queso" placeholderTextColor={theme.textMuted} />

        <Text style={[styles.label, { color: theme.textMuted }]}>IMAGEN</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
            imageMode==='sticker' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setImageMode('sticker')}>
            <Text style={[styles.modeText, { color: theme.textSecondary },
              imageMode==='sticker' && { color: theme.accentText }]}>Ícono</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
            imageMode==='photo' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setImageMode('photo')}>
            <Text style={[styles.modeText, { color: theme.textSecondary },
              imageMode==='photo' && { color: theme.accentText }]}>Foto real</Text>
          </TouchableOpacity>
        </View>

        {imageMode==='sticker' && (
          <View style={styles.stickerRow}>
            {STICKER_OPTIONS.map(o => (
              <TouchableOpacity key={o.type}
                style={[styles.stickerBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  stickerType===o.type && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                onPress={() => { setStickerType(o.type); setCustomIcon(null); }}>
                <Text style={styles.stickerEmoji}>{o.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.stickerBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              customIcon && { backgroundColor: theme.accent, borderColor: theme.accent }]}
              onPress={pickCustomIcon}>
              {customIcon ? <Image source={{ uri: customIcon }} style={styles.miniPreview} /> : <Text style={{ fontSize: 22 }}>📤</Text>}
            </TouchableOpacity>
          </View>
        )}

        {imageMode==='photo' && (
          <View>
            {productPhoto ? (
              <View style={styles.photoWrap}>
                <Image source={{ uri: productPhoto }} style={styles.photoImg} />
                <TouchableOpacity style={[styles.photoRemove, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => setProductPhoto(null)}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoBtns}>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={takeProductPhoto}>
                  <Text style={{ fontSize: 32 }}>📸</Text>
                  <Text style={[styles.photoBtnText, { color: theme.textSecondary }]}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={pickProductPhoto}>
                  <Text style={{ fontSize: 32 }}>🖼️</Text>
                  <Text style={[styles.photoBtnText, { color: theme.textSecondary }]}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.label, { color: theme.textMuted }]}>TAMAÑOS Y PRECIOS</Text>
        {sizes.map((s,i) => (
          <View key={i} style={styles.fieldRow}>
            <TextInput style={[styles.input, { flex: 1, backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={s.name} onChangeText={v=>updateSize(i,'name',v)} placeholder="Tamaño" placeholderTextColor={theme.textMuted} />
            <View style={[styles.priceField, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
              <Text style={[styles.priceDollar, { color: theme.text }]}>$</Text>
              <TextInput style={[styles.priceInput, { color: theme.text }]}
                value={s.price} onChangeText={v=>updateSize(i,'price',v)} placeholder="0.00" keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
            {sizes.length > 1 && (
              <TouchableOpacity style={[styles.removeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={()=>removeSize(i)}>
                <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '600' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={[styles.addRowBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={addSize}>
          <Text style={[styles.addRowText, { color: theme.textMuted }]}>+ Tamaño</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.textMuted }]}>EXTRAS</Text>
        {toppings.map((t,i) => (
          <View key={i} style={styles.fieldRow}>
            <TextInput style={[styles.input, { flex: 1, backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={t.name} onChangeText={v=>updateTopping(i,'name',v)} placeholder="Extra" placeholderTextColor={theme.textMuted} />
            <View style={[styles.priceField, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
              <Text style={[styles.priceDollar, { color: theme.text }]}>$</Text>
              <TextInput style={[styles.priceInput, { color: theme.text }]}
                value={t.price} onChangeText={v=>updateTopping(i,'price',v)} placeholder="0.00" keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
            <TouchableOpacity style={[styles.removeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={()=>removeTopping(i)}>
              <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.addRowBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={addTopping}>
          <Text style={[styles.addRowText, { color: theme.textMuted }]}>+ Extra</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
          <Text style={[styles.saveText, { color: theme.accentText }]}>GUARDAR</Text>
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
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', borderWidth: 1 },
  tabsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
  },
  tabChipIcon: { fontSize: 14 },
  tabChipText: { fontSize: 13, fontWeight: '700' },
  tabCheck: { fontSize: 12, fontWeight: '900', marginLeft: 2 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  modeText: { fontSize: 14, fontWeight: '700' },
  stickerRow: { flexDirection: 'row', gap: 10 },
  stickerBtn: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stickerEmoji: { fontSize: 24 },
  miniPreview: { width: 36, height: 36, borderRadius: 8 },
  photoBtns: { flexDirection: 'row', gap: 10 },
  photoBtn: { flex: 1, borderRadius: 14, paddingVertical: 30, alignItems: 'center', gap: 8, borderWidth: 1 },
  photoBtnText: { fontSize: 12, fontWeight: '700' },
  photoWrap: { position: 'relative' },
  photoImg: { width: '100%', height: 180, borderRadius: 14, resizeMode: 'cover' },
  photoRemove: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  fieldRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  priceField: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, width: 100 },
  priceDollar: { fontSize: 16, fontWeight: '900' },
  priceInput: { fontSize: 16, fontWeight: '600', paddingVertical: 14, paddingLeft: 4, flex: 1 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  addRowBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4, borderWidth: 1, borderStyle: 'dashed' },
  addRowText: { fontSize: 13, fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, borderTopWidth: 1 },
  saveBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveText: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },
});