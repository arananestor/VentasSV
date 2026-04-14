import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { printTicket } from '../utils/ticketPrinter';
import { buildTicketMessage } from '../utils/businessConfig';
import { migrateAllSalesV2toV3 } from '../utils/salesMigration';
import { newId } from '../utils/ids';
import { migrateCollectionToV4 } from '../utils/schemaMigrationV4';
import * as repository from '../data/repository';
import { migrateBusinessConfigToQentasFields } from '../utils/businessConfigMigration';
import { migrateToV5 } from '../utils/schemaMigrationV5';
import { createMode } from '../models/mode';

const WA_COLOR = '#25D366';
const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [modes, setModes] = useState([]);
  const [currentModeId, setCurrentModeIdState] = useState(null);

  // Snackbar global
  const [snackData, setSnackData] = useState(null);
  const snackAnim = useRef(new Animated.Value(120)).current;
  const snackOpacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const deviceId = await repository.init();

      const savedProducts = await AsyncStorage.getItem('ventasv_products');
      const savedSales = await AsyncStorage.getItem('ventasv_sales');
      let loadedProducts = savedProducts ? JSON.parse(savedProducts) : [];
      let loadedSales = savedSales ? JSON.parse(savedSales) : [];

      // v2→v3 migration (sales items[])
      const salesVersion = await AsyncStorage.getItem('ventasv_sales_schema_version');
      if (!salesVersion || Number(salesVersion) < 3) {
        loadedSales = migrateAllSalesV2toV3(loadedSales);
        await AsyncStorage.setItem('ventasv_sales_schema_version', '3');
      }

      // v3→v4 migration (entity envelope) — unified schema version
      const schemaVersion = await AsyncStorage.getItem('ventasv_schema_version');
      if (!schemaVersion || Number(schemaVersion) < 4) {
        loadedSales = migrateCollectionToV4(loadedSales, deviceId);
        loadedProducts = migrateCollectionToV4(loadedProducts, deviceId);
        await repository.save('sales', loadedSales);
        await repository.save('products', loadedProducts);

        // Migrate workers and tabs via their storage keys
        const savedWorkers = await AsyncStorage.getItem('ventasv_workers');
        if (savedWorkers) {
          const migratedWorkers = migrateCollectionToV4(JSON.parse(savedWorkers), deviceId);
          await repository.save('workers', migratedWorkers);
        }
        const savedTabs = await AsyncStorage.getItem('ventasv_tabs');
        if (savedTabs) {
          const migratedTabs = migrateCollectionToV4(JSON.parse(savedTabs), deviceId);
          await repository.save('tabs', migratedTabs);
        }
        // BusinessConfig qentas fields migration
        const rawBc = await AsyncStorage.getItem('business_bank_config');
        if (rawBc) {
          const bc = JSON.parse(rawBc);
          const migratedBc = migrateBusinessConfigToQentasFields(bc);
          await AsyncStorage.setItem('business_bank_config', JSON.stringify(migratedBc));
        }
        await AsyncStorage.setItem('ventasv_schema_version', '4');
      }

      // v4→v5 migration (Modes)
      const schemaV5 = await AsyncStorage.getItem('ventasv_schema_version');
      if (!schemaV5 || Number(schemaV5) < 5) {
        const existingModes = await repository.getAll('modes');
        const existingCurrentModeId = await repository.getCurrentModeId();
        const loadedTabs = await repository.getAll('tabs');
        const v5Result = migrateToV5({ products: loadedProducts, tabs: loadedTabs, existingModes, deviceId });
        if (existingModes.length === 0) {
          await repository.save('modes', v5Result.modes);
          if (!existingCurrentModeId && v5Result.currentModeId) {
            await repository.setCurrentModeId(v5Result.currentModeId);
          }
        }
        await AsyncStorage.setItem('ventasv_schema_version', '5');
      }

      const loadedModes = await repository.getAll('modes');
      const loadedCurrentModeId = await repository.getCurrentModeId();

      setProducts(loadedProducts);
      setSales(loadedSales);
      setModes(loadedModes);
      setCurrentModeIdState(loadedCurrentModeId);
    } catch (e) { console.log('Error loading data', e); }
  };

  const saveProducts = async (newProducts) => {
    setProducts(newProducts);
    await repository.save('products', newProducts);
  };

  const addProduct = async (product) => {
    const id = newId();
    const newProduct = { ...product, id };
    const enveloped = await repository.upsert('products', newProduct);
    setProducts(prev => [...prev, enveloped]);
    return enveloped;
  };

  const updateProduct = async (id, updates) => {
    await saveProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = async (id) => {
    await saveProducts(products.filter(p => p.id !== id));
  };

  // ── CARRITO ──────────────────────────────────────────────
  const addToCart = (item) => {
    const cartItem = { ...item, cartId: Date.now().toString() + '_' + Math.random() };
    setCart(prev => [...prev, cartItem]);
  };

  const removeFromCart = (cartId) => setCart(prev => prev.filter(i => i.cartId !== cartId));
  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((sum, i) => sum + i.total, 0);
  const cartCount = cart.length;

  // ── VENTAS ───────────────────────────────────────────────
  const addSale = async (sale) => {
    if (!sale.items || sale.items.length === 0) {
      throw new Error('Sale requires non-empty items[]');
    }
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
    const orderNumber = String(todaySales.length + 1).padStart(4, '0');
    const newSale = {
      ...sale,
      id: newId(),
      orderNumber,
      orderStatus: 'new',
      timestamp: new Date().toISOString(),
    };
    const enveloped = await repository.upsert('sales', newSale);
    setSales(prev => [...prev, enveloped]);
    return enveloped;
  };

  const updateSaleStatus = async (saleId, status) => {
    const updated = sales.map(s =>
      s.id === saleId ? {
        ...s,
        orderStatus: status,
        processingStartedAt: status === 'processing' ? new Date().toISOString() : s.processingStartedAt,
        completedAt: status === 'done' ? new Date().toISOString() : s.completedAt,
      } : s
    );
    setSales(updated);
    await repository.save('sales', updated);
  };

  const updateSaleItemUnit = async (saleId, itemIndex, unitIndex, cookLevel) => {
    const newSales = sales.map(s => {
      if (s.id !== saleId) return s;
      const newItems = s.items.map((item, idx) => {
        if (idx !== itemIndex) return item;
        const newUnits = item.units.map((u, uIdx) => uIdx !== unitIndex ? u : { ...u, cookLevel });
        return { ...item, units: newUnits };
      });
      return { ...s, items: newItems };
    });
    setSales(newSales);
    await repository.save('sales', newSales);
  };

  const getTodaySales = () => {
    const today = new Date().toDateString();
    return sales.filter(s => new Date(s.timestamp).toDateString() === today);
  };

  const getAllSales = () => sales;

  // ── MODOS ───────────────────────────────────────────────
  const currentMode = modes.find(m => m.id === currentModeId) || null;

  const setCurrentMode = async (modeId) => {
    await repository.setCurrentModeId(modeId);
    setCurrentModeIdState(modeId);
  };

  const createModeFromForm = async ({ name, description = '' }) => {
    const mode = createMode({ name, description, isDefault: false });
    const enveloped = await repository.upsert('modes', mode);
    setModes(prev => [...prev, enveloped]);
    return enveloped;
  };

  const updateMode = async (modeId, patch) => {
    const updated = modes.map(m =>
      m.id === modeId ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m
    );
    setModes(updated);
    await repository.save('modes', updated);
  };

  const deleteMode = async (modeId) => {
    const mode = modes.find(m => m.id === modeId);
    if (mode?.isDefault) throw new Error('No se puede eliminar el Modo Principal');
    if (currentModeId === modeId) throw new Error('No se puede eliminar el Modo activo');
    const filtered = modes.filter(m => m.id !== modeId);
    setModes(filtered);
    await repository.save('modes', filtered);
  };

  const cloneMode = async (modeId, newName) => {
    const source = modes.find(m => m.id === modeId);
    if (!source) throw new Error('Modo no encontrado');
    const overrides = {};
    for (const [k, v] of Object.entries(source.productOverrides || {})) {
      overrides[k] = { ...v };
    }
    const cloned = createMode({
      name: newName,
      description: source.description,
      productOverrides: overrides,
      tabOrder: [...source.tabOrder],
      isDefault: false,
    });
    const enveloped = await repository.upsert('modes', cloned);
    setModes(prev => [...prev, enveloped]);
    return enveloped;
  };

  // ── SNACKBAR GLOBAL ──────────────────────────────────────
  const showSnack = (data) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setSnackData(data);
    snackAnim.setValue(120);
    snackOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(snackAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
      Animated.timing(snackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    dismissTimer.current = setTimeout(() => hideSnack(), 2500);
  };

  const hideSnack = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.parallel([
      Animated.timing(snackAnim, { toValue: 120, duration: 220, useNativeDriver: true }),
      Animated.timing(snackOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setSnackData(null));
  };

  const handleSnackPrint = async () => {
    if (!snackData?.sales?.length) return;
    hideSnack();
    for (const sale of snackData.sales) { await printTicket(sale); }
  };

  const handleSnackWhatsApp = () => {
    if (!snackData?.sales?.length || !snackData?.waNumber) return;
    const sale = snackData.sales[0];
    const msg = buildTicketMessage(sale);
    Linking.openURL(`https://wa.me/503${snackData.waNumber}?text=${msg}`);
    hideSnack();
  };

  return (
    <AppContext.Provider value={{
      products, sales,
      addProduct, updateProduct, deleteProduct,
      addSale, getTodaySales, getAllSales, updateSaleStatus, updateSaleItemUnit,
      cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount,
      modes, currentModeId, currentMode,
      setCurrentMode, createModeFromForm, updateMode, deleteMode, cloneMode,
      showSnack,
    }}>
      {children}

      {/* SNACKBAR GLOBAL — flota sobre toda la app */}
      {snackData && (
        <Animated.View
          style={[
            snackStyles.snack,
            { transform: [{ translateY: snackAnim }], opacity: snackOpacity },
          ]}
        >
          <View style={snackStyles.left}>
            <View style={snackStyles.dot} />
            <View>
              <Text style={snackStyles.title}>Venta registrada</Text>
              <Text style={snackStyles.sub}>${snackData.total?.toFixed(2)}</Text>
            </View>
          </View>
          <View style={snackStyles.actions}>
            <TouchableOpacity style={snackStyles.btn} onPress={handleSnackPrint}>
              <MaterialCommunityIcons name="printer" size={16} color="#fff" />
            </TouchableOpacity>
            {snackData.waNumber && (
              <TouchableOpacity
                style={[snackStyles.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: WA_COLOR }]}
                onPress={handleSnackWhatsApp}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color={WA_COLOR} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={snackStyles.close} onPress={hideSnack}>
              <Feather name="x" size={16} color="#888" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </AppContext.Provider>
  );
}

const snackStyles = StyleSheet.create({
  snack: {
    position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 9999,
    backgroundColor: '#1C1C1E', borderRadius: 16, borderWidth: 1, borderColor: '#2C2C2E',
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#30D158' },
  title: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sub: { fontSize: 12, fontWeight: '500', marginTop: 1, color: '#888' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0A84FF', alignItems: 'center', justifyContent: 'center' },
  close: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
});

export const useApp = () => useContext(AppContext);