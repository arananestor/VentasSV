import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { newId } from '../utils/ids';
import * as repository from '../data/repository';

const TabContext = createContext();

const DEFAULT_TABS = [
  {
    id: 'default',
    name: 'Principal',
    type: 'fixed',
    color: '#FFFFFF',
    icon: '📍',
    productIds: [],
    createdAt: new Date().toISOString(),
  },
];

export function TabProvider({ children }) {
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState('default');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { loadTabs(); }, []);

  const loadTabs = async () => {
    try {
      const saved = await AsyncStorage.getItem('ventasv_tabs');
      const savedActive = await AsyncStorage.getItem('ventasv_active_tab');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setTabs(parsed);
          if (savedActive && parsed.find(t => t.id === savedActive)) {
            setActiveTabId(savedActive);
          } else {
            setActiveTabId(parsed[0].id);
          }
        }
      }
    } catch (e) { console.log('Tab load error', e); }
  };

  const saveTabs = async (newTabs) => {
    setTabs(newTabs);
    await repository.save('tabs', newTabs);
  };

  const selectTab = async (tabId) => {
    setActiveTabId(tabId);
    await AsyncStorage.setItem('ventasv_active_tab', tabId);
  };

  const addTab = async (name, type, color) => {
    const icons = { fixed: '📍', event: '🎪' };
    const newTab = {
      id: newId(),
      name,
      type,
      color: color || '#FFFFFF',
      icon: icons[type] || '📍',
      productIds: [],
      createdAt: new Date().toISOString(),
    };
    const newTabs = [...tabs, newTab];
    await saveTabs(newTabs);
    return newTab;
  };

  const updateTab = async (id, updates) => {
    if (updates.type) {
      const icons = { fixed: '📍', event: '🎪' };
      updates.icon = icons[updates.type] || '📍';
    }
    const newTabs = tabs.map(t => t.id === id ? { ...t, ...updates } : t);
    await saveTabs(newTabs);
  };

  const deleteTab = async (id) => {
    if (id === 'default') return { error: 'No podés eliminar la pestaña principal' };
    if (tabs.length <= 1) return { error: 'Necesitás al menos una pestaña' };
    const newTabs = tabs.filter(t => t.id !== id);
    await saveTabs(newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[0].id;
      setActiveTabId(newActive);
      await AsyncStorage.setItem('ventasv_active_tab', newActive);
    }
    return { success: true };
  };

  const addProductToTab = async (tabId, productId) => {
    const newTabs = tabs.map(t => {
      if (t.id === tabId) {
        if (t.productIds.includes(productId)) return t;
        return { ...t, productIds: [...t.productIds, productId] };
      }
      return t;
    });
    await saveTabs(newTabs);
  };

  const addProductToMultipleTabs = async (tabIds, productId) => {
    const newTabs = tabs.map(t => {
      if (tabIds.includes(t.id)) {
        if (t.productIds.includes(productId)) return t;
        return { ...t, productIds: [...t.productIds, productId] };
      }
      return t;
    });
    await saveTabs(newTabs);
  };

  const removeProductFromTab = async (tabId, productId) => {
    const newTabs = tabs.map(t => {
      if (t.id === tabId) {
        return { ...t, productIds: t.productIds.filter(id => id !== productId) };
      }
      return t;
    });
    await saveTabs(newTabs);
  };

  const removeProductFromAllTabs = async (productId) => {
    const newTabs = tabs.map(t => ({
      ...t,
      productIds: t.productIds.filter(id => id !== productId),
    }));
    await saveTabs(newTabs);
  };

  const getActiveTab = () => tabs.find(t => t.id === activeTabId) || tabs[0];

  const getFilteredTabs = () => {
    if (filterType === 'all') return tabs;
    return tabs.filter(t => t.type === filterType);
  };

  const getTabProductCount = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    return tab ? tab.productIds.length : 0;
  };

  return (
    <TabContext.Provider value={{
      tabs, activeTabId, filterType,
      getActiveTab, getFilteredTabs, getTabProductCount,
      selectTab, setFilterType,
      addTab, updateTab, deleteTab,
      addProductToTab, addProductToMultipleTabs,
      removeProductFromTab, removeProductFromAllTabs,
    }}>
      {children}
    </TabContext.Provider>
  );
}

export const useTab = () => useContext(TabContext);