import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated,
  StyleSheet, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ProductSticker from '../components/ProductSticker';
import CartSheet from '../components/CartSheet';
import SimpleProductSheet from '../components/SimpleProductSheet';
import { resolveVisibleProducts, resolveProductPrice, resolveTabOrder } from '../utils/modeResolution';
import useResponsive from '../hooks/useResponsive';

export default function POSScreen({ navigation }) {
  const {
    products,
    cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount,
    currentMode,
  } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();
  const { columns, gridCardSize: CARD_SIZE, padding: PADDING, gap: CARD_GAP } = useResponsive();
  const {
    tabs, activeTabId, getActiveTab, getFilteredTabs,
    selectTab,
  } = useTab();

  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSimpleModal, setShowSimpleModal] = useState(false);

  const [headerHeight, setHeaderHeight] = useState(120);
  const headerMeasured = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const clamp = useMemo(
    () => Animated.diffClamp(scrollY, 0, headerHeight),
    [scrollY, headerHeight]
  );

  const headerTranslateY = clamp.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const miniOpacity = clamp.interpolate({
    inputRange: [headerHeight * 0.6, headerHeight],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleHeaderLayout = (e) => {
    if (!headerMeasured.current) {
      headerMeasured.current = true;
      setHeaderHeight(e.nativeEvent.layout.height);
    }
  };

  const activeTab = getActiveTab();
  const filteredTabs = resolveTabOrder(getFilteredTabs(), currentMode);
  const activeProducts = resolveVisibleProducts(products, currentMode);
  const existingIds = activeProducts.map(p => p.id);

  const tabProducts = activeTab.id === 'default' && activeTab.productIds.length === 0
    ? activeProducts
    : activeProducts.filter(p => activeTab.productIds.includes(p.id));

  const handleProductTap = (product) => {
    const isElaborado = product.type === 'elaborado' ||
      (product.ingredients?.length > 0) ||
      (product.flavors?.length > 0);

    if (isElaborado) {
      navigation.navigate('OrderBuilder', { product });
    } else {
      setSelectedProduct(product);
      setShowSimpleModal(true);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCart(false);
    navigation.navigate('Payment', { fromCart: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      {/* Mini header — fades in when full header slides out */}
      <Animated.View style={[styles.miniHeader, { backgroundColor: theme.bg, paddingHorizontal: PADDING, opacity: miniOpacity }]}>
        <View style={[styles.miniDot, { backgroundColor: theme.success }]} />
        <Text style={[styles.miniName, { color: theme.text }]} numberOfLines={1}>
          {currentWorker?.name}
        </Text>
        {currentMode && (
          <View style={[styles.miniMode, { borderColor: theme.cardBorder }]}>
            <Feather name="layers" size={10} color={theme.textMuted} />
            <Text style={[styles.miniModeText, { color: theme.textMuted }]} numberOfLines={1}>
              {currentMode.name}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Full header — absolute, slides up with translateY */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[styles.fullHeader, { backgroundColor: theme.bg, transform: [{ translateY: headerTranslateY }] }]}
      >
        <View style={[styles.headerRow, { paddingHorizontal: PADDING }]}>
          <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
          <Text style={[styles.workerName, { color: theme.text }]} numberOfLines={1}>
            {currentWorker?.name}
          </Text>
        </View>

        {currentMode && (
          <View style={[styles.modeIndicator, { borderColor: theme.cardBorder, marginLeft: PADDING }]}>
            <Feather name="layers" size={12} color={theme.textMuted} />
            <Text style={[styles.modeIndicatorText, { color: theme.textMuted }]}>
              Catálogo: {currentMode.name}
            </Text>
          </View>
        )}

        <View style={styles.tabBarWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
            {filteredTabs.map(tab => {
              const isActive = activeTabId === tab.id;
              const count = tab.productIds.filter(id => existingIds.includes(id)).length;
              return (
                <TouchableOpacity key={tab.id}
                  style={[styles.tabPill, {
                    backgroundColor: isActive ? tab.color : theme.card,
                    borderColor: isActive ? tab.color : theme.cardBorder,
                  }]}
                  onPress={() => selectTab(tab.id)}
                >
                  <Text style={[styles.tabPillName, {
                    color: isActive ? (tab.color === '#FFFFFF' ? '#000' : '#FFF') : theme.textSecondary,
                  }]} numberOfLines={1}>{tab.name}</Text>
                  {count > 0 && (
                    <View style={[styles.tabCount, { backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : theme.bg }]}>
                      <Text style={[styles.tabCountText, {
                        color: isActive ? (tab.color === '#FFFFFF' ? '#000' : '#FFF') : theme.textMuted,
                      }]}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {filteredTabs.length <= 1 && (
          <Text style={[styles.tabHint, { color: theme.textMuted }]}>
            Creá pestañas para organizar tus productos por categoría
          </Text>
        )}
      </Animated.View>

      {/* Product grid */}
      <Animated.ScrollView
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PADDING, gap: CARD_GAP, paddingTop: headerHeight + 4 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {tabProducts.map((product) => (
          <View key={product.id} style={{ width: CARD_SIZE, position: 'relative' }}>
            <TouchableOpacity
              style={[{ width: '100%', height: CARD_SIZE * 1.05, borderRadius: 18, borderWidth: 1, overflow: 'hidden' }, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              activeOpacity={0.8}
              onPress={() => handleProductTap(product)}
            >
              <View style={styles.cardInner}>
                {product.customImage ? (
                  <Image source={{ uri: product.customImage }} style={{ width: CARD_SIZE * 0.45, height: CARD_SIZE * 0.45, borderRadius: 14, resizeMode: 'cover' }} />
                ) : product.iconName ? (
                  <View style={[{ width: CARD_SIZE * 0.62, height: CARD_SIZE * 0.62, borderRadius: CARD_SIZE * 0.18, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: product.iconBgColor || '#000' }]}>
                    <MaterialCommunityIcons name={product.iconName} size={CARD_SIZE * 0.32} color="#fff" />
                  </View>
                ) : (
                  <ProductSticker type={product.stickerType} size={CARD_SIZE * 0.35} />
                )}
                <View style={styles.cardBottom}>
                  <Text style={[styles.productName, { color: theme.textSecondary }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productPrice, { color: theme.text }]}>
                    ${resolveProductPrice(product, 0, currentMode).toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: cartCount > 0 ? 100 : 20 }} />
      </Animated.ScrollView>

      {/* CARRITO FLOTANTE */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartFab, { backgroundColor: theme.accent }]}
          onPress={() => setShowCart(true)}
          activeOpacity={0.9}
        >
          <View style={styles.cartFabLeft}>
            <View style={[styles.cartBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={[styles.cartFabLabel, { color: theme.accentText }]}>Ver pedido</Text>
          </View>
          <Text style={[styles.cartFabTotal, { color: theme.accentText }]}>${cartTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      <CartSheet
        visible={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        cartTotal={cartTotal}
        onRemoveItem={removeFromCart}
        onClearCart={() => { clearCart(); setShowCart(false); }}
        onCheckout={handleCheckout}
        theme={theme}
      />

      <SimpleProductSheet
        visible={showSimpleModal}
        onClose={() => setShowSimpleModal(false)}
        product={selectedProduct}
        currentMode={currentMode}
        onAddToCart={addToCart}
        theme={theme}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  miniHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, zIndex: 20,
  },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniName: { fontSize: 14, fontWeight: '800' },
  miniMode: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  miniModeText: { fontSize: 10, fontWeight: '600', maxWidth: 100 },
  fullHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 12, paddingBottom: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  workerName: { fontSize: 17, fontWeight: '800' },
  modeIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  modeIndicatorText: { fontSize: 11, fontWeight: '600' },
  tabBarWrapper: { height: 48, marginBottom: 6 },
  tabBar: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5,
  },
  tabPillName: { fontSize: 13, fontWeight: '700' },
  tabCount: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  tabCountText: { fontSize: 10, fontWeight: '800' },
  tabManageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 40, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  tabManageText: { fontSize: 12, fontWeight: '700' },
  tabHint: {
    fontSize: 12, fontWeight: '500', textAlign: 'center',
    paddingHorizontal: 16, marginBottom: 6, marginTop: -2,
  },
  cardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 12 },
  cardBottom: { width: '100%', paddingHorizontal: 12, paddingVertical: 8, marginTop: 'auto' },
  productName: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  productPrice: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  cartFab: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  cartFabLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  cartFabLabel: { fontSize: 15, fontWeight: '800' },
  cartFabTotal: { fontSize: 18, fontWeight: '900' },
});
