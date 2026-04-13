import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTab } from '../context/TabContext';
import { useTheme } from '../context/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import CenterModal from '../components/CenterModal';
import ThemedTextInput from '../components/ThemedTextInput';

const TAB_COLORS = [
  '#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#F7DC6F',
  '#74B9FF', '#A29BFE', '#FD79A8', '#55EFC4',
];

export default function ManageTabsScreen({ navigation }) {
  const { tabs, addTab, updateTab, deleteTab } = useTab();
  const { theme } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('fixed');
  const [color, setColor] = useState('#FFFFFF');

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('', 'Ponele un nombre'); return; }
    await addTab(name.trim(), type, color);
    setShowAdd(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!name.trim()) { Alert.alert('', 'Ponele un nombre'); return; }
    await updateTab(showEdit, { name: name.trim(), type, color });
    setShowEdit(null);
    resetForm();
  };

  const handleDelete = (tab) => {
    if (tab.id === 'default') { Alert.alert('', 'No podés eliminar la pestaña principal'); return; }
    Alert.alert('Eliminar', `¿Eliminar "${tab.name}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí', style: 'destructive', onPress: () => deleteTab(tab.id) },
    ]);
  };

  const openEdit = (tab) => {
    setName(tab.name);
    setType(tab.type);
    setColor(tab.color);
    setShowEdit(tab.id);
  };

  const resetForm = () => {
    setName('');
    setType('fixed');
    setColor('#FFFFFF');
  };

  const renderForm = (onSave, saveLabel) => (
    <>
      <ThemedTextInput
        label="NOMBRE"
        value={name}
        onChangeText={setName}
        placeholder="Ej: Feria de Agosto"
        autoFocus
      />

      <Text style={[styles.formLabel, { color: theme.textMuted }]}>TIPO</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
            type === 'fixed' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          onPress={() => setType('fixed')}
        >
          <Text style={styles.typeEmoji}>📍</Text>
          <Text style={[styles.typeText, { color: theme.textSecondary },
            type === 'fixed' && { color: theme.accentText }]}>Fijo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
            type === 'event' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
          onPress={() => setType('event')}
        >
          <Text style={styles.typeEmoji}>🎪</Text>
          <Text style={[styles.typeText, { color: theme.textSecondary },
            type === 'event' && { color: theme.accentText }]}>Evento</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.formLabel, { color: theme.textMuted }]}>COLOR</Text>
      <View style={styles.colorGrid}>
        {TAB_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.colorBtn, { backgroundColor: c },
              color === c && styles.colorBtnActive]}
            onPress={() => setColor(c)}
          >
            {color === c && <Text style={styles.colorCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton label={saveLabel} onPress={onSave} />
      <TouchableOpacity style={styles.cancelBtn}
        onPress={() => { setShowAdd(false); setShowEdit(null); resetForm(); }}>
        <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancelar</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title="PESTAÑAS"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.accent }]}
            onPress={() => { resetForm(); setShowAdd(true); }}
          >
            <Text style={[styles.addBtnText, { color: theme.accentText }]}>+</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => openEdit(tab)}
            activeOpacity={0.8}
          >
            <View style={[styles.tabColorBar, { backgroundColor: tab.color }]} />
            <View style={styles.tabInfo}>
              <View style={styles.tabNameRow}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabName, { color: theme.text }]}>{tab.name}</Text>
              </View>
              <Text style={[styles.tabType, { color: theme.textMuted }]}>
                {tab.type === 'fixed' ? 'Punto fijo' : 'Evento'} · {tab.productIds.length} productos
              </Text>
            </View>
            <View style={styles.tabActions}>
              {tab.id !== 'default' && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: theme.bg }]}
                  onPress={() => handleDelete(tab)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <CenterModal
        visible={showAdd}
        onClose={() => { setShowAdd(false); resetForm(); }}
        title="NUEVA PESTAÑA"
      >
        {renderForm(handleAdd, 'CREAR')}
      </CenterModal>

      {/* Edit Modal */}
      <CenterModal
        visible={showEdit !== null}
        onClose={() => { setShowEdit(null); resetForm(); }}
        title="EDITAR PESTAÑA"
      >
        {renderForm(handleUpdate, 'GUARDAR')}
      </CenterModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  tabCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    marginBottom: 8, borderWidth: 1, overflow: 'hidden',
  },
  tabColorBar: { width: 6, alignSelf: 'stretch' },
  tabInfo: { flex: 1, padding: 16, paddingLeft: 14 },
  tabNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabIcon: { fontSize: 18 },
  tabName: { fontSize: 16, fontWeight: '800' },
  tabType: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  tabActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 14 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
  chevron: { fontSize: 20, fontWeight: '300' },
  formLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginTop: 16, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 14, gap: 8, borderWidth: 1,
  },
  typeEmoji: { fontSize: 18 },
  typeText: { fontSize: 14, fontWeight: '700' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorBtnActive: { borderColor: '#000', borderWidth: 3 },
  colorCheck: { fontSize: 16, fontWeight: '900', color: '#000' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
});