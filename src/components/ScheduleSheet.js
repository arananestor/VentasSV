import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import BottomSheetModal from './BottomSheetModal';
import CenterModal from './CenterModal';
import DayChipsSelector from './DayChipsSelector';
import WeekCalendarView from './WeekCalendarView';
import TimeInputAmPm, { convertTo24h, isValidTime12 } from './TimeInputAmPm';

import { detectScheduleOverlap } from '../utils/modeScheduling';

const DATE_LATAM_RE = /^\d{2}-\d{2}-\d{4}$/;

function formatDateInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + '-' + digits.slice(2);
  return digits.slice(0, 2) + '-' + digits.slice(2, 4) + '-' + digits.slice(4);
}

function latamToIso(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ScheduleSheet({ visible, onClose, modeId, existingActivations, modes, onSave }) {
  const { theme } = useTheme();
  const [type, setType] = useState('recurrente');
  const [date, setDate] = useState('');
  const [days, setDays] = useState([]);
  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('');
  const [startPM, setStartPM] = useState(false);
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('');
  const [endPM, setEndPM] = useState(false);
  const [showConflict, setShowConflict] = useState(null);
  const [saveError, setSaveError] = useState('');

  const modeName = (modes || []).find(m => m.id === modeId)?.name || '';
  const clearError = () => setSaveError('');

  const buildActivation = () => {
    const st = convertTo24h(startHour, startMin, startPM);
    const et = convertTo24h(endHour, endMin, endPM);
    return {
      type,
      modeId,
      ...(type === 'evento' ? { date: DATE_LATAM_RE.test(date) ? latamToIso(date) : '' } : { days }),
      startTime: st,
      endTime: et,
    };
  };

  const isPreviewValid = () => {
    if (!isValidTime12(startHour, startMin) || !isValidTime12(endHour, endMin)) return false;
    if (type === 'evento') {
      if (!DATE_LATAM_RE.test(date)) return false;
      const iso = latamToIso(date);
      return !isNaN(new Date(iso + 'T00:00:00').getTime());
    }
    return days.length > 0;
  };

  const handleSave = () => {
    if (type === 'evento') {
      if (!DATE_LATAM_RE.test(date) || isNaN(new Date(latamToIso(date) + 'T00:00:00').getTime())) {
        setSaveError('Fecha inválida. Usá formato DD-MM-AAAA.');
        return;
      }
    }
    if (!isValidTime12(startHour, startMin)) { setSaveError('Hora de inicio inválida. Usá hora 1-12 y minutos 0-59.'); return; }
    if (!isValidTime12(endHour, endMin)) { setSaveError('Hora de fin inválida. Usá hora 1-12 y minutos 0-59.'); return; }
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
    setType('recurrente'); setDate(''); setDays([]);
    setStartHour(''); setStartMin(''); setStartPM(false);
    setEndHour(''); setEndMin(''); setEndPM(false);
    setShowConflict(null); setSaveError('');
    onClose();
  };

  const dayLabel = (d) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d] || '';

  const previewActivations = isPreviewValid()
    ? [...(existingActivations || []), buildActivation()]
    : (existingActivations || []);

  return (
    <>
      <BottomSheetModal visible={visible} onClose={resetAndClose} title="PROGRAMAR HORARIO">
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.content}>
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
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>FECHA DEL EVENTO</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
                  placeholder="30-05-2026"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={date}
                  onChangeText={v => { setDate(formatDateInput(v)); clearError(); }}
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
              <View style={{ flex: 1 }}>
                <TimeInputAmPm
                  label="HORA INICIO"
                  hour={startHour}
                  minute={startMin}
                  isPM={startPM}
                  onChangeHour={v => { setStartHour(v); clearError(); }}
                  onChangeMinute={v => { setStartMin(v); clearError(); }}
                  onChangeAmPm={setStartPM}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TimeInputAmPm
                  label="HORA FIN"
                  hour={endHour}
                  minute={endMin}
                  isPM={endPM}
                  onChangeHour={v => { setEndHour(v); clearError(); }}
                  onChangeMinute={v => { setEndMin(v); clearError(); }}
                  onChangeAmPm={setEndPM}
                />
              </View>
            </View>

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
                      Se cruza con "{conflictName}" el {dayLabel(first.overlapDay)} de {first.overlapStart} a {first.overlapEnd}
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

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
              <Text style={{ color: theme.accentText, fontSize: 15, fontWeight: '900', letterSpacing: 2 }}>GUARDAR HORARIO</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheetModal>

      <CenterModal visible={showConflict !== null} onClose={() => setShowConflict(null)}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.conflictTitle, { color: theme.text }]}>CRUCE DE HORARIOS</Text>
          <Text style={[styles.conflictBody, { color: theme.textMuted }]}>
            El catálogo "{modeName}" se cruza con "{showConflict?.name}" el {dayLabel(showConflict?.day)} de {showConflict?.start} a {showConflict?.end}.
            {'\n\n'}¿Qué querés hacer?
          </Text>
          <TouchableOpacity
            style={[styles.conflictBtn, { backgroundColor: theme.accent }]}
            onPress={() => { onSave(showConflict.activation, true); setShowConflict(null); resetAndClose(); }}
          >
            <Text style={{ color: theme.accentText, fontWeight: '800', fontSize: 13, letterSpacing: 1 }}>REEMPLAZAR EN EL CRUCE</Text>
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
  content: { paddingHorizontal: 16 },
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
