import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, Modal, Image, Switch,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, PUESTOS, PUESTO_ICONS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const {
    currentWorker, workers, isAdminMode,
    enterAdminMode, exitAdminMode, switchWorker,
    addWorker, removeWorker, updateWorkerPhoto,
  } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput]   = useState('');

  const [showAddWorker, setShowAddWorker]   = useState(false);
  const [newName, setNewName]               = useState('');
  const [newPin, setNewPin]                 = useState('');
  const [newDui, setNewDui]                 = useState('');
  const [puestoQuery, setPuestoQuery]       = useState('');
  const [puestoSelected, setPuestoSelected] = useState('');
  const [showPuestoList, setShowPuestoList] = useState(false);
  const [revealPinId, setRevealPinId]       = useState(null);

  const puestosFiltrados = useMemo(() =>
    PUESTOS.filter(p => p.toLowerCase().includes(puestoQuery.toLowerCase())),
    [puestoQuery]
  );

  const handleAdminLogin = () => {
    if (enterAdminMode(adminPinInput)) {
      setShowAdminModal(false); setAdminPinInput('');
    } else {
      Alert.alert('', 'PIN incorrecto'); setAdminPinInput('');
    }
  };

  const handleAddWorker = async () => {
    if (!newName.trim())   { Alert.alert('', 'Escribí el nombre'); return; }
    if (newPin.length < 4) { Alert.alert('', 'PIN de al menos 4 dígitos'); return; }
    if (!puestoSelected)   { Alert.alert('', 'Seleccioná un puesto'); return; }
    const result = await addWorker(newName.trim(), newPin, puestoSelected, newDui.trim());
    if (result.error) { Alert.alert('', result.error); return; }
    setShowAddWorker(false);
    setNewName(''); setNewPin(''); setNewDui('');
    setPuestoQuery(''); setPuestoSelected('');
  };

  const resetAddWorkerForm = () => {
    setShowAddWorker(false);
    setNewName(''); setNewPin(''); setNewDui('');
    setPuestoQuery(''); setPuestoSelected(''); setShowPuestoList(false);
  };

  const handleRemoveWorker = (worker) => {
    Alert.alert('Eliminar', `¿Eliminar a ${worker.name}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí', style: 'destructive', onPress: () => removeWorker(worker.id) },
    ]);
  };

  const handleChangePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.5 });
    if (!result.canceled) await updateWorkerPhoto(currentWorker.id, result.assets[0].uri);
  };

  const handleSwitchWorker = () => {
    Alert.alert('Cambiar turno', '¿Cerrar sesión y cambiar de trabajador?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cambiar', onPress: () => switchWorker() },
    ]);
  };

  const puestoLabel = currentWorker?.puesto || (currentWorker?.role === 'admin' ? 'Administrador' : 'Cajero');
  const puestoIcon  = PUESTO_ICONS[puestoLabel] || 'account';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>PERFIL</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* TARJETA TRABAJADOR ACTIVO */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={handleChangePhoto}
          activeOpacity={0.85}
        >
          {currentWorker?.photo ? (
            <Image source={{ uri: currentWorker.photo }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: currentWorker?.color || theme.accent }]}>
              <Text style={[styles.profileAvatarText, { color: theme.accentText }]}>
                {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{currentWorker?.name}</Text>
            <View style={[styles.puestoBadge, { backgroundColor: theme.bg }]}>
              <MaterialCommunityIcons name={puestoIcon} size={12} color={theme.textMuted} />
              <Text style={[styles.puestoText, { color: theme.textMuted }]}>
                {puestoLabel.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.cameraBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
            <Feather name="camera" size={14} color={theme.textMuted} />
          </View>
        </TouchableOpacity>

        {/* OPCIONES GENERALES */}
        <View style={styles.group}>

          {/* Tema */}
          <View style={[styles.optionRow, styles.optionRowFirst, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.optionIconBox, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
              <Feather name={isDark ? 'moon' : 'sun'} size={15} color={theme.text} />
            </View>
            <View style={styles.optionTexts}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Text>
              <Text style={[styles.optionSub, { color: theme.textMuted }]}>Cambiar apariencia</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D1D6', true: theme.accent }}
              thumbColor="#FFF"
            />
          </View>

          {/* Cambiar turno */}
          <TouchableOpacity
            style={[styles.optionRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={handleSwitchWorker}
          >
            <View style={[styles.optionIconBox, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
              <Feather name="refresh-cw" size={15} color={theme.text} />
            </View>
            <View style={styles.optionTexts}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Cambiar turno</Text>
              <Text style={[styles.optionSub, { color: theme.textMuted }]}>Entrar con otro trabajador</Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Modo admin (solo si no está activo) */}
          {!isAdminMode && (
            <TouchableOpacity
              style={[styles.optionRow, styles.optionRowLast, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowAdminModal(true)}
            >
              <View style={[styles.optionIconBox, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                <Feather name="lock" size={15} color={theme.text} />
              </View>
              <View style={styles.optionTexts}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Modo administrador</Text>
                <Text style={[styles.optionSub, { color: theme.textMuted }]}>Gestionar equipo y configuración</Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* SECCIÓN ADMIN */}
        {isAdminMode && (
          <View>
            {/* Barra admin activo */}
            <View style={[styles.adminBar, { backgroundColor: theme.accent }]}>
              <View style={styles.adminBarLeft}>
                <MaterialCommunityIcons name="shield-check" size={15} color={theme.accentText} />
                <Text style={[styles.adminBarText, { color: theme.accentText }]}>MODO ADMIN ACTIVO</Text>
              </View>
              <TouchableOpacity onPress={exitAdminMode}>
                <Text style={[styles.adminExit, { color: theme.accentText, opacity: 0.65 }]}>Salir</Text>
              </TouchableOpacity>
            </View>

            {/* Config de cobro */}
            <View style={styles.group}>
              <TouchableOpacity
                style={[styles.optionRow, styles.optionRowFirst, styles.optionRowLast, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => navigation.navigate('BusinessConfig')}
              >
                <View style={[styles.optionIconBox, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                  <Feather name="settings" size={15} color={theme.text} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>Configuración de cobro</Text>
                  <Text style={[styles.optionSub, { color: theme.textMuted }]}>Banco, WhatsApp para tickets al cliente</Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Equipo */}
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>EQUIPO</Text>

            <View style={styles.group}>
              {workers.map((worker, index) => {
                const wPuesto  = worker.puesto || (worker.role === 'admin' ? 'Administrador' : 'Cajero');
                const wIcon    = PUESTO_ICONS[wPuesto] || 'account';
                const pinVisible = revealPinId === worker.id;
                const isFirst  = index === 0;
                const isLast   = index === workers.length - 1;
                return (
                  <View
                    key={worker.id}
                    style={[
                      styles.workerCard,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      isFirst && styles.optionRowFirst,
                      isLast  && styles.optionRowLast,
                    ]}
                  >
                    {/* Fila superior: avatar + info + eliminar */}
                    <View style={styles.workerTop}>
                      {worker.photo ? (
                        <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
                      ) : (
                        <View style={[styles.workerAvatar, { backgroundColor: worker.color || theme.accent }]}>
                          <Text style={styles.workerInitial}>
                            {worker.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.workerInfo}>
                        <Text style={[styles.workerName, { color: theme.text }]}>{worker.name}</Text>
                        <View style={styles.workerPuestoRow}>
                          <MaterialCommunityIcons name={wIcon} size={11} color={theme.textMuted} />
                          <Text style={[styles.workerPuesto, { color: theme.textMuted }]}>{wPuesto}</Text>
                        </View>
                      </View>
                      {worker.id !== 'admin' && (
                        <TouchableOpacity
                          style={[styles.deleteBtn, { backgroundColor: theme.bg }]}
                          onPress={() => handleRemoveWorker(worker)}
                        >
                          <Feather name="trash-2" size={14} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Fila inferior: DUI + PIN */}
                    <View style={[styles.workerDetails, { borderTopColor: theme.cardBorder }]}>
                      <View style={styles.workerDetailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>DUI</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          {worker.dui || '—'}
                        </Text>
                      </View>
                      <View style={[styles.detailDivider, { backgroundColor: theme.cardBorder }]} />
                      <View style={styles.workerDetailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>PIN</Text>
                        <TouchableOpacity
                          style={styles.pinRow}
                          onPress={() => setRevealPinId(pinVisible ? null : worker.id)}
                        >
                          <Text style={[styles.detailValue, { color: theme.text }]}>
                            {pinVisible ? worker.pin : '•'.repeat(worker.pin.length)}
                          </Text>
                          <Feather
                            name={pinVisible ? 'eye-off' : 'eye'}
                            size={13}
                            color={theme.textMuted}
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Botón agregar empleado */}
            <TouchableOpacity
              style={[styles.addWorkerBtn, { borderColor: theme.cardBorder }]}
              onPress={() => setShowAddWorker(true)}
            >
              <Feather name="user-plus" size={16} color={theme.textMuted} />
              <Text style={[styles.addWorkerText, { color: theme.textMuted }]}>Agregar empleado</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL: PIN ADMIN ─────────────────────────────────── */}
      <Modal visible={showAdminModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.modalIconWrap, { backgroundColor: theme.bg }]}>
                  <Feather name="lock" size={22} color={theme.text} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>MODO ADMINISTRADOR</Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>Ingresá tu PIN de admin</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                  value={adminPinInput}
                  onChangeText={setAdminPinInput}
                  placeholder="PIN"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={8}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                  onPress={handleAdminLogin}
                >
                  <Text style={[styles.modalBtnText, { color: theme.accentText }]}>VERIFICAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => { setShowAdminModal(false); setAdminPinInput(''); }}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── MODAL: AGREGAR EMPLEADO ───────────────────────────── */}
      <Modal visible={showAddWorker} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.addWorkerSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.sheetHandle, { backgroundColor: theme.cardBorder }]} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>NUEVO EMPLEADO</Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ gap: 10 }}
                >
                  {/* Nombre */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>NOMBRE</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Nombre completo"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="words"
                  />

                  {/* DUI */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>DUI</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                    value={newDui}
                    onChangeText={setNewDui}
                    placeholder="00000000-0"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    maxLength={10}
                  />

                  {/* PIN */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PIN</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder="Mínimo 4 dígitos"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={8}
                  />

                  {/* PUESTO — autocomplete */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PUESTO</Text>
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View>
                      <View style={[styles.puestoInputWrap, { backgroundColor: theme.input, borderColor: puestoSelected ? theme.accent : theme.inputBorder }]}>
                        {puestoSelected
                          ? <MaterialCommunityIcons name={PUESTO_ICONS[puestoSelected] || 'account'} size={16} color={theme.text} style={{ marginRight: 8 }} />
                          : <Feather name="search" size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
                        }
                        <TextInput
                          style={[styles.puestoInput, { color: theme.text }]}
                          value={puestoSelected || puestoQuery}
                          onChangeText={(t) => { setPuestoQuery(t); setPuestoSelected(''); setShowPuestoList(true); }}
                          onFocus={() => setShowPuestoList(true)}
                          placeholder="Buscar puesto..."
                          placeholderTextColor={theme.textMuted}
                        />
                        {(puestoSelected || puestoQuery) ? (
                          <TouchableOpacity onPress={() => { setPuestoQuery(''); setPuestoSelected(''); setShowPuestoList(true); }}>
                            <Feather name="x" size={15} color={theme.textMuted} />
                          </TouchableOpacity>
                        ) : (
                          <Feather name="chevron-down" size={15} color={theme.textMuted} />
                        )}
                      </View>

                      {/* Lista desplegable */}
                      {showPuestoList && !puestoSelected && (
                        <View style={[styles.puestoDropdown, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                          {puestosFiltrados.length > 0 ? puestosFiltrados.map(p => (
                            <TouchableOpacity
                              key={p}
                              style={[styles.puestoOption, { borderBottomColor: theme.cardBorder }]}
                              onPress={() => { setPuestoSelected(p); setPuestoQuery(''); setShowPuestoList(false); Keyboard.dismiss(); }}
                            >
                              <MaterialCommunityIcons name={PUESTO_ICONS[p] || 'account'} size={16} color={theme.textSecondary} />
                              <Text style={[styles.puestoOptionText, { color: theme.text }]}>{p}</Text>
                            </TouchableOpacity>
                          )) : (
                            <View style={styles.puestoOption}>
                              <Text style={[styles.puestoOptionText, { color: theme.textMuted }]}>Sin resultados</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ height: 8 }} />
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: theme.accent, marginTop: 8 }]}
                  onPress={handleAddWorker}
                >
                  <Text style={[styles.modalBtnText, { color: theme.accentText }]}>AGREGAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancel} onPress={resetAddWorkerForm}>
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll:      { paddingHorizontal: 16, paddingBottom: 60 },

  // Tarjeta perfil
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, marginTop: 16, borderWidth: 1,
  },
  profilePhoto:      { width: 56, height: 56, borderRadius: 28, resizeMode: 'cover' },
  profileAvatar:     { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 22, fontWeight: '900' },
  profileInfo:       { flex: 1 },
  profileName:       { fontSize: 17, fontWeight: '800' },
  puestoBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start' },
  puestoText:        { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  cameraBtn:         { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Grupos de opciones
  group: { marginTop: 16 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderWidth: 1, marginTop: -1,
  },
  optionRowFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 0 },
  optionRowLast:  { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  optionIconBox:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionTexts:    { flex: 1 },
  optionTitle:    { fontSize: 15, fontWeight: '700' },
  optionSub:      { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Barra admin
  adminBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, padding: 14, marginTop: 16,
  },
  adminBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adminBarText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  adminExit:    { fontSize: 13, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 8 },

  // Worker cards
  workerCard: {
    borderWidth: 1, padding: 14, marginTop: -1,
  },
  workerTop:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workerPhoto:  { width: 42, height: 42, borderRadius: 21, resizeMode: 'cover' },
  workerAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  workerInitial: { fontSize: 16, fontWeight: '900', color: '#000' },
  workerInfo:   { flex: 1 },
  workerName:   { fontSize: 15, fontWeight: '700' },
  workerPuestoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  workerPuesto: { fontSize: 11, fontWeight: '600' },
  deleteBtn:    { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  workerDetails:   { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  workerDetailCol: { flex: 1 },
  detailLabel:     { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  detailValue:     { fontSize: 14, fontWeight: '700' },
  detailDivider:   { width: 1, height: 32, marginHorizontal: 16 },
  pinRow:          { flexDirection: 'row', alignItems: 'center' },

  // Botón agregar empleado
  addWorkerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, borderWidth: 1,
    borderStyle: 'dashed', marginTop: 8,
  },
  addWorkerText: { fontSize: 14, fontWeight: '700' },

  // Modales
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalBox: {
    borderRadius: 20, padding: 24, borderWidth: 1,
  },
  modalIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  modalTitle:    { fontSize: 15, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  modalSub:      { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  modalInput: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 20, fontWeight: '700', borderWidth: 1, textAlign: 'center', letterSpacing: 6, marginBottom: 4,
  },
  modalBtn:      { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  modalBtnText:  { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  modalCancel:   { paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },

  // Sheet agregar empleado
  addWorkerSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 24, paddingBottom: 34,
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '90%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  // Campos
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  fieldInput: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '600', borderWidth: 1,
  },

  // Puesto autocomplete
  puestoInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1,
  },
  puestoInput:     { flex: 1, fontSize: 15, fontWeight: '600', padding: 0 },
  puestoDropdown: {
    borderRadius: 12, borderWidth: 1, marginTop: 4,
    overflow: 'hidden',
  },
  puestoOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  puestoOptionText: { fontSize: 14, fontWeight: '600' },
});
