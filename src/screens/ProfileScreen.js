import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Modal, Image, Switch,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, PUESTOS, PUESTO_ICONS, generatePin } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CenterModal from '../components/CenterModal';
import ThemedTextInput from '../components/ThemedTextInput';
import PinKeypadModal from '../components/PinKeypadModal';

export default function ProfileScreen({ navigation }) {
  const {
    currentWorker, workers, deviceType,
    verifyOwnerPin, isAdmin, switchWorker,
    addWorker, removeWorker, updateWorkerPhoto,
  } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const iAmAdmin = isAdmin(currentWorker);

  // Modales
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showSwitchModal, setShowSwitchModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [workerToDelete, setWorkerToDelete]       = useState(null);

  // Admin PIN (solo si no es owner accediendo a funciones de owner)
  const [showOwnerPin, setShowOwnerPin] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState(null);

  // Agregar empleado
  const [showAddWorker, setShowAddWorker]   = useState(false);
  const [newName, setNewName]               = useState('');
  const [newPin, setNewPin]                 = useState(generatePin());
  const [newDui, setNewDui]                 = useState('');
  const [puestoQuery, setPuestoQuery]       = useState('');
  const [puestoSelected, setPuestoSelected] = useState('');
  const [showPuestoList, setShowPuestoList] = useState(false);
  const [addError, setAddError]             = useState('');
  const [revealPinId, setRevealPinId]       = useState(null);

  const puestosFiltrados = useMemo(() =>
    PUESTOS.filter(p => p.toLowerCase().includes(puestoQuery.toLowerCase())),
    [puestoQuery]
  );

  const requireOwnerPin = (action) => {
    if (currentWorker?.role === 'owner') { action(); return; }
    setPendingAdminAction(() => action);
    setShowOwnerPin(true);
  };

  const handleAddWorker = async () => {
    setAddError('');
    if (!newName.trim())          { setAddError('Escribí el nombre'); return; }
    if (!/^\d{4}$/.test(newPin))  { setAddError('El PIN debe ser 4 dígitos'); return; }
    if (!puestoSelected)          { setAddError('Seleccioná un puesto'); return; }
    const result = await addWorker(newName.trim(), newPin, puestoSelected, newDui.trim());
    if (result.error) { setAddError(result.error); return; }
    resetAddForm();
  };

  const resetAddForm = () => {
    setShowAddWorker(false);
    setNewName(''); setNewPin(generatePin()); setNewDui('');
    setPuestoQuery(''); setPuestoSelected('');
    setShowPuestoList(false); setAddError('');
  };

  const handlePhotoPress = async () => {
    const opts = { allowsEditing: true, aspect: [1, 1], quality: 0.6 };
    if (Platform.OS === 'ios') {
      const { ImagePickerAssets } = await ImagePicker.launchImageLibraryAsync(opts);
    }
    const result = await ImagePicker.launchImageLibraryAsync(opts);
    if (!result.canceled) await updateWorkerPhoto(currentWorker.id, result.assets[0].uri);
  };

  const handleCameraPress = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.6 });
    if (!result.canceled) await updateWorkerPhoto(currentWorker.id, result.assets[0].uri);
  };

  const puestoLabel = currentWorker?.puesto || 'Cajero';
  const puestoIcon  = PUESTO_ICONS[puestoLabel] || 'account';

  const handleSwitchConfirm = () => {
    setShowSwitchModal(false);
    switchWorker();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
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

        {/* TARJETA DE PERFIL */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={styles.profileCardMain}
            onPress={() => setShowProfileDetail(true)}
            activeOpacity={0.8}
          >
            {currentWorker?.photo ? (
              <Image source={{ uri: currentWorker.photo }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profileAvatar, { backgroundColor: currentWorker?.role === 'owner' ? theme.accent : (currentWorker?.color || '#1C1C1E') }]}>
                <Text style={[styles.profileAvatarText, { color: currentWorker?.role === 'owner' ? theme.accentText : '#fff' }]}>
                  {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>{currentWorker?.name}</Text>
              <View style={[styles.puestoBadge, { backgroundColor: theme.bg }]}>
                <MaterialCommunityIcons name={puestoIcon} size={11} color={theme.textMuted} />
                <Text style={[styles.puestoText, { color: theme.textMuted }]}>
                  {puestoLabel.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Botón cámara separado */}
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
              onPress={handleCameraPress}
            >
              <Feather name="camera" size={14} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
              onPress={handlePhotoPress}
            >
              <Feather name="image" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* OPCIONES */}
        <View style={styles.group}>
          {/* Tema */}
          <View style={[styles.row, styles.rowFirst, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.rowIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
              <Feather name={isDark ? 'moon' : 'sun'} size={15} color={theme.text} />
            </View>
            <View style={styles.rowTexts}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>Cambiar apariencia</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme}
              trackColor={{ false: '#D1D1D6', true: theme.accent }} thumbColor="#FFF" />
          </View>

          {/* Cambiar turno — solo en dispositivo fijo o si no es personal */}
          {deviceType === 'fixed' && (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowSwitchModal(true)}
            >
              <View style={[styles.rowIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                <Feather name="users" size={15} color={theme.text} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Cambiar turno</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Otro empleado toma el dispositivo</Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          {deviceType === 'personal' && (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={() => setShowSwitchModal(true)}
            >
              <View style={[styles.rowIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                <Feather name="log-out" size={15} color={theme.text} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Cerrar sesión</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Salir de tu turno</Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          {/* Último row del grupo */}
          <View style={[styles.row, styles.rowLast, { backgroundColor: theme.card, borderColor: theme.cardBorder, opacity: 0 }]} />
        </View>

        {/* SECCIÓN ADMIN */}
        {iAmAdmin && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ADMINISTRACIÓN</Text>

            <View style={styles.group}>
              <TouchableOpacity
                style={[styles.row, styles.rowFirst, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => navigation.navigate('BusinessConfig')}
              >
                <View style={[styles.rowIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                  <Feather name="settings" size={15} color={theme.text} />
                </View>
                <View style={styles.rowTexts}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Configuración de cobro</Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted }]}>Banco, WhatsApp para tickets</Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textMuted} />
              </TouchableOpacity>
              {currentWorker?.role === 'owner' && (
                <TouchableOpacity
                  style={[styles.row, styles.rowLast, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => navigation.navigate('ManageModes')}
                >
                  <View style={[styles.rowIcon, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
                    <Feather name="layers" size={15} color={theme.text} />
                  </View>
                  <View style={styles.rowTexts}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>Catálogos</Text>
                    <Text style={[styles.rowSub, { color: theme.textMuted }]}>Crear, editar y programar catálogos</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>EQUIPO</Text>

            <View style={styles.group}>
              {workers.map((worker, index) => {
                const wPuesto    = worker.puesto || 'Cajero';
                const wIcon      = PUESTO_ICONS[wPuesto] || 'account';
                const pinVisible = revealPinId === worker.id;
                const isFirst    = index === 0;
                const isLast     = index === workers.length - 1;
                return (
                  <View
                    key={worker.id}
                    style={[
                      styles.workerCard,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      isFirst && styles.rowFirst,
                      isLast  && styles.rowLast,
                    ]}
                  >
                    <View style={styles.workerTop}>
                      {worker.photo ? (
                        <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
                      ) : (
                        <View style={[styles.workerAvatar, { backgroundColor: worker.role === 'owner' ? theme.accent : (worker.color || '#1C1C1E') }]}>
                          <Text style={[styles.workerInitial, { color: worker.role === 'owner' ? theme.accentText : '#fff' }]}>
                            {worker.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.workerMeta}>
                        <Text style={[styles.workerName, { color: theme.text }]}>{worker.name}</Text>
                        <View style={styles.workerPuestoRow}>
                          <MaterialCommunityIcons name={wIcon} size={11} color={theme.textMuted} />
                          <Text style={[styles.workerPuesto, { color: theme.textMuted }]}>{wPuesto}</Text>
                        </View>
                      </View>
                      {worker.id !== 'owner' && (
                        <TouchableOpacity
                          style={[styles.trashBtn, { backgroundColor: theme.bg }]}
                          onPress={() => { setWorkerToDelete(worker); setShowDeleteModal(true); }}
                        >
                          <Feather name="trash-2" size={14} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={[styles.workerDetails, { borderTopColor: theme.cardBorder }]}>
                      <View style={styles.detailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>DUI</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{worker.dui || '—'}</Text>
                      </View>
                      <View style={[styles.detailDivider, { backgroundColor: theme.cardBorder }]} />
                      <View style={styles.detailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>PIN</Text>
                        <TouchableOpacity
                          style={styles.pinRow}
                          onPress={() => setRevealPinId(pinVisible ? null : worker.id)}
                        >
                          <Text style={[styles.detailValue, { color: theme.text }]}>
                            {pinVisible ? worker.pin : '• • • •'}
                          </Text>
                          <Feather
                            name={pinVisible ? 'eye-off' : 'eye'}
                            size={13} color={theme.textMuted}
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.addBtn, { borderColor: theme.cardBorder }]}
              onPress={() => setShowAddWorker(true)}
            >
              <Feather name="user-plus" size={16} color={theme.textMuted} />
              <Text style={[styles.addBtnText, { color: theme.textMuted }]}>Agregar empleado</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL: DETALLE DE PERFIL ──────────────────── */}
      <CenterModal
        visible={showProfileDetail}
        onClose={() => setShowProfileDetail(false)}
      >
        <View style={{ alignItems: 'center' }}>
          {currentWorker?.photo ? (
            <Image source={{ uri: currentWorker.photo }} style={styles.detailPhoto} />
          ) : (
            <View style={[styles.detailAvatar, { backgroundColor: currentWorker?.role === 'owner' ? theme.accent : (currentWorker?.color || '#1C1C1E') }]}>
              <Text style={[styles.detailAvatarText, { color: currentWorker?.role === 'owner' ? theme.accentText : '#fff' }]}>
                {currentWorker?.name?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.detailName, { color: theme.text }]}>{currentWorker?.name}</Text>
          <View style={[styles.detailPuestoBadge, { backgroundColor: theme.bg }]}>
            <MaterialCommunityIcons name={puestoIcon} size={13} color={theme.textMuted} />
            <Text style={[styles.detailPuestoText, { color: theme.textMuted }]}>
              {puestoLabel.toUpperCase()}
            </Text>
          </View>
          {currentWorker?.dui ? (
            <View style={[styles.detailInfoRow, { borderTopColor: theme.cardBorder }]}>
              <Text style={[styles.detailInfoLabel, { color: theme.textMuted }]}>DUI</Text>
              <Text style={[styles.detailInfoValue, { color: theme.text }]}>{currentWorker.dui}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.detailCloseBtn, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
            onPress={() => setShowProfileDetail(false)}
          >
            <Text style={[styles.detailCloseBtnText, { color: theme.textMuted }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </CenterModal>

      {/* ── MODAL: CAMBIAR TURNO / CERRAR SESIÓN ─────── */}
      <CenterModal
        visible={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.confirmIconWrap, { backgroundColor: theme.bg }]}>
            <Feather
              name={deviceType === 'fixed' ? 'users' : 'log-out'}
              size={24} color={theme.text}
            />
          </View>
          <Text style={[styles.confirmTitle, { color: theme.text }]}>
            {deviceType === 'fixed' ? 'CAMBIAR TURNO' : 'CERRAR SESIÓN'}
          </Text>
          <Text style={[styles.confirmSub, { color: theme.textMuted }]}>
            {deviceType === 'fixed'
              ? `${currentWorker?.name} va a cerrar su turno.\nOtro empleado podrá entrar con su PIN.`
              : `Vas a salir de tu turno.\n¿Seguro que querés continuar?`
            }
          </Text>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
            onPress={handleSwitchConfirm}
          >
            <Text style={[styles.confirmBtnText, { color: theme.accentText }]}>
              {deviceType === 'fixed' ? 'CAMBIAR TURNO' : 'SALIR'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmCancel}
            onPress={() => setShowSwitchModal(false)}
          >
            <Text style={[styles.confirmCancelText, { color: theme.textMuted }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </CenterModal>

      {/* ── MODAL: ELIMINAR EMPLEADO ──────────────────── */}
      <CenterModal
        visible={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setWorkerToDelete(null); }}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.confirmIconWrap, { backgroundColor: '#FF3B3020' }]}>
            <Feather name="trash-2" size={24} color="#FF3B30" />
          </View>
          <Text style={[styles.confirmTitle, { color: theme.text }]}>ELIMINAR EMPLEADO</Text>
          <Text style={[styles.confirmSub, { color: theme.textMuted }]}>
            ¿Eliminar a <Text style={{ color: theme.text, fontWeight: '700' }}>{workerToDelete?.name}</Text>?{'\n'}
            Esta acción no se puede deshacer.
          </Text>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: '#FF3B30' }]}
            onPress={async () => {
              if (workerToDelete) await removeWorker(workerToDelete.id);
              setShowDeleteModal(false); setWorkerToDelete(null);
            }}
          >
            <Text style={[styles.confirmBtnText, { color: '#FFF' }]}>SÍ, ELIMINAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmCancel}
            onPress={() => { setShowDeleteModal(false); setWorkerToDelete(null); }}
          >
            <Text style={[styles.confirmCancelText, { color: theme.textMuted }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </CenterModal>

      {/* ── MODAL: AGREGAR EMPLEADO ───────────────────── */}
      <Modal visible={showAddWorker} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={[styles.overlay, { backgroundColor: theme.overlay, justifyContent: 'flex-end' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={[styles.sheetHandle, { backgroundColor: theme.cardBorder }]} />

                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: theme.text }]}>NUEVO EMPLEADO</Text>
                  <TouchableOpacity onPress={resetAddForm}>
                    <Feather name="x" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.sheetScroll}
                >
                  {/* Nombre */}
                  <ThemedTextInput
                    label="NOMBRE"
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Nombre completo"
                    autoCapitalize="words"
                  />

                  {/* DUI */}
                  <ThemedTextInput
                    label="DUI"
                    value={newDui}
                    onChangeText={setNewDui}
                    placeholder="00000000-0  (opcional)"
                    keyboardType="numeric"
                    maxLength={10}
                  />

                  {/* PIN generado */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PIN DE ACCESO</Text>
                  <View style={[styles.pinGenWrap, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
                    <Text style={[styles.pinGenValue, { color: theme.text }]}>{newPin}</Text>
                    <TouchableOpacity
                      style={[styles.pinGenBtn, { backgroundColor: theme.bg }]}
                      onPress={() => setNewPin(generatePin())}
                    >
                      <Feather name="refresh-cw" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                    PIN de 4 dígitos generado automáticamente. Tocá ↻ para cambiar.
                  </Text>

                  {/* Puesto autocomplete */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PUESTO</Text>
                  <View style={[styles.puestoWrap, { backgroundColor: theme.input, borderColor: puestoSelected ? theme.accent : theme.inputBorder }]}>
                    {puestoSelected
                      ? <MaterialCommunityIcons name={PUESTO_ICONS[puestoSelected] || 'account'} size={16} color={theme.text} style={{ marginRight: 8 }} />
                      : <Feather name="search" size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
                    }
                    <TextInput
                      style={[styles.puestoInput, { color: theme.text }]}
                      value={puestoSelected || puestoQuery}
                      onChangeText={t => { setPuestoQuery(t); setPuestoSelected(''); setShowPuestoList(true); }}
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

                  {showPuestoList && !puestoSelected && (
                    <View style={[styles.puestoDropdown, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      {puestosFiltrados.map((p, i) => (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.puestoOption,
                            { borderBottomColor: theme.cardBorder },
                            i === puestosFiltrados.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => { setPuestoSelected(p); setPuestoQuery(''); setShowPuestoList(false); Keyboard.dismiss(); }}
                        >
                          <MaterialCommunityIcons name={PUESTO_ICONS[p] || 'account'} size={16} color={theme.textSecondary} />
                          <Text style={[styles.puestoOptionText, { color: theme.text }]}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                      {puestosFiltrados.length === 0 && (
                        <View style={styles.puestoOption}>
                          <Text style={[styles.puestoOptionText, { color: theme.textMuted }]}>Sin resultados</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {addError ? (
                    <View style={[styles.errorBanner, { backgroundColor: '#FF3B3015', borderColor: '#FF3B3040' }]}>
                      <Feather name="alert-circle" size={14} color="#FF3B30" />
                      <Text style={styles.errorBannerText}>{addError}</Text>
                    </View>
                  ) : null}

                  <View style={{ height: 8 }} />
                </ScrollView>

                <TouchableOpacity
                  style={[styles.sheetBtn, { backgroundColor: theme.accent }]}
                  onPress={handleAddWorker}
                >
                  <Feather name="user-plus" size={16} color={theme.accentText} />
                  <Text style={[styles.sheetBtnText, { color: theme.accentText }]}>AGREGAR EMPLEADO</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <PinKeypadModal
        visible={showOwnerPin}
        onClose={() => { setShowOwnerPin(false); setPendingAdminAction(null); }}
        onVerify={(pin) => {
          if (verifyOwnerPin(pin)) {
            if (pendingAdminAction) { pendingAdminAction(); setPendingAdminAction(null); }
            return true;
          }
          return false;
        }}
      />

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
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 16, marginTop: 16, borderWidth: 1, gap: 12,
  },
  profileCardMain:   { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  profilePhoto:      { width: 54, height: 54, borderRadius: 27, resizeMode: 'cover' },
  profileAvatar:     { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 22, fontWeight: '900' },
  profileInfo:       { flex: 1 },
  profileName:       { fontSize: 16, fontWeight: '800' },
  puestoBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5, alignSelf: 'flex-start' },
  puestoText:        { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  photoActions:      { flexDirection: 'row', gap: 6 },
  photoBtn:          { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  // Grupos
  group:    { marginTop: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 15, borderWidth: 1, marginTop: -1,
  },
  rowFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 0 },
  rowLast:  { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  rowIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTexts: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub:   { fontSize: 12, fontWeight: '500', marginTop: 1 },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 8 },

  // Worker cards
  workerCard:    { borderWidth: 1, padding: 14, marginTop: -1 },
  workerTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workerPhoto:   { width: 42, height: 42, borderRadius: 21, resizeMode: 'cover' },
  workerAvatar:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  workerInitial: { fontSize: 16, fontWeight: '900', color: '#fff' },
  workerMeta:    { flex: 1 },
  workerName:    { fontSize: 15, fontWeight: '700' },
  workerPuestoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  workerPuesto:  { fontSize: 11, fontWeight: '600' },
  trashBtn:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  workerDetails: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  detailCol:     { flex: 1 },
  detailLabel:   { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  detailValue:   { fontSize: 14, fontWeight: '700' },
  detailDivider: { width: 1, height: 32, marginHorizontal: 16 },
  pinRow:        { flexDirection: 'row', alignItems: 'center' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, borderWidth: 1,
    borderStyle: 'dashed', marginTop: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: '700' },

  // Modal detalle perfil
  detailPhoto:      { width: 80, height: 80, borderRadius: 40, resizeMode: 'cover', marginBottom: 16 },
  detailAvatar:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  detailAvatarText: { fontSize: 32, fontWeight: '900' },
  detailName:       { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  detailPuestoBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  detailPuestoText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  detailInfoRow:    { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 16, marginTop: 16 },
  detailInfoLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  detailInfoValue:  { fontSize: 14, fontWeight: '700' },
  detailCloseBtn:   { marginTop: 20, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, borderWidth: 1 },
  detailCloseBtnText: { fontSize: 13, fontWeight: '700' },

  // Modal confirmar
  confirmIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmTitle:    { fontSize: 16, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  confirmSub:      { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 10, marginBottom: 4, lineHeight: 20 },
  confirmBtn:      { width: '100%', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  confirmBtnText:  { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  confirmCancel:   { paddingVertical: 14 },
  confirmCancelText: { fontSize: 14, fontWeight: '600' },

  // Sheet agregar empleado
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, padding: 24, paddingBottom: 34, maxHeight: '92%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle:  { fontSize: 14, fontWeight: '900', letterSpacing: 3 },
  sheetScroll: { gap: 6 },
  sheetBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 16, marginTop: 12 },
  sheetBtnText:{ fontSize: 15, fontWeight: '900', letterSpacing: 2 },

  // Campos
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6, marginTop: 8 },
  fieldHint:  { fontSize: 11, fontWeight: '500', marginTop: 5, marginBottom: 4 },

  // PIN generado
  pinGenWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
  pinGenValue: { flex: 1, fontSize: 28, fontWeight: '900', letterSpacing: 12 },
  pinGenBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Puesto autocomplete
  puestoWrap:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1 },
  puestoInput:      { flex: 1, fontSize: 15, fontWeight: '600', padding: 0 },
  puestoDropdown:   { borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: 'hidden' },
  puestoOption:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1 },
  puestoOptionText: { fontSize: 14, fontWeight: '600' },

  // Error banner
  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 8 },
  errorBannerText: { fontSize: 13, fontWeight: '600', color: '#FF3B30', flex: 1 },
});