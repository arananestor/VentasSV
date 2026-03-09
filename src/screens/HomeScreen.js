import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, SafeAreaView, Image, StatusBar, Alert, Modal, TextInput,
} from 'react-native';
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
  const { products, deleteProduct } = useApp();
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

  const { getTodaySales } = useApp();
  const todaySales = getTodaySales();
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

  const activeTab = getActiveTab();
  const filteredTabs = getFilteredTabs();

  const tabProducts = activeTab.id === 'default' && activeTab.productIds.length === 0
    ? products
    : products.filter(p => activeTab.productIds.includes(p.id));

  const requestAdminAction = (action) => {
    if (currentWorker?.role === 'admin') {
      action();
    } else {
      setPendingAction(() => action);
      setShowAdminPin(true);
    }
  };

  const handleAdminVerify = () => {
    if (verifyAdminPin(adminPinInput)) {
      setShowAdminPin(false);
      setAdminPinInput('');
      if (pendingAction) pendingAction();
      setPendingAction(null);
    } else {
      Alert.alert('', 'PIN incorrecto');
      setAdminPinInput('');
    }
  };

  const handleAddProduct = () => {
    requestAdminAction(() => navigation.navigate('AddProduct'));
  };

  const handleDeleteProduct = (product) => {
    if (activeTab.id !== 'default') {
      Alert.alert(
        product.name,
        '¿Qué querés hacer?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Quitar de aquí',
            onPress: () => removeProductFromTab(activeTab.id, product.id),
          },
          {
            text: 'Eliminar de todo',
            style: 'destructive',
            onPress: async () => {
              await removeProductFromAllTabs(product.id);
              await deleteProduct(product.id);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        product.name,
        '¿Eliminar este producto por completo?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await removeProductFromAllTabs(product.id);
              await deleteProduct(product.id);
            },
          },
        ]
      );
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
      setEditMode(false);
    } else {
      requestAdminAction(() => setEditMode(true));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>VENTA</Text>
          <Text style={[styles.logoSub, { color: theme.textMuted }]}>PUNTO DE VENTA</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: editMode ? theme.danger : theme.card, borderColor: editMode ? theme.danger : theme.cardBorder }]}
            onPress={toggleEditMode}
          >
            <Text style={[styles.editBtnText, { color: editMode ? '#FFF' : theme.textMuted }]}>
              {editMode ? '✓' : '✏️'}
            </Text>
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
            <Text style={[styles.filterText, { color: theme.textSecondary },
              filterType === f && { color: theme.accentText }]}>
              {f === 'all' ? 'Todos' : f === 'fixed' ? '📍 Fijos' : '🎪 Eventos'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => requestAdminAction(() => navigation.navigate('ManageTabs'))}
        >
          <Text style={[styles.filterText, { color: theme.textMuted }]}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}>
          {filteredTabs.map(tab => {
            const isActive = activeTabId === tab.id;
            const count = tab.productIds.length;
            return (
              <TouchableOpacity key={tab.id}
                style={[styles.tabPill,
                  { backgroundColor: isActive ? tab.color : theme.card,
                    borderColor: isActive ? tab.color : theme.cardBorder }]}
                onPress={() => selectTab(tab.id)}
              >
                <Text style={styles.tabPillIcon}>{tab.icon}</Text>
                <Text style={[styles.tabPillName,
                  { color: isActive ? (tab.color === '#FFFFFF' ? '#000' : '#FFF') : theme.textSecondary }]}
                  numberOfLines={1}>
                  {tab.name}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabCount, { backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : theme.bg }]}>
                    <Text style={[styles.tabCountText,
                      { color: isActive ? (tab.color === '#FFFFFF' ? '#000' : '#FFF') : theme.textMuted }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
        {tabProducts.map((product) => (
          <View key={product.id} style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              activeOpacity={0.8}
              onPress={() => !editMode && navigation.navigate('Customize', { product })}
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
              <TouchableOpacity style={styles.deleteBadge} onPress={() => handleDeleteProduct(product)}>
                <Text style={styles.deleteBadgeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Add button — always visible, integrated */}
        <TouchableOpacity
          style={[styles.addCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          activeOpacity={0.8}
          onPress={handleAddProduct}
        >
          <View style={[styles.addPlus, { backgroundColor: theme.mode === 'dark' ? '#222' : '#F0F0F0' }]}>
            <Text style={[styles.addPlusText, { color: theme.textMuted }]}>+</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {editMode && (
        <View style={[styles.editBanner, { backgroundColor: theme.danger }]}>
          <Text style={styles.editBannerText}>MODO EDICIÓN — Tocá ✕ para eliminar</Text>
        </View>
      )}

      <Modal visible={showAdminPin} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={styles.modalIcon}>🔐</Text>
            <Text style={[styles.modalTitle, { color: theme.text }]}>AUTORIZACIÓN</Text>
            <Text style={[styles.modalSub, { color: theme.textMuted }]}>PIN de administrador</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={adminPinInput} onChangeText={setAdminPinInput}
              placeholder="PIN" placeholderTextColor={theme.textMuted}
              keyboardType="numeric" secureTextEntry maxLength={8} autoFocus
            />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleAdminVerify}>
              <Text style={[styles.modalBtnText, { color: theme.accentText }]}>VERIFICAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel}
              onPress={() => { setShowAdminPin(false); setAdminPinInput(''); setPendingAction(null); }}>
              <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancelar</Text>
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
  editBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  editBtnText: { fontSize: 16 },
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
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '700' },
  tabBarWrapper: { height: 48, marginBottom: 6 },
  tabBar: { paddingHorizontal: PADDING, alignItems: 'center', gap: 8 },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5,
  },
  tabPillIcon: { fontSize: 13 },
  tabPillName: { fontSize: 13, fontWeight: '700' },
  tabCount: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabCountText: { fontSize: 10, fontWeight: '800' },
  salesBtn: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14,
    marginHorizontal: PADDING, marginBottom: 8, borderWidth: 1,
  },
  salesInfo: { flex: 1 },
  salesToday: { fontSize: 24, fontWeight: '900' },
  salesCount: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  salesArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  salesArrowText: { fontSize: 20, fontWeight: '300' },
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
  deleteBadge: {
    position: 'absolute', top: -8, right: -8, zIndex: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  deleteBadgeText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  addCard: {
    width: CARD_SIZE, height: CARD_SIZE * 1.05, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  addPlus: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  addPlusText: { fontSize: 28, fontWeight: '300' },
  editBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 14, alignItems: 'center', paddingBottom: 34,
  },
  editBannerText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modal: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: 'center' },
  modalIcon: { fontSize: 36, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  modalSub: { fontSize: 13, fontWeight: '600', marginTop: 6, marginBottom: 20 },
  modalInput: {
    width: '100%', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, fontWeight: '700', borderWidth: 1, textAlign: 'center', letterSpacing: 6,
  },
  modalBtn: { width: '100%', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  modalBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  modalCancel: { paddingVertical: 14 },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
});