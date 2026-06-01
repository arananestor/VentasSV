import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  StyleSheet, Image, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import InternalTabs from '../components/InternalTabs';
import CatalogColorPicker from '../components/CatalogColorPicker';
import WeekCalendarView from '../components/WeekCalendarView';
import ScheduleSheet from '../components/ScheduleSheet';
import BottomSheetModal from '../components/BottomSheetModal';
import CenterModal from '../components/CenterModal';
import ThemedTextInput from '../components/ThemedTextInput';
import { newId } from '../utils/ids';
import { detectEmployeeConflicts } from '../utils/employeeConflicts';
import EmployeeConflictModal from '../components/EmployeeConflictModal';

const MULTI_LOCAL_ENABLED = false;

const ALL_TABS = [
  { key: 'detalles', label: 'Detalles' },
  { key: 'productos', label: 'Productos' },
  { key: 'equipo', label: 'Equipo' },
  { key: 'locales', label: 'Locales' },
  { key: 'horario', label: 'Horario' },
];

export default function CatalogDetailScreen({ route, navigation }) {
  const { modeId } = route.params;
  const { modes, products, updateMode, currentModeId, showNotif } = useApp();
  const { workers } = useAuth();
  const { theme } = useTheme();

  const mode = modes.find(m => m.id === modeId);
  const [activeKey, setActiveKey] = useState('detalles');
  const [name, setName] = useState(mode?.name || '');
  const [desc, setDesc] = useState(mode?.description || '');
  const [color, setColor] = useState(mode?.color || '');
  const [overrides, setOverrides] = useState({ ...(mode?.productOverrides || {}) });
  const [showSchedule, setShowSchedule] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [workerToUnassign, setWorkerToUnassign] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);

  if (!mode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="CATÁLOGO" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Feather name="alert-circle" size={32} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Catálogo no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const visibleTabs = MULTI_LOCAL_ENABLED ? ALL_TABS : ALL_TABS.filter(t => t.key !== 'locales');

  const handleSaveDetails = async () => {
    if (!name.trim()) { showNotif('Ponele un nombre al catálogo'); return; }
    await updateMode(modeId, { name: name.trim(), description: desc.trim(), color });
    showNotif('Catálogo guardado');
  };

  const handleSaveProducts = async () => {
    await updateMode(modeId, { productOverrides: overrides });
    showNotif('Productos actualizados');
  };

  const toggleProductActive = (productId) => {
    setOverrides(prev => ({
      ...prev,
      [productId]: {
        active: !(prev[productId]?.active ?? true),
        priceOverride: prev[productId]?.priceOverride ?? null,
      },
    }));
  };

  const setPriceOverride = (productId, price) => {
    setOverrides(prev => ({
      ...prev,
      [productId]: { ...prev[productId], priceOverride: price === '' ? null : parseFloat(price) || null },
    }));
  };

  const assignedWorkerIds = mode.assignedWorkerIds || [];
  const assignedWorkers = workers.filter(w => assignedWorkerIds.includes(w.id));
  const unassignedWorkers = workers.filter(w => !assignedWorkerIds.includes(w.id));

  const addWorkerToMode = async (workerId) => {
    // Simulate: check conflicts before persisting
    const simulatedMode = { ...mode, assignedWorkerIds: [...assignedWorkerIds, workerId] };
    const simulatedModes = modes.map(m => m.id === modeId ? simulatedMode : m);
    const conflicts = detectEmployeeConflicts(simulatedModes);
    const workerConflicts = conflicts.filter(c => c.workerId === workerId);

    if (workerConflicts.length > 0) {
      setShowAddWorker(false);
      setConflictModal({ conflict: workerConflicts[0], recentWorkerId: workerId });
      return;
    }

    await updateMode(modeId, { assignedWorkerIds: [...assignedWorkerIds, workerId] });
    setShowAddWorker(false);
    showNotif('Empleado asignado');
  };

  const removeWorkerFromMode = async (workerId) => {
    await updateMode(modeId, { assignedWorkerIds: assignedWorkerIds.filter(id => id !== workerId) });
    const w = workers.find(wr => wr.id === workerId);
    showNotif(`${w?.name || 'Empleado'} desasignado del catálogo`);
  };

  const handleScheduleSave = async (activation) => {
    if (editingEntry) {
      // Replace existing activation by id
      const updated = (mode.scheduledActivations || []).map(a =>
        a.id === editingEntry.id ? { ...activation, id: editingEntry.id, modeId, createdAt: editingEntry.createdAt } : a
      );
      await updateMode(modeId, { scheduledActivations: updated });
      setEditingEntry(null);
      showNotif('Horario actualizado');
    } else {
      const newActivation = {
        ...activation,
        id: newId(),
        modeId,
        createdAt: new Date().toISOString(),
      };
      await updateMode(modeId, {
        scheduledActivations: [...(mode.scheduledActivations || []), newActivation],
      });
      showNotif('Horario programado');
    }
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;
    await updateMode(modeId, {
      scheduledActivations: (mode.scheduledActivations || []).filter(e => e.id !== entryToDelete),
    });
    setEntryToDelete(null);
    showNotif('Horario eliminado');
  };

  const allActivations = modes.flatMap(m => (m.scheduledActivations || []).map(a => ({ ...a, modeId: m.id })));

  // ── Render tabs ──
  const renderDetalles = () => (
    <View style={styles.tabContent}>
      <ThemedTextInput label="NOMBRE" value={name} onChangeText={setName} placeholder="Nombre del catálogo" selectTextOnFocus />
      <ThemedTextInput label="DESCRIPCIÓN" value={desc} onChangeText={setDesc} placeholder="Opcional" />
      <View style={styles.badges}>
        {mode.isDefault && <View style={[styles.badge, { backgroundColor: theme.accent }]}><Text style={[styles.badgeText, { color: theme.accentText }]}>PRINCIPAL</Text></View>}
        {currentModeId === mode.id && <View style={[styles.badge, { backgroundColor: theme.success + '20' }]}><Text style={[styles.badgeText, { color: theme.success }]}>ACTIVO</Text></View>}
      </View>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>COLOR</Text>
      <CatalogColorPicker value={color} onChange={setColor} />
      <View style={{ height: 16 }} />
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.accent }, !name.trim() && { opacity: 0.3 }]}
        onPress={name.trim() ? handleSaveDetails : undefined}
      >
        <Text style={[styles.saveBtnText, { color: theme.accentText }]}>GUARDAR</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProductos = () => (
    <View style={styles.tabContent}>
      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.bg }]}>
            <Feather name="package" size={24} color={theme.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>SIN PRODUCTOS</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>Aún no creaste productos. Andá a la pantalla de productos para crear el primero.</Text>
        </View>
      ) : (
        <>
          {products.map(p => {
            const isActive = overrides[p.id]?.active ?? true;
            const priceOv = overrides[p.id]?.priceOverride;
            return (
              <View key={p.id} style={[styles.productRow, { borderColor: theme.cardBorder }]}>
                <View style={styles.productInfo}>
                  {p.iconName ? (
                    <View style={[styles.productIcon, { backgroundColor: p.iconBgColor || '#000' }]}>
                      <MaterialCommunityIcons name={p.iconName} size={18} color="#fff" />
                    </View>
                  ) : (
                    <View style={[styles.productIcon, { backgroundColor: theme.card }]}>
                      <Feather name="package" size={14} color={theme.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                    <Text style={[styles.productPrice, { color: theme.textMuted }]}>
                      ${(p.sizes?.[0]?.price || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Switch value={isActive} onValueChange={() => toggleProductActive(p.id)} />
                {isActive && (
                  <View style={styles.priceOverride}>
                    <Text style={[styles.overrideLabel, { color: theme.textMuted }]}>Precio en este catálogo:</Text>
                    <TextInput
                      style={[styles.overrideInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
                      keyboardType="decimal-pad"
                      placeholder={`$${(p.sizes?.[0]?.price || 0).toFixed(2)}`}
                      placeholderTextColor={theme.textMuted}
                      value={priceOv != null ? String(priceOv) : ''}
                      onChangeText={v => setPriceOverride(p.id, v)}
                    />
                  </View>
                )}
              </View>
            );
          })}
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSaveProducts}>
            <Text style={[styles.saveBtnText, { color: theme.accentText }]}>GUARDAR PRODUCTOS</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderEquipo = () => (
    <View style={styles.tabContent}>
      {assignedWorkers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.bg }]}>
            <Feather name="users" size={24} color={theme.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>SIN EQUIPO</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>Ningún empleado asignado a este catálogo. Tocá Agregar empleado para que alguien trabaje con este catálogo.</Text>
        </View>
      ) : (
        assignedWorkers.map(w => (
          <View key={w.id} style={[styles.workerRow, { borderColor: theme.cardBorder }]}>
            <View style={[styles.workerAvatar, { backgroundColor: w.role === 'owner' ? theme.accent : (w.color || '#1C1C1E') }]}>
              <Text style={{ color: w.role === 'owner' ? theme.accentText : '#fff', fontSize: 14, fontWeight: '800' }}>
                {w.name?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.workerName, { color: theme.text }]}>{w.name}</Text>
              <Text style={[styles.workerPuesto, { color: theme.textMuted }]}>{w.puesto || 'Cajero'}</Text>
            </View>
            <TouchableOpacity onPress={() => setWorkerToUnassign(w)}>
              <Feather name="x" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))
      )}
      <TouchableOpacity style={[styles.addBtn, { borderColor: theme.cardBorder }]} onPress={() => setShowAddWorker(true)}>
        <Feather name="plus" size={16} color={theme.textMuted} />
        <Text style={[styles.addBtnText, { color: theme.textMuted }]}>AGREGAR EMPLEADO</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHorario = () => {
    const entries = mode.scheduledActivations || [];
    const describeEntry = (e) => {
      if (e.type === 'evento') return `${e.date} · ${e.startTime} a ${e.endTime} · Evento`;
      if (e.type === 'recurrente') {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const ds = (e.days || []).map(d => dayNames[d]).join(', ');
        return `${ds} · ${e.startTime} a ${e.endTime} · Recurrente`;
      }
      return `${e.startTime || ''} — programado`;
    };

    return (
      <View style={styles.tabContent}>
        <WeekCalendarView scheduledActivations={allActivations} modes={modes} />
        <View style={{ height: 16 }} />
        {entries.length === 0 ? (
          <Text style={[styles.emptySub, { color: theme.textMuted, textAlign: 'center' }]}>
            Sin horarios programados. Este catálogo se activa solo cuando lo elegís manualmente desde la lista.
          </Text>
        ) : (
          entries.map((e, i) => (
            <TouchableOpacity
              key={e.id || i}
              style={[styles.scheduleRow, { borderColor: theme.cardBorder }]}
              onPress={() => setEntryToEdit(e)}
              onLongPress={() => setEntryToDelete(e.id)}
            >
              <View style={[styles.scheduleBar, { backgroundColor: color || theme.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.scheduleName, { color: theme.text }]}>{mode.name}</Text>
                <Text style={[styles.scheduleDesc, { color: theme.textMuted }]}>{describeEntry(e)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={[styles.addBtn, { borderColor: theme.cardBorder }]} onPress={() => setShowSchedule(true)}>
          <Feather name="plus" size={16} color={theme.textMuted} />
          <Text style={[styles.addBtnText, { color: theme.textMuted }]}>PROGRAMAR HORARIO</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title={mode.name} onBack={() => navigation.goBack()} />
      <InternalTabs tabs={visibleTabs} activeKey={activeKey} onTabChange={setActiveKey} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeKey === 'detalles' && renderDetalles()}
        {activeKey === 'productos' && renderProductos()}
        {activeKey === 'equipo' && renderEquipo()}
        {activeKey === 'horario' && renderHorario()}
      </ScrollView>

      <ScheduleSheet
        visible={showSchedule}
        onClose={() => { setShowSchedule(false); setEditingEntry(null); }}
        modeId={modeId}
        existingActivations={allActivations}
        modes={modes}
        onSave={handleScheduleSave}
        editingActivation={editingEntry}
      />

      <BottomSheetModal visible={showAddWorker} onClose={() => setShowAddWorker(false)} title="AGREGAR EMPLEADO">
        <View style={{ paddingHorizontal: 16, paddingBottom: 30 }}>
          {unassignedWorkers.length === 0 ? (
            <Text style={[styles.emptySub, { color: theme.textMuted, textAlign: 'center' }]}>Todos los empleados ya están asignados.</Text>
          ) : (
            unassignedWorkers.map(w => (
              <TouchableOpacity key={w.id} style={[styles.workerRow, { borderColor: theme.cardBorder }]} onPress={() => addWorkerToMode(w.id)}>
                <View style={[styles.workerAvatar, { backgroundColor: w.role === 'owner' ? theme.accent : (w.color || '#1C1C1E') }]}>
                  <Text style={{ color: w.role === 'owner' ? theme.accentText : '#fff', fontSize: 14, fontWeight: '800' }}>
                    {w.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.workerName, { color: theme.text }]}>{w.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </BottomSheetModal>

      <CenterModal visible={entryToEdit !== null} onClose={() => setEntryToEdit(null)} title="¿EDITAR HORARIO?">
        <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
          Vas a editar el horario programado.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }} onPress={() => setEntryToEdit(null)}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textMuted }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: theme.accent }} onPress={() => { setEditingEntry(entryToEdit); setEntryToEdit(null); setShowSchedule(true); }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.accentText }}>EDITAR</Text>
          </TouchableOpacity>
        </View>
      </CenterModal>

      <CenterModal visible={entryToDelete !== null} onClose={() => setEntryToDelete(null)} title="¿ELIMINAR HORARIO?">
        <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
          Esta acción no se puede deshacer.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }} onPress={() => setEntryToDelete(null)}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textMuted }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#D62828' }} onPress={confirmDeleteEntry}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>ELIMINAR</Text>
          </TouchableOpacity>
        </View>
      </CenterModal>

      <CenterModal visible={workerToUnassign !== null} onClose={() => setWorkerToUnassign(null)} title="¿DESASIGNAR EMPLEADO?">
        <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
          Vas a desasignar a {workerToUnassign?.name}. Podés volver a asignarlo después si querés.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }} onPress={() => setWorkerToUnassign(null)}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textMuted }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: theme.danger || '#D62828' }} onPress={() => { removeWorkerFromMode(workerToUnassign.id); setWorkerToUnassign(null); }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>DESASIGNAR</Text>
          </TouchableOpacity>
        </View>
      </CenterModal>

      <EmployeeConflictModal
        visible={conflictModal !== null}
        onClose={() => setConflictModal(null)}
        conflict={conflictModal?.conflict}
        modes={modes}
        workers={workers}
        currentModeId={modeId}
        onResolve={async (action) => {
          if (!conflictModal) return;
          const { conflict, recentWorkerId } = conflictModal;
          const otherModeId = conflict.modeIdA === modeId ? conflict.modeIdB : conflict.modeIdA;
          const w = workers.find(wr => wr.id === recentWorkerId);

          if (action === 'remove-from-new') {
            setConflictModal(null);
            showNotif(`${w?.name || 'Empleado'} no asignada para evitar conflicto.`);
          } else if (action === 'remove-from-existing') {
            // Add to current + remove from other
            await updateMode(modeId, { assignedWorkerIds: [...assignedWorkerIds, recentWorkerId] });
            const otherMode = modes.find(m => m.id === otherModeId);
            if (otherMode) {
              await updateMode(otherModeId, {
                assignedWorkerIds: (otherMode.assignedWorkerIds || []).filter(id => id !== recentWorkerId),
              });
            }
            setConflictModal(null);
            showNotif(`${w?.name || 'Empleado'} reasignada al catálogo actual.`);
          } else {
            setConflictModal(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  tabContent: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  emptySub: { fontSize: 13, fontWeight: '500', lineHeight: 18, paddingHorizontal: 16 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8, marginTop: 16 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  productRow: { paddingVertical: 12, borderBottomWidth: 1 },
  productInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 15, fontWeight: '700' },
  productPrice: { fontSize: 12, fontWeight: '500' },
  priceOverride: { marginTop: 8, paddingLeft: 48 },
  overrideLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  overrideInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600' },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  workerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  workerName: { fontSize: 15, fontWeight: '700' },
  workerPuesto: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginTop: 16 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  scheduleBar: { width: 4, height: 32, borderRadius: 2 },
  scheduleName: { fontSize: 14, fontWeight: '700' },
  scheduleDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});
