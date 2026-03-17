import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Image,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const {
    currentWorker, workers, isAdminMode,
    enterAdminMode, exitAdminMode, switchWorker,
    addWorker, removeWorker, updateWorkerPhoto,
  } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleAdminLogin = () => {
    if (enterAdminMode(adminPinInput)) {
      setShowAdminModal(false); setAdminPinInput('');
    } else {
      Alert.alert('', 'PIN incorrecto'); setAdminPinInput('');
    }
  };

  const handleAddWorker = async () => {
    if (!newName.trim()) { Alert.alert('', 'Escribí el nombre'); return; }
    if (newPin.length < 4) { Alert.alert('', 'PIN de al menos 4 dígitos'); return; }
    const result = await addWorker(newName.trim(), newPin);
    if (result.error) { Alert.alert('', result.error); return; }
    setShowAddWorker(false); setNewName(''); setNewPin('');
    Alert.alert('✓ Listo', `${result.worker.name} agregado\nPIN: ${result.worker.pin}`);
  };

  const handleRemoveWorker = (worker) => {
    Alert.alert('Eliminar', `¿Eliminar a ${worker.name}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí', style: 'destructive', onPress: () => removeWorker(worker.id) },
    ]);
  };

  const handleChangePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) await updateWorkerPhoto(currentWorker.id, result.assets[0].uri);
  };

  const handleSwitchWorker = () => {
    Alert.alert('Cambiar turno', '¿Cerrar sesión y cambiar de cajero?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cambiar', onPress: () => switchWorker() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>  
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>PERFIL</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { borderColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
            {currentWorker?.photo ? (
              <View>
                <Image source={{ uri: currentWorker.photo }} style={styles.photo} />
                <View style={[styles.photoEdit, { backgroundColor: theme.card, borderColor: theme.bg }]}>
                  <Text style={styles.photoEditText}>📷</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.avatar, { backgroundColor: currentWorker?.color || theme.accent }]}>
                <Text style={[styles.avatarText, { color: theme.accentText }]}>
                  {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
                <View style={[styles.photoEdit, { backgroundColor: theme.card, borderColor: theme.bg }]}>
                  <Text style={styles.photoEditText}>📷</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: theme.text }]}>{currentWorker?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.roleText, { color: theme.textMuted }]}>
              {currentWorker?.role === 'admin' ? 'ADMINISTRADOR' : 'CAJERO'}
            </Text>
          </View>
        </View>

        {/* Theme Toggle */}
        <View style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={styles.optionIcon}>{isDark ? '🌙' : '☀️'}</Text>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>
              {isDark ? 'Modo oscuro' : 'Modo claro'}
            </Text>
            <Text style={[styles.optionSub, { color: theme.textMuted }]}>
              Cambiar apariencia
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#D1D1D6', true: '#555' }}
            thumbColor={isDark ? '#FFF' : '#000'}
          />
        </View>

        {/* configuración de cobro - solo admin */}
        {isAdminMode && (
            <TouchableOpacity
            style={[styles.optionBtn, {backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('BusinessConfig')}
            >
                <Text style={styles.optionIcon}>⚙️</Text>
                <View style={styles.optionInfo}>
                    <Text style={[styles.optionTitle, {color: theme.text }]}>configuración de cobro</Text>
                    <Text style={[ styles.optionSub, {color: theme.textMuted }]}>WhatsApp, banco, transferencias</Text> 
                </View>
                <Text style={[styles.optionSub, { color: theme.textMuted }]}>›</Text>
            </TouchableOpacity>
        )}

        {/* Switch Worker */}
        <TouchableOpacity
          style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={handleSwitchWorker}
        >
          <Text style={styles.optionIcon}>🔄</Text>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>Cambiar turno</Text>
            <Text style={[styles.optionSub, { color: theme.textMuted }]}>Entrar con otro cajero</Text>
          </View>
          <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* Admin Mode */}
        {!isAdminMode ? (
          <TouchableOpacity
            style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setShowAdminModal(true)}
          >
            <Text style={styles.optionIcon}>🔐</Text>
            <View style={styles.optionInfo}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Modo administrador</Text>
              <Text style={[styles.optionSub, { color: theme.textMuted }]}>Gestionar equipo</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={[styles.adminBar, { backgroundColor: theme.accent }]}>
              <Text style={[styles.adminBarText, { color: theme.accentText }]}>🔓 MODO ADMIN</Text>
              <TouchableOpacity onPress={exitAdminMode}>
                <Text style={[styles.adminExit, { color: theme.mode === 'dark' ? '#999' : '#666' }]}>Salir</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>EQUIPO</Text>
            {workers.map(worker => (
              <View key={worker.id} style={[styles.workerRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {worker.photo ? (
                  <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
                ) : (
                  <View style={[styles.workerAvatar, { backgroundColor: worker.color || '#333' }]}>
                    <Text style={styles.workerInitial}>{worker.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.workerInfo}>
                  <Text style={[styles.workerName, { color: theme.text }]}>{worker.name}</Text>
                  <Text style={[styles.workerRole, { color: theme.textMuted }]}>
                    {worker.role === 'admin' ? 'Admin' : 'Cajero'} · PIN: {'•'.repeat(worker.pin.length)}
                  </Text>
                </View>
                {worker.id !== 'admin' && (
                  <TouchableOpacity style={[styles.workerRemove, { backgroundColor: theme.bg }]} onPress={() => handleRemoveWorker(worker)}>
                    <Text style={styles.workerRemoveText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.addWorkerBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowAddWorker(true)}
            >
              <Text style={[styles.addWorkerText, { color: theme.textMuted }]}>+ Agregar empleado</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Admin PIN Modal */}
      <Modal visible={showAdminModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>PIN DE ADMIN</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={adminPinInput}
              onChangeText={setAdminPinInput}
              placeholder="Ingresá el PIN"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              autoFocus
            />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleAdminLogin}>
              <Text style={[styles.modalBtnText, { color: theme.accentText }]}>VERIFICAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowAdminModal(false); setAdminPinInput(''); }}>
              <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Worker Modal */}
      <Modal visible={showAddWorker} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>NUEVO EMPLEADO</Text>
            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>NOMBRE</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nombre"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>PIN</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Mínimo 4 dígitos"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              maxLength={8}
            />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleAddWorker}>
              <Text style={[styles.modalBtnText, { color: theme.accentText }]}>AGREGAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowAddWorker(false); setNewName(''); setNewPin(''); }}>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  backText: { fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  profileCard: {
    alignItems: 'center', paddingVertical: 30,
    borderBottomWidth: 1,
  },
  photo: { width: 80, height: 80, borderRadius: 40 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '900' },
  photoEdit: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  photoEditText: { fontSize: 12 },
  profileName: { fontSize: 22, fontWeight: '900', marginTop: 14 },
  roleBadge: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 8, borderWidth: 1,
  },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 18, marginTop: 12, borderWidth: 1,
  },
  optionIcon: { fontSize: 22, marginRight: 14 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  chevron: { fontSize: 22, fontWeight: '300' },
  adminBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, padding: 16, marginTop: 12,
  },
  adminBarText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  adminExit: { fontSize: 13, fontWeight: '700' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 12,
  },
  workerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 6, borderWidth: 1,
  },
  workerPhoto: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  workerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  workerInitial: { fontSize: 16, fontWeight: '800', color: '#000' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '700' },
  workerRole: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  workerRemove: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  workerRemoveText: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
  addWorkerBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderStyle: 'dashed', marginTop: 4,
  },
  addWorkerText: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modal: { borderRadius: 20, padding: 24, borderWidth: 1 },
  modalTitle: {
    fontSize: 16, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginBottom: 20,
  },
  modalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 14, marginBottom: 6 },
  modalInput: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontWeight: '700', borderWidth: 1, textAlign: 'center',
  },
  modalBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  modalBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  modalCancel: { paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
});