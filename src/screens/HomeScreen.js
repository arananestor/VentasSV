import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, SafeAreaView, Image, StatusBar, Alert, Modal, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import ProductSticker from '../components/ProductSticker';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const PADDING = 16;
const CARD_SIZE = (width - (PADDING * 2) - CARD_GAP) / 2;

export default function HomeScreen({ navigation }) {
  const { products, getTodaySales, deleteProduct } = useApp();
  const { currentWorker, verifyAdminPin } = useAuth();
  const { theme } = useTheme();
  const {
    tabs, activeTabId, filterType, getActiveTab, getFilteredTabs,
    selectTab, setFilterType, removeProductFromTab, removeProductFromAllTabs,
  } = useTab();

  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);

  const todaySales = getTodaySales();
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const activeTab = getActiveTab();
  const filteredTabs = getFilteredTabs();
  const existingIds = products.map(p => p.id);

  const tabProducts = activeTab.id === 'default' && activeTab.productIds.length === 0
    ? products
    : products.filter(p => activeTab.productIds.includes(p.id));

  const requestAdminAction = (action) => {
    if (currentWorker?.role === 'admin') { action(); }
    else { setPendingAction(() => action); setShowAdminPin(true); }
  };

  const handleAdminVerify = () => {
    if (verifyAdminPin(adminPinInput)) {
      setShowAdminPin(false); setAdminPinInput('');
      if (pendingAction) pendingAction();
      setPendingAction(null);
    } else { Alert.alert('', 'PIN incorrecto'); setAdminPinInput(''); }
  };

  const handleProductTap = (product) => {
    if (editMode) return;
    setSelectedProduct(product);
    setQty(1);
    setShowQtyModal(true);
  };

  const handleConfirmQty = () => {
    setShowQtyModal(false);
    const product = selectedProduct;
    const hasComponents = product.flavors && product.flavors.length > 0;
    if (hasComponents) {
      navigation.navigate('OrderBuilder', { product, initialQty: qty });
    } else {
      navigation.navigate('Customize', { product, initialQty: qty });
    }
  };

  const handleQuickPay = () => {
    setShowQtyModal(false);
    const product = selectedProduct;
    const size = product.sizes[0];
    navigation.navigate('Payment', {
      order: {
        product, size, quantity: qty,
        total: size.price * qty, units: [], toppings: [],
      },
    });
  };

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

  const filterIcons = {
    all: { name: 'view-grid', lib: 'mci' },
    fixed: { name: 'map-marker', lib: 'mci' },
    event: { name: 'calendar-star', lib: 'mci' },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>VENTA</Text>
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
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
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
      </View>

      {/* WORKER BAR */}
      <View style={styles.workerBar}>
        <View style={[styles.workerDot, { backgroundColor: theme.dot }]} />
        <Text style={[styles.workerText, { color: theme.textSecondary }]}>
          En turno: <Text style={[styles.workerName, { color: theme.text }]}>{currentWorker?.name}</Text>
        </Text>
      </View>

      {/* FILTROS */}
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

      {/* TABS */}
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

      {/* VENTAS HOY */}
      <TouchableOpacity
        style={[styles.salesBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => navigation.navigate('Sales')}
      >
        <View style={styles.salesInfo}>
          <Text style={[styles.salesToday, { color: theme.text }]}>${todayTotal.toFixed(2)}</Text>
          <Text style={[styles.salesCount, { color: theme.textSecondary }]}>{todaySales.length} ventas hoy</Text>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textMuted} />
      </TouchableOpacity>

      {/* GRID PRODUCTOS */}
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
      </ScrollView>

      {/* QTY MODAL */}
      <Modal visible={showQtyModal} transparent animationType="fade">
        <TouchableOpacity
          style={[styles.qtyOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setShowQtyModal(false)}
        >
          <View
            style={[styles.qtyModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onStartShouldSetResponder={() => true}
          >
            {selectedProduct && (
              <>
                <Text style={[styles.qtyProductName, { color: theme.text }]}>{selectedProduct.name}</Text>
                <Text style={[styles.qtyUnitPrice, { color: theme.textMuted }]}>
                  ${selectedProduct.sizes[0]?.price.toFixed(2)} c/u
                </Text>

                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                    onPress={() => setQty(Math.max(1, qty - 1))}
                  >
                    <Text style={[styles.qtyBtnText, { color: theme.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyNumber, { color: theme.text }]}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                    onPress={() => setQty(qty + 1)}
                  >
                    <Text style={[styles.qtyBtnText, { color: theme.text }]}>+</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.qtyTotal, { color: theme.text }]}>
                  ${(selectedProduct.sizes[0]?.price * qty).toFixed(2)}
                </Text>

                <TouchableOpacity
                  style={[styles.qtyMainBtn, { backgroundColor: theme.accent }]}
                  onPress={handleConfirmQty}
                >
                  <Text style={[styles.qtyMainBtnText, { color: theme.accentText }]}>
                    {selectedProduct.flavors?.length > 0 || selectedProduct.toppings?.length > 0
                      ? 'Personalizar' : 'Agregar al pedido'}
                  </Text>
                </TouchableOpacity>

                {selectedProduct.sizes.length <= 1 && !selectedProduct.flavors?.length && !selectedProduct.toppings?.length && (
                  <TouchableOpacity
                    style={[styles.qtyQuickPay, { borderColor: theme.cardBorder }]}
                    onPress={handleQuickPay}
                  >
                    <Text style={[styles.qtyQuickPayText, { color: theme.textSecondary }]}>Cobrar directo →</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ADMIN PIN MODAL */}
      <Modal visible={showAdminPin} transparent animationType="fade">
        <View style={[styles.adminOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.adminModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.adminIconWrap, { backgroundColor: theme.bg }]}>
              <Feather name="lock" size={24} color={theme.text} />
            </View>
            <Text style={[styles.adminTitle, { color: theme.text }]}>AUTORIZACIÓN</Text>
            <Text style={[styles.adminSub, { color: theme.textMuted }]}>PIN de administrador</Text>
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
          </View>
        </View>
      </Modal>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBtn: {
    height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, paddingHorizontal: 14,
  },
  editBtnText: { fontSize: 13, fontWeight: '700' },
  profileBtn: { overflow: 'hidden' },
  profilePhoto: { width: 44, height: 44, borderRadius: 22 },
  profileCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  profileInitial: { fontSize: 18, fontWeight: '900' },
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
  salesBtn: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14,
    marginHorizontal: PADDING, marginBottom: 8, borderWidth: 1,
  },
  salesInfo: { flex: 1 },
  salesToday: { fontSize: 24, fontWeight: '900' },
  salesCount: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: PADDING, gap: CARD_GAP, paddingTop: 4, paddingBottom: 100,
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
  qtyOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  qtyModal: { width: width * 0.78, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1 },
  qtyProductName: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  qtyUnitPrice: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 24, marginTop: 24 },
  qtyBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  qtyBtnText: { fontSize: 28, fontWeight: '300' },
  qtyNumber: { fontSize: 48, fontWeight: '900', minWidth: 60, textAlign: 'center' },
  qtyTotal: { fontSize: 28, fontWeight: '900', marginTop: 16 },
  qtyMainBtn: { width: '100%', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  qtyMainBtnText: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  qtyQuickPay: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8, borderWidth: 1 },
  qtyQuickPayText: { fontSize: 14, fontWeight: '700' },
  adminOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  adminModal: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: 'center' },
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