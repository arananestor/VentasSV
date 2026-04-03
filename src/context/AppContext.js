import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]); // [{ id, product, size, quantity, units, extras, note, total }]

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem('ventasv_products');
      const savedSales = await AsyncStorage.getItem('ventasv_sales');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedSales) setSales(JSON.parse(savedSales));
    } catch (e) { console.log('Error loading data', e); }
  };

  const saveProducts = async (newProducts) => {
    setProducts(newProducts);
    await AsyncStorage.setItem('ventasv_products', JSON.stringify(newProducts));
  };

  const addProduct = async (product) => {
    const id = Date.now().toString();
    const newProduct = { ...product, id };
    await saveProducts([...products, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id, updates) => {
    await saveProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = async (id) => {
    await saveProducts(products.filter(p => p.id !== id));
  };

  // ── CARRITO ──────────────────────────────────────────────
  const addToCart = (item) => {
    const cartItem = {
      ...item,
      cartId: Date.now().toString() + '_' + Math.random(),
    };
    setCart(prev => [...prev, cartItem]);
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.total, 0);
  const cartCount = cart.length;

  // ── VENTAS ───────────────────────────────────────────────
  const addSale = async (sale) => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
    const orderNumber = String(todaySales.length + 1).padStart(4, '0');
    const newSale = {
      ...sale,
      id: Date.now().toString(),
      orderNumber,
      orderStatus: 'new',
      timestamp: new Date().toISOString(),
    };
    const newSales = [...sales, newSale];
    setSales(newSales);
    await AsyncStorage.setItem('ventasv_sales', JSON.stringify(newSales));
    return newSale;
  };

  const updateSaleStatus = async (saleId, status) => {
    const newSales = sales.map(s =>
      s.id === saleId ? {
        ...s,
        orderStatus: status,
        processingStartedAt: status === 'processing' ? new Date().toISOString() : s.processingStartedAt,
        completedAt: status === 'done' ? new Date().toISOString() : s.completedAt,
      } : s
    );
    setSales(newSales);
    await AsyncStorage.setItem('ventasv_sales', JSON.stringify(newSales));
  };

  const getTodaySales = () => {
    const today = new Date().toDateString();
    return sales.filter(s => new Date(s.timestamp).toDateString() === today);
  };

  const getAllSales = () => sales;

  return (
    <AppContext.Provider value={{
      products, sales,
      addProduct, updateProduct, deleteProduct,
      addSale, getTodaySales, getAllSales, updateSaleStatus,
      cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);