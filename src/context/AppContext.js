import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const DEFAULT_PRODUCTS = [];

export function AppProvider({ children }) {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [sales, setSales] = useState([]);

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
    const newProducts = [...products, newProduct];
    await saveProducts(newProducts);
    return newProduct;
  };

  const updateProduct = async (id, updates) => {
    const newProducts = products.map(p => p.id === id ? { ...p, ...updates } : p);
    await saveProducts(newProducts);
  };

  const deleteProduct = async (id) => {
    const newProducts = products.filter(p => p.id !== id);
    await saveProducts(newProducts);
  };

  const addSale = async (sale) => {
    const newSale = {
      ...sale,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    const newSales = [...sales, newSale];
    setSales(newSales);
    await AsyncStorage.setItem('ventasv_sales', JSON.stringify(newSales));
    return newSale;
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
      addSale, getTodaySales, getAllSales,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);