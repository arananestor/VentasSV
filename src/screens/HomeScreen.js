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
import { useTheme } from '../context/ThemeContext';
import ProductSticker from '../components/ProductSticker';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const PADDING = 16;
const CARD_SIZE = (width - (PADDING * 2) - CARD_GAP) / 2;

export default function HomeScreen({ navigation }) {
  const { products, getTodaySales } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();
  const todaySales = getTodaySales();
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>VENTA</Text>
          <Text style={[styles.logoSub, { color: theme.textMuted }]}>PUNTO DE VENTA</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          {currentWorker?.photo ? (
            <Image source={{ uri: currentWorker.photo }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profileCircle, { backgroundColor: currentWorker?.color || theme.accent }]}>
              <Text style={[styles.profileInitial, { color: theme.accentText }]}>
                {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.workerBar}>
        <View style={[styles.workerDot, { backgroundColor: theme.dot }]} />
        <Text style={[styles.workerText, { color: theme.textSecondary }]}>
          En turno: <Text style={[styles.workerName, { color: theme.text }]}>{currentWorker?.name}</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.salesBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => navigation.navigate('Sales')}
      >
        <View style={styles.salesInfo}>
          <Text style={[styles.salesToday, { color: theme.text }]}>${todayTotal.toFixed(2)}</Text>
          <Text style={[styles.salesCount, { color: theme.textSecondary }]}>{todaySales.length} ventas hoy</Text>
        </View>
        <View style={[styles.salesArrow, { backgroundColor: theme.mode === 'dark' ? '#222' : '#F0F0F0' }]}>
          <Text style={[styles.salesArrowText, { color: theme.text }]}>›</Text>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
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
                <Text style={[styles.productName, { color: theme.textSecondary }]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={[styles.productPrice, { color: theme.text }]}>
                  ${product.sizes[0]?.price.toFixed(2)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.addCard, { borderColor: theme.textMuted }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <View style={[styles.addIconCircle, { backgroundColor: theme.card, borderColor: theme.textMuted }]}>
            <Text style={[styles.addIconText, { color: theme.textMuted }]}>+</Text>
          </View>
          <Text style={[styles.addText, { color: theme.textMuted }]}>Agregar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, paddingTop: 12,
  },
  logo: { fontSize: 30, fontWeight: '900', letterSpacing: 6 },
  logoSub: { fontSize: 10, fontWeight: '600', letterSpacing: 4, marginTop: 2 },
  profileBtn: { overflow: 'hidden' },
  profilePhoto: { width: 44, height: 44, borderRadius: 22 },
  profileCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitial: { fontSize: 18, fontWeight: '900' },
  workerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PADDING, paddingVertical: 10, gap: 8,
  },
  workerDot: { width: 8, height: 8, borderRadius: 4 },
  workerText: { fontSize: 13, fontWeight: '600' },
  workerName: { fontWeight: '800' },
  salesBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14,
    marginHorizontal: PADDING, marginBottom: 8, borderWidth: 1,
  },
  salesInfo: { flex: 1 },
  salesToday: { fontSize: 24, fontWeight: '900' },
  salesCount: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  salesArrow: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  salesArrowText: { fontSize: 20, fontWeight: '300' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: PADDING, gap: CARD_GAP, paddingTop: 8, paddingBottom: 100,
  },
  productCard: {
    width: CARD_SIZE, height: CARD_SIZE * 1.1,
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
  },
  cardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 16 },
  productImage: {
    width: CARD_SIZE * 0.5, height: CARD_SIZE * 0.5, borderRadius: 14, resizeMode: 'cover',
  },
  cardBottom: { width: '100%', paddingHorizontal: 12, paddingVertical: 10, marginTop: 'auto' },
  productName: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  productPrice: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  addCard: {
    width: CARD_SIZE, height: CARD_SIZE * 1.1, borderRadius: 18,
    borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  addIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  addIconText: { fontSize: 24, fontWeight: '300' },
  addText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});