import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, Image, StatusBar, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ProductSticker from '../components/ProductSticker';
import CenterModal from '../components/CenterModal';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const PADDING = 16;
const CARD_SIZE = (width - (PADDING * 2) - CARD_GAP) / 2;

export default function HomeScreen({ navigation }) {
  const {
    products, deleteProduct,
    cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount,
  } = useApp();
  const { currentWorker, verifyOwnerPin } = useAuth();
  const { theme } = useTheme();
  const {
    tabs, activeTabId, filterType, getActiveTab, getFilteredTabs,
    selectTab, setFilterType, removeProductFromTab, removeProductFromAllTabs,
  } = useTab();

  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSimpleModal, setShowSimpleModal] = useState(false);
  const [sizeQuantities, setSizeQuantities] = useState({});

  const activeTab = getActiveTab();
  const filteredTabs = getFilteredTabs();
  const existingIds = products.map(p => p.id);

  const tabProducts = activeTab.id === 'default' && activeTab.productIds.length === 0
    ? products
    : products.filter(p => activeTab.productIds.includes(p.id));

  const requestAdminAction = (action) => {
    if (currentWorker?.role === 'owner' || currentWorker?.role === 'co-admin') { action(); }
    else { setPendingAction(() => action); setShowAdminPin(true); }
  };

  const handleAdminVerify = () => {
    if (verifyOwnerPin(adminPinInput)) {
      setShowAdminPin(false); setAdminPinInput('');
      if (pendingAction) pendingAction();
      setPendingAction(null);
    } else { Alert.alert('', 'PIN incorrecto'); setAdminPinInput(''); }
  };

  const handleProductTap = (product) => {
    if (editMode) return;
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
        addToCart({
          product: selectedProduct,
          size,
          quantity: qty,
          units: [],
          extras: [],
          note: '',
          total: size.price * qty,
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
    ? selectedProduct.sizes.reduce((sum, s, i) => sum + s.price * (sizeQuantities[i] || 0), 0)
    : 0;
  const simpleHasItems = Object.values(sizeQuantities).some(q => q > 0);

  const handleDeleteProduct = (product) => {
    if (activeTab.id !== 'default') {
      Alert.alert(product.name, '¿Qué querés hacer?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Quitar de aquí', onPress: () => removeProductFromTab(activeTab.id, product.id) },
        { text: 'Eliminar de todo', style: 'destructive', onPress: async () => {
          await removeProductFromAllTabs(product.id); await deleteProduct(product.id);
        }},
      ]);
    } else {
      Alert.alert(product.name, '¿Eliminar este producto?', [
        { text: 'No', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await removeProductFromAllTabs(product.id); await deleteProduct(product.id);
        }},
      ]);
    }
  };

  const toggleEditMode = () => {
    if (editMode) setEditMode(false);
    else requestAdminAction(() => setEditMode(true));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCart(false);
    navigation.navigate('Payment', { fromCart: true });
  };

  const filterIcons = {
    all: { name: 'view-grid' },
    fixed: { name: 'map-marker' },
    event: { name: 'calendar-star' },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>VENTASSV</Text>
          <Text style={[styles.logoSub, { color: theme.textMuted }]}>PUNTO DE VENTA</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.editBtn, {
              backgroundColor: editMode ? theme.accent : theme.card,
              borderColor: editMode ? theme.accent : theme.cardBorder,
            }]}
            onPress={toggleEditMode}
          >
            {editMode
              ? <Text style={[styles.editBtnText, { color: theme.accentText }]}>Listo</Text>
              : <Feather name="edit-2" size={16} color={theme.textMuted} />
            }
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.workerBar}>
        <View style={[styles.workerDot, { backgroundColor: theme.dot }]} />
        <Text style={[styles.workerText, { color: theme.textSecondary }]}>
          En turno: <Text style={[styles.workerName, { color: theme.text }]}>{currentWorker?.name}</Text>
        </Text>
      </View>

      <View style={styles.filterRow}>
        {['all', 'fixed', 'event'].map(f => (
          <TouchableOpacity key={f}
            style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              filterType === f && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setFilterType(f)}
          >
            <MaterialCommunityIcons
              name={filterIcons[f].name}
              size={14}
              color={filterType === f ? theme.accentText : theme.textSecondary}
            />
            <Text style={[styles.filterText, { color: theme.textSecondary },
              filterType === f && { color: theme.accentText }]}>
              {f === 'all' ? 'Todos' : f === 'fixed' ? 'Fijos' : 'Eventos'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => requestAdminAction(() => navigation.navigate('ManageTabs'))}
        >
          <Feather name="settings" size={14} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

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

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {tabProducts.map((product) => (
          <View key={product.id} style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              activeOpacity={0.8}
              onPress={() => handleProductTap(product)}
            >
              <View style={styles.cardInner}>
                {product.customImage ? (
                  <Image source={{ uri: product.customImage }} style={styles.productImage} />
                ) : product.iconName ? (
                  <View style={[styles.iconBgCircle, { backgroundColor: product.iconBgColor || '#000' }]}>
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
                    ${product.sizes[0]?.price.toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            {editMode && (
              <TouchableOpacity
                style={[styles.deleteOverlay, { backgroundColor: 'rgba(255,59,48,0.9)' }]}
                onPress={() => handleDeleteProduct(product)}
              >
                <Feather name="trash-2" size={22} color="#fff" />
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          activeOpacity={0.8}
          onPress={() => requestAdminAction(() => navigation.navigate('AddProduct'))}
        >
          <View style={[styles.addPlus, { backgroundColor: theme.mode === 'dark' ? '#222' : '#F0F0F0' }]}>
            <Feather name="plus" size={28} color={theme.textMuted} />
          </View>
        </TouchableOpacity>
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
                          <Text style={[styles.sizeRowPrice, { color: theme.textMuted }]}>${s.price.toFixed(2)}</Text>
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

      {/* ADMIN PIN */}
      <CenterModal
        visible={showAdminPin}
        onClose={() => { setShowAdminPin(false); setAdminPinInput(''); setPendingAction(null); }}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.adminIconWrap, { backgroundColor: theme.bg }]}>
            <Feather name="lock" size={24} color={theme.text} />
          </View>
          <Text style={[styles.adminTitle, { color: theme.text }]}>AUTORIZACIÓN</Text>
          <Text style={[styles.adminSub, { color: theme.textMuted }]}>PIN de administrador</Text>
        </View>
        <TextInput
          style={[styles.adminInput, {
            backgroundColor: theme.input,
            borderColor: theme.inputBorder,
            color: theme.text,
          }]}
          value={adminPinInput}
          onChangeText={setAdminPinInput}
          placeholder="PIN"
          placeholderTextColor={theme.textMuted}
          keyboardType="numeric"
          secureTextEntry
          maxLength={8}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.adminBtn, { backgroundColor: theme.accent }]}
          onPress={handleAdminVerify}
        >
          <Text style={[styles.adminBtnText, { color: theme.accentText }]}>VERIFICAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adminCancel}
          onPress={() => { setShowAdminPin(false); setAdminPinInput(''); setPendingAction(null); }}
        >
          <Text style={[styles.adminCancelText, { color: theme.textMuted }]}>Cancelar</Text>
        </TouchableOpacity>
      </CenterModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: PADDING, paddingTop: 12,
  },
  logo: { fontSize: 26, fontWeight: '900', letterSpacing: 5 },
  logoSub: { fontSize: 10, fontWeight: '600', letterSpacing: 4, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBtn: {
    height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, paddingHorizontal: 14,
  },
  editBtnText: { fontSize: 13, fontWeight: '700' },
  workerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PADDING, paddingTop: 10, paddingBottom: 6, gap: 8,
  },
  workerDot: { width: 8, height: 8, borderRadius: 4 },
  workerText: { fontSize: 13, fontWeight: '600' },
  workerName: { fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: PADDING, paddingBottom: 8 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: '700' },
  tabBarWrapper: { height: 48, marginBottom: 6 },
  tabBar: { paddingHorizontal: PADDING, alignItems: 'center', gap: 8 },
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
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: PADDING, gap: CARD_GAP, paddingTop: 4,
  },
  cardWrapper: { width: CARD_SIZE, position: 'relative' },
  productCard: {
    width: '100%', height: CARD_SIZE * 1.05,
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
  },
  cardInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 12 },
  productImage: { width: CARD_SIZE * 0.45, height: CARD_SIZE * 0.45, borderRadius: 14, resizeMode: 'cover' },
  cardBottom: { width: '100%', paddingHorizontal: 12, paddingVertical: 8, marginTop: 'auto' },
  productName: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  productPrice: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  deleteOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 10,
  },
  deleteText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  addCard: {
    width: CARD_SIZE, height: CARD_SIZE * 1.05, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  addPlus: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iconBgCircle: {
    width: CARD_SIZE * 0.62, height: CARD_SIZE * 0.62,
    borderRadius: CARD_SIZE * 0.18, alignItems: 'center', justifyContent: 'center',
  },
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
  adminIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  adminTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  adminSub: { fontSize: 13, fontWeight: '600', marginTop: 6, marginBottom: 20 },
  adminInput: {
    width: '100%', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, fontWeight: '700', borderWidth: 1, textAlign: 'center', letterSpacing: 6,
  },
  adminBtn: { width: '100%', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  adminBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  adminCancel: { paddingVertical: 14 },
  adminCancelText: { fontSize: 14, fontWeight: '600' },
});