import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  Pressable, StyleSheet, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { methodLabel } from '../utils/formatters';
import { formatShiftSummaryMessage, shareShiftSummary } from '../utils/shareShiftSummary';

export default function ShiftSummaryModal({
  visible, onClose, onConfirm, worker, summary, deviceType, businessName,
}) {
  const { theme } = useTheme();
  const { showNotif } = useApp();

  const hasSummary = summary && summary.durationMs !== null;

  const handleShare = async () => {
    const msg = formatShiftSummaryMessage(summary, worker, businessName);
    const ok = await shareShiftSummary(msg);
    if (!ok) showNotif('No se pudo compartir el resumen');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header */}
            <View style={styles.header}>
              {worker?.photo ? (
                <Image source={{ uri: worker.photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: worker?.color || theme.accent, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>
                    {worker?.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View>
                <Text style={[styles.name, { color: theme.text }]}>{worker?.name}</Text>
                <Text style={[styles.puesto, { color: theme.textMuted }]}>{worker?.puesto || 'Cajero'}</Text>
              </View>
            </View>

            {!hasSummary && (
              <Text style={[styles.noInfo, { color: theme.textMuted }]}>
                No se registró el inicio de este turno.
              </Text>
            )}

            {hasSummary && (
              <>
                {/* Duration */}
                <View style={[styles.durationCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Feather name="clock" size={18} color={theme.textMuted} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>TIEMPO TRABAJADO</Text>
                    <Text style={[styles.durationValue, { color: theme.text }]}>{summary.durationLabel}</Text>
                  </View>
                </View>

                {/* Total + Tickets grid */}
                <View style={styles.grid}>
                  <View style={[styles.gridItem, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>TOTAL DEL TURNO</Text>
                    <Text style={[styles.gridValue, { color: theme.text }]}>${summary.total.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.gridItem, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>TICKETS</Text>
                    <Text style={[styles.gridValue, { color: theme.text }]}>{summary.ticketCount}</Text>
                  </View>
                </View>

                {/* By method */}
                {Object.keys(summary.byMethod).length > 0 && (
                  <View style={styles.section}>
                    {Object.entries(summary.byMethod).map(([method, amount]) => (
                      <View key={method} style={styles.methodRow}>
                        <Feather
                          name={method === 'cash' ? 'dollar-sign' : method === 'card' ? 'credit-card' : 'smartphone'}
                          size={14} color={theme.textMuted}
                        />
                        <Text style={[styles.methodName, { color: theme.text }]}>{methodLabel(method)}</Text>
                        <Text style={[styles.methodAmount, { color: theme.text }]}>${amount.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Top products */}
                {summary.topProducts.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MÁS VENDIDOS</Text>
                    {summary.topProducts.map(p => (
                      <View key={p.name} style={styles.productRow}>
                        <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                        <Text style={[styles.productUnits, { color: theme.textMuted }]}>x{p.units}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Primary button */}
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.accent }]} onPress={onConfirm}>
              <Text style={[styles.primaryBtnText, { color: theme.accentText }]}>
                {deviceType === 'fixed' ? 'CERRAR TURNO' : 'SALIR'}
              </Text>
            </TouchableOpacity>

            {/* Share button */}
            {hasSummary && summary.ticketCount > 0 && (
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.cardBorder }]} onPress={handleShare}>
                <Feather name="share-2" size={16} color={theme.text} />
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>COMPARTIR RESUMEN</Text>
              </TouchableOpacity>
            )}

            {/* Cancel */}
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: { borderRadius: 24, padding: 24, borderWidth: 1, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  name: { fontSize: 16, fontWeight: '900' },
  puesto: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  noInfo: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  durationCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10,
  },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  durationValue: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  gridItem: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center' },
  gridValue: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  methodName: { flex: 1, fontSize: 14, fontWeight: '600' },
  methodAmount: { fontSize: 14, fontWeight: '800' },
  productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  productName: { fontSize: 14, fontWeight: '600' },
  productUnits: { fontSize: 13, fontWeight: '700' },
  primaryBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, marginTop: 10, borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
