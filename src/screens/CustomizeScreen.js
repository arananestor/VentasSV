import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ProductSticker from '../components/ProductSticker';

export default function CustomizeScreen({ route, navigation }) {
  const { product } = route.params;
  const { theme } = useTheme();
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedToppings, setSelectedToppings] = useState(
    product.toppings?.filter(t => t.isDefault).map(t => t.name) || []
  );
  const [quantity, setQuantity] = useState(1);

  const toggleTopping = (name) => {
    setSelectedToppings(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const calculateTotal = () => {
    const base = product.sizes[selectedSize]?.price || 0;
    const extras = product.toppings
      ?.filter(t => selectedToppings.includes(t.name) && !t.isDefault)
      .reduce((s, t) => s + t.price, 0) || 0;
    return (base + extras) * quantity;
  };

  const handleContinue = () => {
    navigation.navigate('Payment', {
      order: {
        product, size: product.sizes[selectedSize],
        toppings: selectedToppings,
        toppingsDetails: product.toppings?.filter(t => selectedToppings.includes(t.name)) || [],
        quantity, total: calculateTotal(),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{product.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          {product.customImage ? (
            <Image source={{ uri: product.customImage }} style={styles.heroImage} />
          ) : (
            <ProductSticker type={product.stickerType} size={100} />
          )}
        </View>

        {product.sizes.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>TAMAÑO</Text>
            <View style={styles.sizesRow}>
              {product.sizes.map((size, i) => (
                <TouchableOpacity
                  key={size.name}
                  style={[
                    styles.sizeBtn,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    selectedSize === i && { backgroundColor: theme.accent, borderColor: theme.accent },
                  ]}
                  onPress={() => setSelectedSize(i)}
                >
                  <Text style={[styles.sizeName, { color: theme.textSecondary }, selectedSize === i && { color: theme.accentText }]}>
                    {size.name}
                  </Text>
                  <Text style={[styles.sizePrice, { color: theme.textMuted }, selectedSize === i && { color: theme.accentText }]}>
                    ${size.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {product.toppings && product.toppings.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>EXTRAS</Text>
            {product.toppings.map((topping) => {
              const sel = selectedToppings.includes(topping.name);
              return (
                <TouchableOpacity
                  key={topping.name}
                  style={[
                    styles.toppingRow,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    sel && { borderColor: theme.accent },
                  ]}
                  onPress={() => toggleTopping(topping.name)}
                >
                  <View style={[styles.radio, { borderColor: theme.textMuted }, sel && { borderColor: theme.accent }]}>
                    {sel && <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />}
                  </View>
                  <Text style={[styles.toppingName, { color: theme.textSecondary }, sel && { color: theme.text }]}>
                    {topping.name}
                  </Text>
                  <Text style={[styles.toppingPrice, { color: theme.textMuted }, sel && { color: theme.text }]}>
                    {topping.price > 0 ? `+$${topping.price.toFixed(2)}` : 'Gratis'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>CANTIDAD</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={[styles.qtyBtnText, { color: theme.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyValue, { color: theme.text }]}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={[styles.qtyBtnText, { color: theme.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity style={[styles.cobrarBtn, { backgroundColor: theme.accent }]} onPress={handleContinue}>
          <Text style={[styles.cobrarText, { color: theme.accentText }]}>COBRAR</Text>
          <Text style={[styles.cobrarPrice, { color: theme.accentText }]}>${calculateTotal().toFixed(2)}</Text>
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
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  backText: { fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  scroll: { paddingBottom: 120 },
  heroSection: { alignItems: 'center', paddingVertical: 28 },
  heroImage: { width: 120, height: 120, borderRadius: 20, resizeMode: 'cover' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 12 },
  sizesRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1 },
  sizeName: { fontSize: 14, fontWeight: '700' },
  sizePrice: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  toppingRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 16, marginBottom: 6, borderWidth: 1,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    marginRight: 14, alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  toppingName: { flex: 1, fontSize: 15, fontWeight: '600' },
  toppingPrice: { fontSize: 13, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  qtyBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  qtyBtnText: { fontSize: 26, fontWeight: '300' },
  qtyValue: { fontSize: 40, fontWeight: '900', minWidth: 60, textAlign: 'center' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 34, borderTopWidth: 1,
  },
  cobrarBtn: {
    borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24,
  },
  cobrarText: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  cobrarPrice: { fontSize: 22, fontWeight: '900' },
});