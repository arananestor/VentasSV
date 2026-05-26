import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import BottomSheetModal from './BottomSheetModal';
import CenterModal from './CenterModal';
import DayChipsSelector from './DayChipsSelector';
import { detectScheduleOverlap } from '../utils/modeScheduling';

export default function ScheduleSheet({ visible, onClose, modeId, existingActivations, modes, onSave }) {
  const { theme } = useTheme();
  const [type, setType] = useState('recurrente');
  const [date, setDate] = useState('');
  const [days, setDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showConflict, setShowConflict] = useState(null);

  const modeName = (modes || []).find(m => m.id === modeId)?.name || '';

  const buildActivation = () => ({
    type,
    modeId,
    ...(type === 'evento' ? { date } : { days }),
    startTime,
    endTime,
  });

  const handleSave = () => {
    const newAct = buildActivation();
    const overlaps = detectScheduleOverlap(newAct, existingActivations || []);
    if (overlaps.length > 0) {
      const conflict = overlaps[0];
      const conflictMode = (modes || []).find(m => m.id === conflict.modeId);
      setShowConflict({
        name: conflictMode?.name || 'otro catálogo',
        day: conflict.overlapDay,
        start: conflict.overlapStart,
        end: conflict.overlapEnd,
        activation: newAct,
      });
    } else {
      onSave(newAct, false);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setType('recurrente');
    setDate('');
    setDays([]);
    setStartTime('');
    setEndTime('');
    setShowConflict(null);
    onClose();
  };

  const dayLabel = (d) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d] || '';

  return (
    <>
      <BottomSheetModal visible={visible} onClose={resetAndClose} title="PROGRAMAR HORARIO">
        <View style={styles.content}>
          {/* Type toggle */}
          <View style={styles.typeRow}>
            {['recurrente', 'evento'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, { backgroundColor: type === t ? theme.accent : theme.bg, borderColor: type === t ? theme.accent : theme.cardBorder }]}
                onPress={() => setType(t)}
              >
                <Text style={{ color: type === t ? theme.accentText : theme.textSecondary, fontSize: 13, fontWeight: '700' }}>
                  {t === 'recurrente' ? 'Recurrente' : 'Evento puntual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'evento' && (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>FECHA</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
                placeholder="2026-06-15"
                placeholderTextColor={theme.textMuted}
                value={date}
                onChangeText={setDate}
              />
            </View>
          )}

          {type === 'recurrente' && (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>DÍAS</Text>
              <DayChipsSelector value={days} onChange={setDays} />
            </View>
          )}

          <View style={styles.timeRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>HORA INICIO</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
                placeholder="11:00"
                placeholderTextColor={theme.textMuted}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>HORA FIN</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
                placeholder="15:00"
                placeholderTextColor={theme.textMuted}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            onPress={handleSave}
          >
            <Text style={{ color: theme.accentText, fontSize: 15, fontWeight: '900', letterSpacing: 2 }}>GUARDAR HORARIO</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      <CenterModal
        visible={showConflict !== null}
        onClose={() => setShowConflict(null)}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.conflictTitle, { color: theme.text }]}>SOLAPAMIENTO DETECTADO</Text>
          <Text style={[styles.conflictBody, { color: theme.textMuted }]}>
            El catálogo "{modeName}" se cruza con "{showConflict?.name}" el {dayLabel(showConflict?.day)} de {showConflict?.start} a {showConflict?.end}.
            {'\n\n'}¿Qué querés hacer?
          </Text>
          <TouchableOpacity
            style={[styles.conflictBtn, { backgroundColor: theme.accent }]}
            onPress={() => {
              onSave(showConflict.activation, true);
              setShowConflict(null);
              resetAndClose();
            }}
          >
            <Text style={{ color: theme.accentText, fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>REEMPLAZAR EN LA FRANJA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.conflictBtn, { borderWidth: 1, borderColor: theme.cardBorder }]}
            onPress={() => setShowConflict(null)}
          >
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>AJUSTAR HORARIO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => { setShowConflict(null); resetAndClose(); }}>
            <Text style={{ color: theme.textMuted, fontWeight: '600', fontSize: 13 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </CenterModal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 10 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  conflictTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  conflictBody: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  conflictBtn: { width: '100%', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
});
