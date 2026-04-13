import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { methodLabel } from '../utils/formatters';
import ScreenHeader from '../components/ScreenHeader';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  loadWhatsAppNumber, loadBankConfig,
  buildTransferMessage, buildTicketMessage,
} from '../utils/businessConfig';

const WA_COLOR = '#25D366';

const buildCSV = (sales) => {
  const header = [
    'No. Pedido', 'Hora', 'Producto', 'Tamaño',
    'Cantidad', 'Total', 'Método de pago', 'Cajero',
    'Latitud', 'Longitud', 'Precisión (m)',
  ].join(',');

  const rows = sales.map(s => {
    const hora = new Date(s.timestamp).toLocaleTimeString('es-SV', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    return [
      `#${s.orderNumber || s.id.slice(-4)}`,
      hora,
      `"${s.productName}"`,
      `"${s.size}"`,
      s.quantity,
      s.total.toFixed(2),
      s.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
      `"${s.workerName || ''}"`,
      s.geo?.latitude ?? '',
      s.geo?.longitude ?? '',
      s.geo?.accuracy != null ? Math.round(s.geo.accuracy) : '',
    ].join(',');
  });

  return [header, ...rows].join('\n');
};

export default function SalesScreen({ navigation }) {
  const { getTodaySales } = useApp();
  const { theme } = useTheme();

  const sales = getTodaySales().reverse();
  const total = sales.reduce((s, v) => s + v.total, 0);
  const cashTotal = sales.filter(s => s.paymentMethod === 'cash').reduce((s, v) => s + v.total, 0);
  const transferTotal = sales.filter(s => s.paymentMethod === 'transfer').reduce((s, v) => s + v.total, 0);

  const [waNumber, setWaNumber] = useState(null);
  const [bankConfig, setBankConfig] = useState(null);
  const [activeWa, setActiveWa] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setWaNumber(await loadWhatsAppNumber());
      setBankConfig(await loadBankConfig());
    })();
  }, []);

  const handleWaTap = async (sale) => {
    setActiveWa(sale.id);
    const message = sale.paymentMethod === 'transfer' && bankConfig
      ? buildTransferMessage(sale, bankConfig)
      : buildTicketMessage(sale);
    await Linking.openURL(`https://wa.me/503${waNumber}?text=${message}`);
    setTimeout(() => setActiveWa(null), 800);
  };

  const handleExportCSV = async () => {
    if (sales.length === 0) {
      Alert.alert('Sin ventas', 'No hay ventas del día para exportar.');
      return;
    }
    const withGeo = sales.filter(s => s.geo?.latitude != null).length;
    if (withGeo === 0) {
      Alert.alert('Sin ubicaciones', 'Ninguna venta del día tiene ubicación registrada.');
      return;
    }
    try {
      setExporting(true);
      const today = new Date().toISOString().slice(0, 10);
      const path = FileSystem.documentDirectory + `ventas_${today}.csv`;
      await FileSystem.writeAsStringAsync(path, buildCSV(sales));
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo generar el archivo.');
    } finally {
      setExporting(false);
    }
  };

  const geoCount = sales.filter(s => s.geo?.latitude != null).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title="VENTAS HOY"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={[
              styles.exportBtn,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              exporting && { opacity: 0.4 },
            ]}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            <Feather name="download" size={16} color={theme.text} />
            {geoCount > 0 && (
              <View style={[styles.geoBadge, { backgroundColor: theme.success }]}>
                <Text style={styles.geoBadgeText}>{geoCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <View style={styles.summaryRow}>
        <View style={[styles.summaryMain, { backgroundColor: theme.accent }]}>
          <Text style={[styles.summaryLabel, { color: theme.accentText, opacity: 0.5 }]}>TOTAL</Text>
          <Text style={[styles.summaryAmount, { color: theme.accentText }]}>${total.toFixed(2)}</Text>
          <Text style={[styles.summaryCount, { color: theme.accentText, opacity: 0.5 }]}>
            {sales.length} {sales.length === 1 ? 'venta' : 'ventas'}
          </Text>
        </View>
        <View style={styles.summaryCol}>
          <View style={[styles.summaryMini, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.miniLabel, { color: theme.textMuted }]}>EFECTIVO</Text>
            <Text style={[styles.miniAmount, { color: theme.text }]}>${cashTotal.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryMini, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.miniLabel, { color: theme.textMuted }]}>TRANSFER</Text>
            <Text style={[styles.miniAmount, { color: theme.text }]}>${transferTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sales.map((sale) => {
          const isWaActive = activeWa === sale.id;
          const orderDisplay = sale.orderNumber ? `#${sale.orderNumber}` : `#${sale.id.slice(-4)}`;
          const hasGeo = sale.geo?.latitude != null;
          return (
            <TouchableOpacity
              key={sale.id}
              style={[styles.saleRow, { borderColor: theme.cardBorder }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SaleDetail', { sale })}
            >
              <View style={styles.saleLeft}>
                <View style={[styles.saleIndex, { backgroundColor: theme.card }]}>
                  <Text style={[styles.saleIndexText, { color: theme.textMuted }]}>{orderDisplay}</Text>
                  {hasGeo && (
                    <Feather name="map-pin" size={9} color={theme.success} style={{ marginTop: 2 }} />
                  )}
                </View>
                <View>
                  <Text style={[styles.saleName, { color: theme.text }]}>{sale.productName}</Text>
                  <Text style={[styles.saleDetail, { color: theme.textMuted }]}>
                    {sale.size} · {sale.quantity}x · {methodLabel(sale.paymentMethod)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.saleRight}>
                <Text style={[styles.saleAmount, { color: theme.text }]}>${sale.total.toFixed(2)}</Text>
                {waNumber && (
                  <TouchableOpacity
                    style={[
                      styles.waBtn,
                      isWaActive
                        ? { backgroundColor: WA_COLOR, borderColor: WA_COLOR }
                        : { backgroundColor: 'transparent', borderColor: WA_COLOR },
                    ]}
                    onPress={() => handleWaTap(sale)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="whatsapp" size={16} color={isWaActive ? '#fff' : WA_COLOR} />
                  </TouchableOpacity>
                )}
                <Feather name="chevron-right" size={18} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}

        {sales.length === 0 && (
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sin ventas aún</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  exportBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  geoBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  geoBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 8, marginBottom: 20 },
  summaryMain: { flex: 1, borderRadius: 18, padding: 20 },
  summaryLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  summaryAmount: { fontSize: 34, fontWeight: '900', marginTop: 4 },
  summaryCount: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  summaryCol: { gap: 10 },
  summaryMini: {
    flex: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, minWidth: 120, justifyContent: 'center',
  },
  miniLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  miniAmount: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  saleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1,
  },
  saleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  saleIndex: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  saleIndexText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  saleName: { fontSize: 15, fontWeight: '700' },
  saleDetail: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  saleRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saleAmount: { fontSize: 16, fontWeight: '900' },
  waBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '700' },
});
