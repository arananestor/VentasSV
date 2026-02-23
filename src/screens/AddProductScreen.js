import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';

const STICKER_OPTIONS = [
  { type: 'minuta', label: '🍧' },
  { type: 'fresas', label: '🍓' },
  { type: 'chocobanano', label: '🍌' },
  { type: 'sorbete', label: '🍦' },
];

export default function AddProductScreen({ navigation }) {
  const { addProduct } = useApp();
  const [name, setName] = useState('');
  const [imageMode, setImageMode] = useState('sticker');
  const [stickerType, setStickerType] = useState(null);
  const [customIcon, setCustomIcon] = useState(null);
  const [productPhoto, setProductPhoto] = useState(null);
  const [sizes, setSizes] = useState([{ name: '', price: '' }]);
  const [toppings, setToppings] = useState([]);

  const pickCustomIcon = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) { setCustomIcon(result.assets[0].uri); setStickerType(null); }
  };

  const pickProductPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.6,
    });
    if (!result.canceled) setProductPhoto(result.assets[0].uri);
  };

  const takeProductPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('', 'Necesitamos la cámara'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.6,
    });
    if (!result.canceled) setProductPhoto(result.assets[0].uri);
  };

  const addSize = () => setSizes([...sizes, { name: '', price: '' }]);
  const updateSize = (i, field, val) => {
    const n = [...sizes]; n[i][field] = val; setSizes(n);
  };
  const removeSize = (i) => setSizes(sizes.filter((_, idx) => idx !== i));

  const addTopping = () => setToppings([...toppings, { name: '', price: '', isDefault: false }]);
  const updateTopping = (i, field, val) => {
    const n = [...toppings]; n[i][field] = val; setToppings(n);
  };
  const removeTopping = (i) => setToppings(toppings.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('', 'Ponele un nombre'); return; }
    if (!sizes[0]?.price) { Alert.alert('', 'Agregá al menos un precio'); return; }

    await addProduct({
      name: name.trim(),
      stickerType: imageMode === 'sticker' ? stickerType : null,
      customImage: imageMode === 'sticker' ? customIcon : productPhoto,
      imageMode,
      sizes: sizes.filter(s => s.price).map(s => ({
        name: s.name || 'Normal', price: parseFloat(s.price) || 0,
      })),
      toppings: toppings.filter(t => t.name).map(t => ({
        name: t.name, price: parseFloat(t.price) || 0, isDefault: t.isDefault,
      })),
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NUEVO PRODUCTO</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <Text style={styles.label}>NOMBRE</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Pupusa de queso"
          placeholderTextColor="#333"
        />

        {/* Image Mode */}
        <Text style={styles.label}>IMAGEN</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, imageMode === 'sticker' && styles.modeActive]}
            onPress={() => setImageMode('sticker')}
          >
            <Text style={[styles.modeText, imageMode === 'sticker' && styles.modeTextActive]}>
              Ícono
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, imageMode === 'photo' && styles.modeActive]}
            onPress={() => setImageMode('photo')}
          >
            <Text style={[styles.modeText, imageMode === 'photo' && styles.modeTextActive]}>
              Foto real
            </Text>
          </TouchableOpacity>
        </View>

        {imageMode === 'sticker' && (
          <View style={styles.stickerRow}>
            {STICKER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.type}
                style={[styles.stickerBtn, stickerType === opt.type && styles.stickerActive]}
                onPress={() => { setStickerType(opt.type); setCustomIcon(null); }}
              >
                <Text style={styles.stickerEmoji}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.stickerBtn, customIcon && styles.stickerActive]}
              onPress={pickCustomIcon}
            >
              {customIcon ? (
                <Image source={{ uri: customIcon }} style={styles.miniPreview} />
              ) : (
                <Text style={styles.uploadIcon}>📤</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {imageMode === 'photo' && (
          <View>
            {productPhoto ? (
              <View style={styles.photoWrap}>
                <Image source={{ uri: productPhoto }} style={styles.photoImg} />
                <TouchableOpacity style={styles.photoRemove} onPress={() => setProductPhoto(null)}>
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoBtns}>
                <TouchableOpacity style={styles.photoBtn} onPress={takeProductPhoto}>
                  <Text style={styles.photoBtnIcon}>📸</Text>
                  <Text style={styles.photoBtnText}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickProductPhoto}>
                  <Text style={styles.photoBtnIcon}>🖼️</Text>
                  <Text style={styles.photoBtnText}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Sizes */}
        <Text style={styles.label}>TAMAÑOS Y PRECIOS</Text>
        {sizes.map((s, i) => (
          <View key={i} style={styles.fieldRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={s.name}
              onChangeText={v => updateSize(i, 'name', v)}
              placeholder="Tamaño"
              placeholderTextColor="#333"
            />
            <View style={styles.priceField}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={s.price}
                onChangeText={v => updateSize(i, 'price', v)}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#333"
              />
            </View>
            {sizes.length > 1 && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeSize(i)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addRowBtn} onPress={addSize}>
          <Text style={styles.addRowText}>+ Tamaño</Text>
        </TouchableOpacity>

        {/* Toppings */}
        <Text style={styles.label}>EXTRAS</Text>
        {toppings.map((t, i) => (
          <View key={i} style={styles.fieldRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={t.name}
              onChangeText={v => updateTopping(i, 'name', v)}
              placeholder="Extra"
              placeholderTextColor="#333"
            />
            <View style={styles.priceField}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={t.price}
                onChangeText={v => updateTopping(i, 'price', v)}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#333"
              />
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeTopping(i)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addRowBtn} onPress={addTopping}>
          <Text style={styles.addRowText}>+ Extra</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>GUARDAR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  backText: { color: '#FFF', fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 3,
    marginTop: 24,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#222',
  },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  modeActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  modeText: { fontSize: 14, fontWeight: '700', color: '#888' },
  modeTextActive: { color: '#000' },
  stickerRow: { flexDirection: 'row', gap: 10 },
  stickerBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  stickerActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  stickerEmoji: { fontSize: 24 },
  uploadIcon: { fontSize: 22 },
  miniPreview: { width: 36, height: 36, borderRadius: 8 },
  photoBtns: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  photoBtnIcon: { fontSize: 32 },
  photoBtnText: { fontSize: 12, fontWeight: '700', color: '#888' },
  photoWrap: { position: 'relative' },
  photoImg: { width: '100%', height: 180, borderRadius: 14, resizeMode: 'cover' },
  photoRemove: {
    position: 'absolute', top: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#000', borderWidth: 1, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  priceField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#222',
    width: 100,
  },
  priceDollar: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  priceInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    paddingVertical: 14,
    paddingLeft: 4,
    flex: 1,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#555', fontSize: 14, fontWeight: '600' },
  addRowBtn: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
  },
  addRowText: { fontSize: 13, fontWeight: '700', color: '#555' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderColor: '#111',
  },
  saveBtn: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
});