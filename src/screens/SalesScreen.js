import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Modal, TextInput, Alert, Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [pendingSale, setPendingSale] = useState(null);

  useEffect(() => {
    (async () => {
      setWaNumber(await loadWhatsAppNumber());
      setBankConfig(await loadBankConfig());
    })();
  }, []);

  const handleWaTap = (sale) => {
    setPendingSale(sale);
    setClientPhone('');
    setShowPhoneModal(true);
  };

  const sendWhatsApp = () => {
    const cleaned = clientPhone.replace(/\D/g, '');
    if (cleaned.length < 8) { Alert.alert('', 'Ingresá un número válido'); return; }
    const message = pendingSale.paymentMethod === 'transfer' && bankConfig
      ? buildTransferMessage(pendingSale, bankConfig)
      : buildTicketMessage(pendingSale);
    Linking.openURL(`https://wa.me/503${cleaned}?text=${message}`);
    setShowPhoneModal(false);
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
        {sales.map((sale, i) => (
          <TouchableOpacity
            key={sale.id}
            style={[styles.saleRow, { borderColor: theme.cardBorder }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SaleDetail', { sale })}
          >
            <View style={styles.saleLeft}>
              <View style={[styles.saleIndex, { backgroundColor: theme.card }]}>
                <Text style={[styles.saleIndexText, { color: theme.textMuted }]}>
                  {sales.length - i}
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
                  style={[styles.waBtn, { borderColor: WA_COLOR }]}
                  onPress={(e) => { e.stopPropagation?.(); handleWaTap(sale); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="message-circle" size={15} color={WA_COLOR} />
                </TouchableOpacity>
              )}
              <Feather name="chevron-right" size={18} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

        {sales.length === 0 && (
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sin ventas aún</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showPhoneModal} transparent animationType="slide">
        <View style={[styles.phoneOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.phoneModal, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.phoneTitle, { color: theme.text }]}>ENVIAR POR WHATSAPP</Text>
            <Text style={[styles.phoneSub, { color: theme.textMuted }]}>Número del cliente</Text>
            <View style={[styles.phoneInputRow, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
              <Text style={[styles.phonePrefix, { color: theme.textMuted }]}>+503</Text>
              <TextInput
                style={[styles.phoneInput, { color: theme.text }]}
                value={clientPhone}
                onChangeText={setClientPhone}
                placeholder="7000-0000"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                maxLength={12}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: theme.accent }]}
              onPress={sendWhatsApp}
            >
              <Text style={[styles.sendBtnText, { color: theme.accentText }]}>ABRIR WHATSAPP →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPhoneModal(false)}>
              <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  saleIndex: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saleIndexText: { fontSize: 12, fontWeight: '800' },
  saleName: { fontSize: 15, fontWeight: '700' },
  saleDetail: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  saleRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saleAmount: { fontSize: 16, fontWeight: '900' },
  waBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, fontWeight: '700' },
  phoneOverlay: { flex: 1, justifyContent: 'flex-end' },
  phoneModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 48, borderWidth: 1 },
  phoneTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 6 },
  phoneSub: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, marginBottom: 16 },
  phonePrefix: { fontSize: 18, fontWeight: '700', marginRight: 10 },
  phoneInput: { flex: 1, fontSize: 24, fontWeight: '700', paddingVertical: 16 },
  sendBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 10 },
  sendBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
});