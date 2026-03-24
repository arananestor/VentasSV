import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, 
  TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  loadWhatsAppNumber, loadBankConfig,
  buildTransferMessage, buildTicketMessage,
} from '../utils/businessConfig';

const WA_COLOR = '#25D366';

export default function SalesScreen({ navigation }) {
  const { getTodaySales } = useApp();
  const { theme } = useTheme();

  const sales = getTodaySales().reverse();
  const total = sales.reduce((s, v) => s + v.total, 0);
  const cashTotal = sales.filter(s => s.paymentMethod === 'cash').reduce((s, v) => s + v.total, 0);
  const transferTotal = sales.filter(s => s.paymentMethod === 'transfer').reduce((s, v) => s + v.total, 0);

  const [waNumber, setWaNumber] = useState(null);
  const [bankConfig, setBankConfig] = useState(null);
  const [activeWa, setActiveWa] = useState(null); // sale.id activo

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

  const methodLabel = (m) => ({ cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' }[m] || m);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>VENTAS HOY</Text>
        <View style={{ width: 44 }} />
      </View>

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
          return (
            <TouchableOpacity
              key={sale.id}
              style={[styles.saleRow, { borderColor: theme.cardBorder }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SaleDetail', { sale })}
            >
              <View style={styles.saleLeft}>
                <View style={[styles.saleIndex, { backgroundColor: theme.card }]}>
                  <Text style={[styles.saleIndexText, { color: theme.textMuted }]}>
                    {orderDisplay}
                  </Text>
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
                    <MaterialCommunityIcons
                      name="whatsapp"
                      size={16}
                      color={isWaActive ? '#fff' : WA_COLOR}
                    />
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
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
  waBtn: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '700' },
});