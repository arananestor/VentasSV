import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  Pressable, StyleSheet, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { methodLabel, formatTime } from '../utils/formatters';
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

  const ticketsToShow = hasSummary ? (summary.shiftSales || []) : [];
  const showAll = ticketsToShow.length <= 4;
  const visibleTickets = showAll ? ticketsToShow : ticketsToShow.slice(0, 3);
  const remainingCount = ticketsToShow.length - 3;

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
                <View style={[styles.avatar, {
                  backgroundColor: worker?.role === 'owner' ? theme.accent : (worker?.color || '#1C1C1E'),
                  alignItems: 'center', justifyContent: 'center',
                }]}>
                  <Text style={{ color: worker?.role === 'owner' ? theme.accentText : '#fff', fontSize: 18, fontWeight: '900' }}>
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

                {/* Ticket detail */}
                {visibleTickets.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.detailTitle, { color: theme.textMuted }]}>DETALLE DEL TURNO</Text>
                    {visibleTickets.map((sale, idx) => (
                      <View key={sale.id || idx} style={[styles.ticketCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                        <View style={styles.ticketHeader}>
                          <Text style={[styles.ticketNum, { color: theme.text }]}>#{sale.orderNumber || sale.id?.slice(-4)}</Text>
                          <Text style={[styles.ticketTime, { color: theme.textMuted }]}>{formatTime(sale.timestamp)}</Text>
                        </View>
                        {(sale.items || []).map((item, ii) => (
                          <View key={ii} style={styles.ticketItem}>
                            <Text style={[styles.ticketItemText, { color: theme.text }]}>
                              {item.quantity || 1}x {item.product?.name || item.name}{item.size?.name ? ` · ${item.size.name}` : ''}
                            </Text>
                            {item.extras?.length > 0 && (
                              <Text style={[styles.ticketExtra, { color: theme.textMuted }]}>
                                + {item.extras.map(e => e.name).join(', ')}
                              </Text>
                            )}
                            {item.note ? (
                              <Text style={[styles.ticketExtra, { color: theme.textMuted }]}>Nota: {item.note}</Text>
                            ) : null}
                          </View>
                        ))}
                        <View style={[styles.ticketFooter, { borderTopColor: theme.cardBorder }]}>
                          <Text style={[styles.ticketMethod, { color: theme.textMuted }]}>{methodLabel(sale.paymentMethod || 'cash')}</Text>
                          <Text style={[styles.ticketTotal, { color: theme.text }]}>${(sale.total || 0).toFixed(2)}</Text>
                        </View>
                      </View>
                    ))}
                    {!showAll && (
                      <Text style={[styles.moreTickets, { color: theme.textMuted }]}>+ {remainingCount} tickets más</Text>
                    )}
                  </View>
                )}

                {/* Top products */}
                {summary.productsSummary.length > 0 && (
                  <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 12 }]}>
                    <Text style={[styles.detailTitle, { color: theme.textMuted }]}>MÁS VENDIDOS</Text>
                    {summary.productsSummary.slice(0, 3).map(p => (
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
  detailTitle: { fontSize: 10, fontWeight: '500', letterSpacing: 2.5, marginBottom: 8 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  methodName: { flex: 1, fontSize: 14, fontWeight: '600' },
  methodAmount: { fontSize: 14, fontWeight: '800' },
  ticketCard: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ticketNum: { fontSize: 13, fontWeight: '800' },
  ticketTime: { fontSize: 12, fontWeight: '500' },
  ticketItem: { marginBottom: 4 },
  ticketItemText: { fontSize: 13, fontWeight: '600' },
  ticketExtra: { fontSize: 11, fontWeight: '500', marginLeft: 16, marginTop: 1 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 8, marginTop: 6 },
  ticketMethod: { fontSize: 12, fontWeight: '500' },
  ticketTotal: { fontSize: 13, fontWeight: '800' },
  moreTickets: { textAlign: 'center', fontSize: 12, fontWeight: '600', paddingVertical: 6 },
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
