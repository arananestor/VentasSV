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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const {
    currentWorker, workers, isAdminMode,
    enterAdminMode, exitAdminMode, switchWorker,
    addWorker, removeWorker, updateWorkerPhoto,
  } = useAuth();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleAdminLogin = () => {
    if (enterAdminMode(adminPinInput)) {
      setShowAdminModal(false);
      setAdminPinInput('');
    } else {
      Alert.alert('', 'PIN incorrecto');
      setAdminPinInput('');
    }
  };

  const handleAddWorker = async () => {
    if (!newName.trim()) { Alert.alert('', 'Escribí el nombre'); return; }
    if (newPin.length < 4) { Alert.alert('', 'PIN de al menos 4 dígitos'); return; }
    const result = await addWorker(newName.trim(), newPin);
    if (result.error) { Alert.alert('', result.error); return; }
    setShowAddWorker(false);
    setNewName('');
    setNewPin('');
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
    if (!result.canceled) {
      await updateWorkerPhoto(currentWorker.id, result.assets[0].uri);
    }
  };

  const handleSwitchWorker = () => {
    Alert.alert('Cambiar turno', '¿Cerrar sesión y cambiar de cajero?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cambiar', onPress: () => switchWorker() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERFIL</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
            {currentWorker?.photo ? (
              <View>
                <Image source={{ uri: currentWorker.photo }} style={styles.photo} />
                <View style={styles.photoEdit}>
                  <Text style={styles.photoEditText}>📷</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.avatar, { backgroundColor: currentWorker?.color || '#FFF' }]}>
                <Text style={styles.avatarText}>
                  {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
                <View style={styles.photoEdit}>
                  <Text style={styles.photoEditText}>📷</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{currentWorker?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {currentWorker?.role === 'admin' ? 'ADMINISTRADOR' : 'CAJERO'}
            </Text>
          </View>
        </View>

        {/* Switch Worker */}
        <TouchableOpacity style={styles.optionBtn} onPress={handleSwitchWorker}>
          <Text style={styles.optionIcon}>🔄</Text>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Cambiar turno</Text>
            <Text style={styles.optionSub}>Entrar con otro cajero</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Admin Mode */}
        {!isAdminMode ? (
          <TouchableOpacity style={styles.optionBtn} onPress={() => setShowAdminModal(true)}>
            <Text style={styles.optionIcon}>🔐</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Modo administrador</Text>
              <Text style={styles.optionSub}>Gestionar equipo y configuración</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.adminBar}>
              <Text style={styles.adminBarText}>🔓 MODO ADMIN</Text>
              <TouchableOpacity onPress={exitAdminMode}>
                <Text style={styles.adminExit}>Salir</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>EQUIPO</Text>
            {workers.map(worker => (
              <View key={worker.id} style={styles.workerRow}>
                {worker.photo ? (
                  <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
                ) : (
                  <View style={[styles.workerAvatar, { backgroundColor: worker.color || '#333' }]}>
                    <Text style={styles.workerInitial}>
                      {worker.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerRole}>
                    {worker.role === 'admin' ? 'Admin' : 'Cajero'} · PIN: {'•'.repeat(worker.pin.length)}
                  </Text>
                </View>
                {worker.id !== 'admin' && (
                  <TouchableOpacity style={styles.workerRemove} onPress={() => handleRemoveWorker(worker)}>
                    <Text style={styles.workerRemoveText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addWorkerBtn} onPress={() => setShowAddWorker(true)}>
              <Text style={styles.addWorkerText}>+ Agregar empleado</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Admin PIN Modal */}
      <Modal visible={showAdminModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>PIN DE ADMIN</Text>
            <TextInput
              style={styles.modalInput}
              value={adminPinInput}
              onChangeText={setAdminPinInput}
              placeholder="Ingresá el PIN"
              placeholderTextColor="#333"
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              autoFocus
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleAdminLogin}>
              <Text style={styles.modalBtnText}>VERIFICAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowAdminModal(false); setAdminPinInput(''); }}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Worker Modal */}
      <Modal visible={showAddWorker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>NUEVO EMPLEADO</Text>
            <Text style={styles.modalLabel}>NOMBRE</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nombre"
              placeholderTextColor="#333"
              autoFocus
            />
            <Text style={styles.modalLabel}>PIN</Text>
            <TextInput
              style={styles.modalInput}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Mínimo 4 dígitos"
              placeholderTextColor="#333"
              keyboardType="numeric"
              maxLength={8}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleAddWorker}>
              <Text style={styles.modalBtnText}>AGREGAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowAddWorker(false); setNewName(''); setNewPin(''); }}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  backText: { color: '#FFF', fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  profileCard: {
    alignItems: 'center', paddingVertical: 30,
    borderBottomWidth: 1, borderColor: '#151515',
  },
  photo: { width: 80, height: 80, borderRadius: 40 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '900', color: '#000' },
  photoEdit: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#000',
  },
  photoEditText: { fontSize: 12 },
  profileName: { fontSize: 22, fontWeight: '900', color: '#FFF', marginTop: 14 },
  roleBadge: {
    backgroundColor: '#111', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
    borderWidth: 1, borderColor: '#222',
  },
  roleText: { fontSize: 10, fontWeight: '800', color: '#555', letterSpacing: 2 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16, padding: 18,
    marginTop: 12, borderWidth: 1, borderColor: '#222',
  },
  optionIcon: { fontSize: 22, marginRight: 14 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  optionSub: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 2 },
  chevron: { fontSize: 22, color: '#444', fontWeight: '300' },
  adminBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginTop: 12,
  },
  adminBarText: { fontSize: 13, fontWeight: '800', color: '#000', letterSpacing: 1 },
  adminExit: { fontSize: 13, fontWeight: '700', color: '#666' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#555',
    letterSpacing: 3, marginTop: 24, marginBottom: 12,
  },
  workerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 14, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: '#222',
  },
  workerPhoto: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  workerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  workerInitial: { fontSize: 16, fontWeight: '800', color: '#000' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  workerRole: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 2 },
  workerRemove: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  workerRemoveText: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
  addWorkerBtn: {
    backgroundColor: '#111', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#222',
    borderStyle: 'dashed', marginTop: 4,
  },
  addWorkerText: { fontSize: 14, fontWeight: '700', color: '#555' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  modal: {
    backgroundColor: '#111', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#222',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '900', color: '#FFF',
    letterSpacing: 3, textAlign: 'center', marginBottom: 20,
  },
  modalLabel: {
    fontSize: 11, fontWeight: '800', color: '#555',
    letterSpacing: 2, marginTop: 14, marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontWeight: '700', color: '#FFF',
    borderWidth: 1, borderColor: '#222', textAlign: 'center',
  },
  modalBtn: {
    backgroundColor: '#FFF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  modalBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  modalCancel: { paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { color: '#555', fontSize: 14, fontWeight: '600' },
});