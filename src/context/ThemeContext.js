import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const LIGHT_THEME = {
  mode: 'light',
  bg: '#F2F2F7',
  card: '#FFFFFF',
  cardBorder: '#E5E5EA',
  text: '#000000',
  textSecondary: '#8E8E93',
  textMuted: '#AEAEB2',
  accent: '#000000',
  accentText: '#FFFFFF',
  input: '#FFFFFF',
  inputBorder: '#D1D1D6',
  overlay: 'rgba(0,0,0,0.4)',
  danger: '#FF3B30',
  success: '#34C759',
  keypad: '#E5E5EA',
  keypadText: '#000000',
  statusBar: 'dark-content',
  headerBg: '#FFFFFF',
  dot: '#34C759',
};

export const DARK_THEME = {
  mode: 'dark',
  bg: '#000000',
  card: '#111111',
  cardBorder: '#222222',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  accent: '#FFFFFF',
  accentText: '#000000',
  input: '#111111',
  inputBorder: '#222222',
  overlay: 'rgba(0,0,0,0.85)',
  danger: '#FF3B30',
  success: '#4ECDC4',
  keypad: '#111111',
  keypadText: '#FFFFFF',
  statusBar: 'light-content',
  headerBg: '#000000',
  dot: '#4ECDC4',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DARK_THEME);

  useEffect(() => { loadTheme(); }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('ventasv_theme');
      if (saved === 'light') setTheme(LIGHT_THEME);
    } catch (e) {}
  };

  const toggleTheme = async () => {
    const next = theme.mode === 'dark' ? LIGHT_THEME : DARK_THEME;
    setTheme(next);
    await AsyncStorage.setItem('ventasv_theme', next.mode);
  };

  const isDark = theme.mode === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);