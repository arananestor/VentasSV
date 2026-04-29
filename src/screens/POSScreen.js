import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Image, StatusBar, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ProductSticker from '../components/ProductSticker';
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
  const [sizeQuantities, setSizeQuantities] = useState({});

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
      const init = {};
      product.sizes.forEach((_, i) => { init[i] = 0; });
      setSizeQuantities(init);
      setShowSimpleModal(true);
    }
  };

  const handleSimpleConfirm = () => {
    if (!selectedProduct) return;
    selectedProduct.sizes.forEach((size, i) => {
      const qty = sizeQuantities[i] || 0;
      if (qty > 0) {
        const resolvedPrice = resolveProductPrice(selectedProduct, i, currentMode);
        addToCart({
          product: selectedProduct,
          size,
          quantity: qty,
          units: [],
          extras: [],
          note: '',
          total: resolvedPrice * qty,
        });
      }
    });
    setShowSimpleModal(false);
  };

  const adjustSize = (sizeIdx, delta) => {
    setSizeQuantities(prev => ({
      ...prev,
      [sizeIdx]: Math.max(0, (prev[sizeIdx] || 0) + delta),
    }));
  };

  const simpleTotal = selectedProduct
    ? selectedProduct.sizes.reduce((sum, s, i) => sum + resolveProductPrice(selectedProduct, i, currentMode) * (sizeQuantities[i] || 0), 0)
    : 0;
  const simpleHasItems = Object.values(sizeQuantities).some(q => q > 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCart(false);
    navigation.navigate('Payment', { fromCart: true });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <View style={[styles.header, { paddingHorizontal: PADDING }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
          <Text style={[styles.workerName, { color: theme.text }]} numberOfLines={1}>
            {currentWorker?.name}
          </Text>
        </View>
      </View>

      {/* Filter tabs hidden for beta — reactivate post-beta */}
      {/* <View style={styles.filterRow}>...</View> */}

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
          {/* ManageTabs hidden for POS focus lockdown */}
        </ScrollView>
      </View>
      {filteredTabs.length <= 1 && (
        <Text style={[styles.tabHint, { color: theme.textMuted }]}>
          Creá pestañas para organizar tus productos por categoría
        </Text>
      )}

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: PADDING, gap: CARD_GAP, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
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
      </ScrollView>

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

      {/* MODAL CARRITO */}
      <Modal visible={showCart} transparent animationType="slide">
        <TouchableOpacity style={[styles.cartOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} activeOpacity={1} onPress={() => setShowCart(false)}>
          <TouchableOpacity style={[styles.cartSheet, { backgroundColor: theme.bg }]} activeOpacity={1} onPress={() => {}}>
            <View style={[styles.cartHandle, { backgroundColor: theme.cardBorder }]} />
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: theme.text }]}>PEDIDO ACTUAL</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Feather name="x" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
              {cart.map((item) => (
                <View key={item.cartId} style={[styles.cartItem, { borderColor: theme.cardBorder }]}>
                  <View style={styles.cartItemLeft}>
                    {item.product.iconName ? (
                      <View style={[styles.cartItemIcon, { backgroundColor: item.product.iconBgColor || '#000' }]}>
                        <MaterialCommunityIcons name={item.product.iconName} size={18} color="#fff" />
                      </View>
                    ) : (
                      <View style={[styles.cartItemIcon, { backgroundColor: theme.card }]}>
                        <Feather name="package" size={16} color={theme.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cartItemName, { color: theme.text }]}>{item.product.name}</Text>
                      <Text style={[styles.cartItemDetail, { color: theme.textMuted }]}>
                        {item.size?.name} · {item.quantity}x
                        {item.units?.length > 0 ? ` · ${item.units.length} uds` : ''}
                      </Text>
                      {item.note ? (
                        <Text style={[styles.cartItemNote, { color: theme.textMuted }]}>📝 {item.note}</Text>
                      ) : null}
                      {item.units?.length > 0 && item.units[0]?.ingredients?.length > 0 && (
                        <View style={styles.cartIngredientDots}>
                          {item.units.flatMap(u => u.ingredients || []).slice(0, 8).map((ing, i) => (
                            <View key={i} style={[styles.cartIngDot, { backgroundColor: ing.color || '#888' }]} />
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.cartItemRight}>
                    <Text style={[styles.cartItemPrice, { color: theme.text }]}>${item.total.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.cartId)}>
                      <Feather name="trash-2" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.cartFooter, { borderTopColor: theme.cardBorder }]}>
              <View style={styles.cartTotalRow}>
                <Text style={[styles.cartTotalLabel, { color: theme.textMuted }]}>TOTAL</Text>
                <Text style={[styles.cartTotalAmount, { color: theme.text }]}>${cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.cartActions}>
                <TouchableOpacity
                  style={[styles.cartClearBtn, { borderColor: theme.cardBorder }]}
                  onPress={() => { clearCart(); setShowCart(false); }}
                >
                  <Text style={[styles.cartClearText, { color: theme.textMuted }]}>Vaciar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cartCheckoutBtn, { backgroundColor: theme.accent, flex: 1 }]}
                  onPress={handleCheckout}
                >
                  <Text style={[styles.cartCheckoutText, { color: theme.accentText }]}>COBRAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL PRODUCTO SIMPLE */}
      <Modal visible={showSimpleModal} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.simpleOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setShowSimpleModal(false)}
        >
          <TouchableOpacity
            style={[styles.simpleSheet, { backgroundColor: theme.bg }]}
            activeOpacity={1}
            onPress={() => {}}
          >
            {selectedProduct && (
              <>
                <View style={[styles.simpleHandle, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.simpleHeader}>
                  {selectedProduct.iconName ? (
                    <View style={[styles.simpleIconWrap, { backgroundColor: selectedProduct.iconBgColor || '#000' }]}>
                      <MaterialCommunityIcons name={selectedProduct.iconName} size={26} color="#fff" />
                    </View>
                  ) : null}
                  <Text style={[styles.simpleProductName, { color: theme.text }]}>{selectedProduct.name}</Text>
                </View>
                <View style={styles.sizeRows}>
                  {selectedProduct.sizes.map((s, i) => {
                    const qty = sizeQuantities[i] || 0;
                    const active = qty > 0;
                    return (
                      <View key={i} style={[styles.sizeRow, {
                        backgroundColor: active ? theme.card : theme.bg,
                        borderColor: active ? theme.accent : theme.cardBorder,
                      }]}>
                        <View style={styles.sizeRowInfo}>
                          <Text style={[styles.sizeRowName, { color: theme.text }]}>{s.name || 'Normal'}</Text>
                          <Text style={[styles.sizeRowPrice, { color: theme.textMuted }]}>${resolveProductPrice(selectedProduct, i, currentMode).toFixed(2)}</Text>
                        </View>
                        <View style={styles.sizeRowCounter}>
                          <TouchableOpacity
                            style={[styles.counterBtn, {
                              backgroundColor: active ? theme.accent : theme.card,
                              borderColor: active ? theme.accent : theme.cardBorder,
                            }]}
                            onPress={() => adjustSize(i, -1)}
                          >
                            <Text style={[styles.counterBtnText, { color: active ? theme.accentText : theme.textMuted }]}>−</Text>
                          </TouchableOpacity>
                          <Text style={[styles.counterNum, { color: active ? theme.text : theme.textMuted }]}>{qty}</Text>
                          <TouchableOpacity
                            style={[styles.counterBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                            onPress={() => adjustSize(i, 1)}
                          >
                            <Text style={[styles.counterBtnText, { color: theme.accentText }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
                
                  <TouchableOpacity
                  style={[styles.simpleConfirmBtn, { backgroundColor: theme.accent },
                    !simpleHasItems && { opacity: 0.3 }]}
                  onPress={simpleHasItems ? handleSimpleConfirm : undefined}
                  activeOpacity={simpleHasItems ? 0.8 : 1}
                >
                  <Text style={[styles.simpleConfirmText, { color: theme.accentText }]}>Agregar al pedido</Text>
                  <Text style={[styles.simpleConfirmTotal, { color: theme.accentText }]}>
                    {simpleHasItems ? `$${simpleTotal.toFixed(2)}` : '--'}
                  </Text>
                </TouchableOpacity>
                
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, paddingBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
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
  // productImage moved inline for dynamic CARD_SIZE
  cardBottom: { width: '100%', paddingHorizontal: 12, paddingVertical: 8, marginTop: 'auto' },
  productName: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  productPrice: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  // iconBgCircle moved inline for dynamic CARD_SIZE
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
  cartOverlay: { flex: 1, justifyContent: 'flex-end' },
  cartSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
  cartHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  cartHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  cartTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 3 },
  cartList: { paddingHorizontal: 20, maxHeight: 400 },
  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 14, borderBottomWidth: 1,
  },
  cartItemLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  cartItemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cartItemName: { fontSize: 15, fontWeight: '700' },
  cartItemDetail: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  cartItemNote: { fontSize: 11, fontWeight: '500', marginTop: 4, fontStyle: 'italic' },
  cartIngredientDots: { flexDirection: 'row', gap: 4, marginTop: 6 },
  cartIngDot: { width: 10, height: 10, borderRadius: 5 },
  cartItemRight: { alignItems: 'flex-end', gap: 8 },
  cartItemPrice: { fontSize: 15, fontWeight: '900' },
  cartFooter: { padding: 20, borderTopWidth: 1 },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cartTotalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  cartTotalAmount: { fontSize: 32, fontWeight: '900' },
  cartActions: { flexDirection: 'row', gap: 10 },
  cartClearBtn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1 },
  cartClearText: { fontSize: 14, fontWeight: '700' },
  cartCheckoutBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  cartCheckoutText: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  simpleOverlay: { flex: 1, justifyContent: 'flex-end' },
  simpleSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 34 },
  simpleHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  simpleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  simpleIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  simpleProductName: { fontSize: 20, fontWeight: '900', flex: 1 },
  sizeRows: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  sizeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5,
  },
  sizeRowInfo: { flex: 1 },
  sizeRowName: { fontSize: 16, fontWeight: '700' },
  sizeRowPrice: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  sizeRowCounter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  counterBtnText: { fontSize: 20, fontWeight: '300', lineHeight: 24 },
  counterNum: { fontSize: 20, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  simpleConfirmBtn: {
    marginHorizontal: 16, borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24,
    alignItems: 'center',
  },
  simpleConfirmText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  simpleConfirmTotal: { fontSize: 20, fontWeight: '900' },
});