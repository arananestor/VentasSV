import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import BottomSheetModal from './BottomSheetModal';
import CenterModal from './CenterModal';
import DayChipsSelector from './DayChipsSelector';
import WeekCalendarView from './WeekCalendarView';
import { detectScheduleOverlap } from '../utils/modeScheduling';

const TIME_RE = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function ScheduleSheet({ visible, onClose, modeId, existingActivations, modes, onSave }) {
  const { theme } = useTheme();
  const [type, setType] = useState('recurrente');
  const [date, setDate] = useState('');
  const [days, setDays] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showConflict, setShowConflict] = useState(null);
  const [saveError, setSaveError] = useState('');

  const modeName = (modes || []).find(m => m.id === modeId)?.name || '';

  const clearError = () => setSaveError('');

  const buildActivation = () => ({
    type,
    modeId,
    ...(type === 'evento' ? { date } : { days }),
    startTime,
    endTime,
  });

  const isPreviewValid = () => {
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return false;
    if (type === 'evento') return DATE_RE.test(date) && !isNaN(new Date(date + 'T00:00:00').getTime());
    return days.length > 0;
  };

  const handleSave = () => {
    if (type === 'evento') {
      if (!DATE_RE.test(date) || isNaN(new Date(date + 'T00:00:00').getTime())) {
        setSaveError('Fecha inválida (formato YYYY-MM-DD)');
        return;
      }
    }
    if (!TIME_RE.test(startTime)) { setSaveError('Hora de inicio inválida (formato HH:MM)'); return; }
    if (!TIME_RE.test(endTime)) { setSaveError('Hora de fin inválida (formato HH:MM)'); return; }
    if (type === 'recurrente' && days.length === 0) { setSaveError('Seleccioná al menos un día'); return; }

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
    setSaveError('');
    onClose();
  };

  const dayLabel = (d) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d] || '';

  // Preview activations
  const previewActivations = isPreviewValid()
    ? [...(existingActivations || []), buildActivation()]
    : (existingActivations || []);

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
                onPress={() => { setType(t); clearError(); }}
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
                onChangeText={v => { setDate(v); clearError(); }}
              />
            </View>
          )}

          {type === 'recurrente' && (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>DÍAS</Text>
              <DayChipsSelector value={days} onChange={v => { setDays(v); clearError(); }} />
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
                onChangeText={v => { setStartTime(v); clearError(); }}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>HORA FIN</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
                placeholder="15:00"
                placeholderTextColor={theme.textMuted}
                value={endTime}
                onChangeText={v => { setEndTime(v); clearError(); }}
              />
            </View>
          </View>

          {/* Live preview */}
          {isPreviewValid() ? (
            <View style={styles.previewWrap}>
              <Text style={[styles.previewLabel, { color: theme.textMuted }]}>PREVIEW</Text>
              <View style={{ maxHeight: 200, borderRadius: 10, overflow: 'hidden' }}>
                <WeekCalendarView scheduledActivations={previewActivations} modes={modes || []} />
              </View>
              {(() => {
                const overlaps = detectScheduleOverlap(buildActivation(), existingActivations || []);
                if (overlaps.length === 0) return null;
                const first = overlaps[0];
                const conflictName = (modes || []).find(m => m.id === first.modeId)?.name || 'otro catálogo';
                return (
                  <Text style={[styles.warningText, { color: theme.danger }]}>
                    Se solapa con "{conflictName}" el {dayLabel(first.overlapDay)} de {first.overlapStart} a {first.overlapEnd}
                    {overlaps.length > 1 ? ` + ${overlaps.length - 1} más` : ''}
                  </Text>
                );
              })()}
            </View>
          ) : (
            <Text style={[styles.previewHint, { color: theme.textMuted }]}>
              Configurá los días y horas para ver preview
            </Text>
          )}

          {saveError ? <Text style={[styles.errorText, { color: theme.danger }]}>{saveError}</Text> : null}

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
  previewWrap: { marginBottom: 12, marginTop: 4 },
  previewLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  previewHint: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginVertical: 12 },
  warningText: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  errorText: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  conflictTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  conflictBody: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  conflictBtn: { width: '100%', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
});
