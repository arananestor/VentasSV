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
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const {
    currentWorker, workers, isAdminMode,
    enterAdminMode, exitAdminMode, logout,
    addWorker, removeWorker, updateWorkerPin,
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
    if (newPin.length < 4) { Alert.alert('', 'El PIN debe tener al menos 4 dígitos'); return; }
    const result = await addWorker(newName.trim(), newPin);
    if (result.error) { Alert.alert('', result.error); return; }
    setShowAddWorker(false);
    setNewName('');
    setNewPin('');
    Alert.alert('', `${result.worker.name} agregado con PIN: ${result.worker.pin}`);
  };

  const handleRemoveWorker = (worker) => {
    Alert.alert(
      'Eliminar',
      `¿Eliminar a ${worker.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: () => removeWorker(worker.id),
        },
      ]
    );
  };

  const handleLogout = () => {
    logout();
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
        {/* Current Worker Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{currentWorker?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {currentWorker?.role === 'admin' ? 'ADMINISTRADOR' : 'CAJERO'}
            </Text>
          </View>
        </View>

        {/* Admin Mode */}
        {!isAdminMode ? (
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => setShowAdminModal(true)}
          >
            <Text style={styles.adminBtnIcon}>🔐</Text>
            <View style={styles.adminBtnInfo}>
              <Text style={styles.adminBtnTitle}>Modo administrador</Text>
              <Text style={styles.adminBtnSub}>Acceder a configuración avanzada</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.adminActive}>
              <Text style={styles.adminActiveText}>🔓 MODO ADMIN ACTIVO</Text>
              <TouchableOpacity onPress={exitAdminMode}>
                <Text style={styles.adminExitText}>Salir</Text>
              </TouchableOpacity>
            </View>

            {/* Workers List */}
            <Text style={styles.sectionLabel}>EQUIPO</Text>
            {workers.map(worker => (
              <View key={worker.id} style={styles.workerRow}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarText}>
                    {worker.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerRole}>
                    {worker.role === 'admin' ? 'Admin' : 'Cajero'} · PIN: {'•'.repeat(worker.pin.length)}
                  </Text>
                </View>
                {worker.id !== 'admin' && (
                  <TouchableOpacity
                    style={styles.workerRemove}
                    onPress={() => handleRemoveWorker(worker)}
                  >
                    <Text style={styles.workerRemoveText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.addWorkerBtn}
              onPress={() => setShowAddWorker(true)}
            >
              <Text style={styles.addWorkerText}>+ Agregar empleado</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => { setShowAdminModal(false); setAdminPinInput(''); }}
            >
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
              placeholder="Nombre del empleado"
              placeholderTextColor="#333"
              autoFocus
            />
            <Text style={styles.modalLabel}>PIN (mínimo 4 dígitos)</Text>
            <TextInput
              style={styles.modalInput}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="PIN del empleado"
              placeholderTextColor="#333"
              keyboardType="numeric"
              maxLength={8}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleAddWorker}>
              <Text style={styles.modalBtnText}>AGREGAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => { setShowAddWorker(false); setNewName(''); setNewPin(''); }}
            >
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderColor: '#151515',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#000' },
  profileName: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  roleBadge: {
    backgroundColor: '#111', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
    borderWidth: 1, borderColor: '#222',
  },
  roleText: { fontSize: 10, fontWeight: '800', color: '#555', letterSpacing: 2 },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16, padding: 18,
    marginTop: 20, borderWidth: 1, borderColor: '#222',
  },
  adminBtnIcon: { fontSize: 24, marginRight: 14 },
  adminBtnInfo: { flex: 1 },
  adminBtnTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  adminBtnSub: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 2 },
  chevron: { fontSize: 22, color: '#444', fontWeight: '300' },
  adminActive: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginTop: 20,
  },
  adminActiveText: { fontSize: 13, fontWeight: '800', color: '#000', letterSpacing: 1 },
  adminExitText: { fontSize: 13, fontWeight: '700', color: '#666' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#555',
    letterSpacing: 3, marginTop: 24, marginBottom: 12,
  },
  workerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 14, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: '#222',
  },
  workerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  workerAvatarText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  workerRole: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 2 },
  workerRemove: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  workerRemoveText: { color: '#FF3B30', fontSize: 14, fontWeight: '700' },
  addWorkerBtn: {
    backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#222', borderStyle: 'dashed',
    marginTop: 4,
  },
  addWorkerText: { fontSize: 14, fontWeight: '700', color: '#555' },
  logoutBtn: {
    marginTop: 30, paddingVertical: 18,
    alignItems: 'center', borderRadius: 14,
    borderWidth: 1, borderColor: '#222',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#FF3B30' },
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