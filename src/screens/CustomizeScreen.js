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
import ProductSticker from '../components/ProductSticker';

export default function CustomizeScreen({ route, navigation }) {
  const { product } = route.params;
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedToppings, setSelectedToppings] = useState(
    product.toppings?.filter(t => t.isDefault).map(t => t.name) || []
  );
  const [quantity, setQuantity] = useState(1);

  const toggleTopping = (topping) => {
    setSelectedToppings(prev =>
      prev.includes(topping)
        ? prev.filter(t => t !== topping)
        : [...prev, topping]
    );
  };

  const calculateTotal = () => {
    const basePrice = product.sizes[selectedSize]?.price || 0;
    const toppingsPrice = product.toppings
      ?.filter(t => selectedToppings.includes(t.name) && !t.isDefault)
      .reduce((sum, t) => sum + t.price, 0) || 0;
    return (basePrice + toppingsPrice) * quantity;
  };

  const handleContinue = () => {
    const order = {
      product,
      size: product.sizes[selectedSize],
      toppings: selectedToppings,
      toppingsDetails: product.toppings?.filter(t => selectedToppings.includes(t.name)) || [],
      quantity,
      total: calculateTotal(),
    };
    navigation.navigate('Payment', { order });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Product Visual */}
        <View style={styles.heroSection}>
          {product.customImage ? (
            <Image
              source={{ uri: product.customImage }}
              style={styles.heroImage}
            />
          ) : (
            <ProductSticker
              type={product.stickerType}
              size={100}
            />
          )}
        </View>

        {/* Sizes */}
        {product.sizes.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TAMAÑO</Text>
            <View style={styles.sizesRow}>
              {product.sizes.map((size, index) => (
                <TouchableOpacity
                  key={size.name}
                  style={[
                    styles.sizeBtn,
                    selectedSize === index && styles.sizeBtnActive,
                  ]}
                  onPress={() => setSelectedSize(index)}
                >
                  <Text style={[
                    styles.sizeName,
                    selectedSize === index && styles.sizeNameActive,
                  ]}>
                    {size.name}
                  </Text>
                  <Text style={[
                    styles.sizePrice,
                    selectedSize === index && styles.sizePriceActive,
                  ]}>
                    ${size.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Toppings */}
        {product.toppings && product.toppings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXTRAS</Text>
            {product.toppings.map((topping) => {
              const isSelected = selectedToppings.includes(topping.name);
              return (
                <TouchableOpacity
                  key={topping.name}
                  style={[styles.toppingRow, isSelected && styles.toppingRowActive]}
                  onPress={() => toggleTopping(topping.name)}
                >
                  <View style={[styles.radio, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.toppingName, isSelected && styles.toppingNameActive]}>
                    {topping.name}
                  </Text>
                  <Text style={[styles.toppingPrice, isSelected && styles.toppingPriceActive]}>
                    {topping.price > 0 ? `+$${topping.price.toFixed(2)}` : 'Gratis'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CANTIDAD</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyValue}>{quantity}</Text>
            </View>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cobrarBtn} onPress={handleContinue}>
          <Text style={styles.cobrarText}>COBRAR</Text>
          <Text style={styles.cobrarPrice}>${calculateTotal().toFixed(2)}</Text>
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
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scroll: { paddingBottom: 120 },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 3,
    marginBottom: 12,
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBtn: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  sizeBtnActive: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  sizeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  sizeNameActive: { color: '#000' },
  sizePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 4,
  },
  sizePriceActive: { color: '#333' },
  toppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#222',
  },
  toppingRowActive: {
    borderColor: '#FFF',
    backgroundColor: '#1A1A1A',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#333',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: '#FFF' },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  toppingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  toppingNameActive: { color: '#FFF' },
  toppingPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  toppingPriceActive: { color: '#FFF' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  qtyBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 26,
    fontWeight: '300',
    color: '#FFF',
  },
  qtyDisplay: {
    minWidth: 60,
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
  },
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
  cobrarBtn: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cobrarText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
  cobrarPrice: {
    color: '#000',
    fontSize: 22,
    fontWeight: '900',
  },
});