import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheetModal from './BottomSheetModal';
import { ICON_CATALOG, CARD_COLORS, searchIcons, getIconBtnSize, getIconCols } from '../constants/productConstants';

export default function IconColorPicker({
  visible, onClose, selectedIcon, selectedColor, onSelect, title, theme, hideColors,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const ICON_BTN_SIZE = getIconBtnSize(screenWidth);
  const ICON_COLS = getIconCols(screenWidth);

  const [icon, setIcon] = useState(selectedIcon);
  const [color, setColor] = useState(selectedColor);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setIcon(selectedIcon);
      setColor(selectedColor);
      setSearch('');
    }
  }, [visible, selectedIcon, selectedColor]);

  const categories = searchIcons(search);

  const handleDone = () => {
    onSelect(icon, color);
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={title || 'ÍCONO Y COLOR'}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!hideColors && (
          <>
            {/* Preview */}
            <View style={styles.previewWrap}>
              <View style={[styles.preview, { backgroundColor: color }]}>
                {icon
                  ? <MaterialCommunityIcons name={icon} size={40} color="#fff" />
                  : <Feather name="image" size={28} color="rgba(255,255,255,0.35)" />
                }
              </View>
            </View>

            {/* Color row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {CARD_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.colorBtnSelected]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Feather name="check" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
          <Feather name="search" size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Buscar ícono..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Icon grid by category */}
        {categories.map(cat => (
          <View key={cat.category}>
            <Text style={[styles.categoryHeader, { color: theme.textMuted }]}>{cat.category}</Text>
            <View style={styles.iconGrid}>
              {cat.icons.map(item => {
                const isSelected = icon === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.iconBtn,
                      { width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, backgroundColor: isSelected ? color : theme.bg, borderColor: isSelected ? color : theme.cardBorder }]}
                    onPress={() => setIcon(item)}
                  >
                    <MaterialCommunityIcons name={item} size={26} color={isSelected ? '#fff' : theme.text} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {categories.length === 0 && (
          <Text style={[styles.noResults, { color: theme.textMuted }]}>No se encontraron íconos</Text>
        )}

        {/* Done button */}
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: theme.accent }]} onPress={handleDone}>
          <Text style={[styles.doneBtnText, { color: theme.accentText }]}>Listo</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  previewWrap: { alignItems: 'center', marginBottom: 16 },
  preview: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  colorRow: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  colorBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  colorBtnSelected: { borderWidth: 3, borderColor: '#fff' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  categoryHeader: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2,
    paddingHorizontal: 16, marginBottom: 8, marginTop: 8,
  },
  iconGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 8, marginBottom: 8,
  },
  iconBtn: {
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, margin: 4,
  },
  noResults: { textAlign: 'center', fontSize: 13, fontWeight: '500', paddingVertical: 20 },
  doneBtn: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
