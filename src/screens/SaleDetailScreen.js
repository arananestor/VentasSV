import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SaleDetailScreen({ route, navigation }) {
  const { sale } = route.params;
  const { theme } = useTheme();
  const date = new Date(sale.timestamp);

  const formatTime = (d) => {
    const h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  };
  const formatDate = (d) => {
    const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>DETALLE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: theme.text }]}>${sale.total.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statusText, { color: theme.textMuted }]}>COMPLETADA</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {[
            { label: 'FECHA', value: formatDate(date) },
            { label: 'HORA', value: formatTime(date) },
            { label: 'MÉTODO', value: sale.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Tarjeta' },
            { label: 'CAJERO', value: sale.workerName || 'Sin asignar' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PRODUCTO</Text>
        <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.productName, { color: theme.text }]}>{sale.productName}</Text>
          {[
            { l: 'Tamaño', v: sale.size },
            { l: 'Cantidad', v: `${sale.quantity}x` },
            ...(sale.toppings?.length ? [{ l: 'Extras', v: sale.toppings.join(', ') }] : []),
          ].map((r, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{r.l}</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{r.v}</Text>
            </View>
          ))}
        </View>

        {sale.paymentMethod === 'cash' && sale.cashGiven && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PAGO EN EFECTIVO</Text>
            <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Recibido</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>${sale.cashGiven.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Vuelto</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>${(sale.change || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {sale.voucherImage && (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>VOUCHER</Text>
            <Image source={{ uri: sale.voucherImage }} style={styles.voucherImg} />
          </View>
        )}

        <View style={[styles.idSection, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.idLabel, { color: theme.textMuted }]}>ID</Text>
          <Text style={[styles.idValue, { color: theme.textMuted }]}>#{sale.id}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backText: { fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  amountSection: { alignItems: 'center', paddingVertical: 30 },
  amount: { fontSize: 52, fontWeight: '900' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5, marginTop: 10, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoCard: { width: '48%', borderRadius: 14, padding: 16, borderWidth: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  productCard: { borderRadius: 16, padding: 18, borderWidth: 1 },
  productName: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700' },
  voucherImg: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'cover' },
  idSection: { alignItems: 'center', marginTop: 30, paddingVertical: 16, borderTopWidth: 1 },
  idLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  idValue: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});