import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ProductSticker from '../components/ProductSticker';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const PADDING = 16;
const CARD_SIZE = (width - (PADDING * 2) - CARD_GAP) / 2;

export default function HomeScreen({ navigation }) {
  const { products, getTodaySales } = useApp();
  const { currentWorker } = useAuth();
  const todaySales = getTodaySales();
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>VENTA</Text>
          <Text style={styles.logoSub}>PUNTO DE VENTA</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileInitial}>
            {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.salesBtn}
        onPress={() => navigation.navigate('Sales')}
      >
        <View style={styles.salesInfo}>
          <Text style={styles.salesToday}>${todayTotal.toFixed(2)}</Text>
          <Text style={styles.salesCount}>{todaySales.length} ventas hoy</Text>
        </View>
        <View style={styles.salesArrow}>
          <Text style={styles.salesArrowText}>›</Text>
        </View>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Customize', { product })}
          >
            <View style={styles.cardInner}>
              {product.customImage ? (
                <Image source={{ uri: product.customImage }} style={styles.productImage} />
              ) : (
                <ProductSticker type={product.stickerType} size={CARD_SIZE * 0.4} />
              )}
              <View style={styles.cardBottom}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productPrice}>${product.sizes[0]?.price.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <View style={styles.addIconCircle}>
            <Text style={styles.addIconText}>+</Text>
          </View>
          <Text style={styles.addText}>Agregar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING,
    paddingTop: 12,
  },
  logo: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: 6 },
  logoSub: { fontSize: 10, fontWeight: '600', color: '#555', letterSpacing: 4, marginTop: 2 },
  profileBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  profileInitial: { fontSize: 18, fontWeight: '900', color: '#000' },
  salesBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 14, padding: 14,
    marginHorizontal: PADDING, marginTop: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#222',
  },
  salesInfo: { flex: 1 },
  salesToday: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  salesCount: { fontSize: 12, fontWeight: '600', color: '#666', marginTop: 2 },
  salesArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
  },
  salesArrowText: { color: '#FFF', fontSize: 20, fontWeight: '300' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: PADDING, gap: CARD_GAP, paddingTop: 8, paddingBottom: 100,
  },
  productCard: {
    width: CARD_SIZE, height: CARD_SIZE * 1.1,
    backgroundColor: '#111', borderRadius: 18,
    borderWidth: 1, borderColor: '#222', overflow: 'hidden',
  },
  cardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 16 },
  productImage: {
    width: CARD_SIZE * 0.5, height: CARD_SIZE * 0.5, borderRadius: 14, resizeMode: 'cover',
  },
  cardBottom: { width: '100%', paddingHorizontal: 12, paddingVertical: 10, marginTop: 'auto' },
  productName: {
    fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1,
  },
  productPrice: { fontSize: 20, fontWeight: '900', color: '#FFF', marginTop: 2 },
  addCard: {
    width: CARD_SIZE, height: CARD_SIZE * 1.1, borderRadius: 18,
    borderWidth: 1, borderColor: '#333', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  addIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  addIconText: { color: '#555', fontSize: 24, fontWeight: '300' },
  addText: { color: '#444', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});