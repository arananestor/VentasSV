import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'Minuta',
    emoji: '🍧',
    stickerType: 'minuta',
    sizes: [
      { name: 'Pequeña', price: 1.00 },
      { name: 'Grande', price: 1.75 },
    ],
    toppings: [
      { name: 'Leche condensada', price: 0.00, isDefault: true },
      { name: 'Chamoy', price: 0.00, isDefault: true },
      { name: 'Extra jarabe', price: 0.25, isDefault: false },
    ],
  },
  {
    id: '2',
    name: 'Fresas con crema',
    emoji: '🍓',
    stickerType: 'fresas',
    sizes: [
      { name: 'Normal', price: 2.50 },
      { name: 'Grande', price: 3.50 },
    ],
    toppings: [
      { name: 'Chocolate', price: 0.50, isDefault: false },
      { name: 'Extra crema', price: 0.50, isDefault: false },
      { name: 'Granola', price: 0.50, isDefault: false },
    ],
  },
  {
    id: '3',
    name: 'Chocobanano',
    emoji: '🍌',
    stickerType: 'chocobanano',
    sizes: [
      { name: 'Normal', price: 1.25 },
    ],
    toppings: [
      { name: 'Extra chocolate', price: 0.50, isDefault: false },
      { name: 'Chispas', price: 0.25, isDefault: false },
      { name: 'Maní', price: 0.25, isDefault: false },
    ],
  },
  {
    id: '4',
    name: 'Sorbete artesanal',
    emoji: '🍦',
    stickerType: 'sorbete',
    sizes: [
      { name: '1 bola', price: 1.00 },
      { name: '2 bolas', price: 1.75 },
      { name: '3 bolas', price: 2.50 },
    ],
    toppings: [
      { name: 'Barquillo', price: 0.25, isDefault: false },
      { name: 'Sirope', price: 0.00, isDefault: true },
      { name: 'Chispas chocolate', price: 0.25, isDefault: false },
    ],
  },
];

export function AppProvider({ children }) {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [sales, setSales] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem('ventasv_products');
      const savedSales = await AsyncStorage.getItem('ventasv_sales');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedSales) setSales(JSON.parse(savedSales));
    } catch (e) {
      console.log('Error loading data', e);
    }
  };

  const saveProducts = async (newProducts) => {
    setProducts(newProducts);
    await AsyncStorage.setItem('ventasv_products', JSON.stringify(newProducts));
  };

  const addProduct = async (product) => {
    const newProducts = [...products, { ...product, id: Date.now().toString() }];
    await saveProducts(newProducts);
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

  return (
    <AppContext.Provider value={{
      products,
      sales,
      currentOrder,
      setCurrentOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      getTodaySales,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);