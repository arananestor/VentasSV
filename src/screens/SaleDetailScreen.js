import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Image, ScrollView, ActivityIndicator, Modal, TextInput,
  Alert, Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { printTicket, shareTicket } from '../utils/ticketPrinter';
import {
  loadBankConfig, loadWhatsAppNumber,
  buildTransferMessage, buildTicketMessage,
} from '../utils/businessConfig';

const SHARE_COLOR = '#0A84FF';
const WA_COLOR = '#25D366';

export default function SaleDetailScreen({ route, navigation }) {
  const { sale } = route.params;
  const { theme } = useTheme();

  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [waNumber, setWaNumber] = useState(null);
  const [bankConfig, setBankConfig] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [waPendingAction, setWaPendingAction] = useState(null);

  const date = new Date(sale.timestamp);

  const formatTime = (d) => {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (d) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  useEffect(() => {
    (async () => {
      setWaNumber(await loadWhatsAppNumber());
      setBankConfig(await loadBankConfig());
    })();
  }, []);

  const handlePrint = async () => {
    setIsPrinting(true);
    await printTicket(sale);
    setIsPrinting(false);
  };

  const handleShare = async () => {
    setIsSharing(true);
    await shareTicket(sale);
    setIsSharing(false);
  };

  const handleWhatsApp = (action) => {
    setWaPendingAction(action);
    setClientPhone('');
    setShowPhoneModal(true);
  };

  const sendWhatsApp = () => {
    const cleaned = clientPhone.replace(/\D/g, '');
    if (cleaned.length < 8) { Alert.alert('', 'Ingresá un número válido'); return; }
    const message = waPendingAction === 'transfer' && bankConfig
      ? buildTransferMessage(sale, bankConfig)
      : buildTicketMessage(sale);
    Linking.openURL(`https://wa.me/503${cleaned}?text=${message}`);
    setShowPhoneModal(false);
  };

  const methodLabel = {
    cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta',
  }[sale.paymentMethod] || sale.paymentMethod;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>DETALLE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: theme.text }]}>${sale.total.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.statusText, { color: theme.textMuted }]}>COMPLETADA</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {[
            { label: 'FECHA', value: formatDate(date) },
            { label: 'HORA', value: formatTime(date) },
            { label: 'MÉTODO', value: methodLabel },
            { label: 'CAJERO', value: sale.workerName || '—' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PRODUCTO</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.productName, { color: theme.text }]}>{sale.productName}</Text>
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
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
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PAGO</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Recibido</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>${sale.cashGiven.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Vuelto</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>${(sale.change || 0).toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}

        {sale.voucherImage && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>COMPROBANTE</Text>
            <Image source={{ uri: sale.voucherImage }} style={styles.voucherImg} />
          </>
        )}

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TICKET</Text>

        {isPrinting || isSharing ? (
          <ActivityIndicator color={theme.text} size="large" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.actionRow}>
            {/* Imprimir — sólido accent */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
              onPress={handlePrint}
            >
              <Feather name="printer" size={18} color={theme.accentText} />
              <Text style={[styles.actionLabel, { color: theme.accentText }]}>Imprimir</Text>
            </TouchableOpacity>

            {/* Compartir — outline azul */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: SHARE_COLOR }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={18} color={SHARE_COLOR} />
              <Text style={[styles.actionLabel, { color: SHARE_COLOR }]}>Compartir</Text>
            </TouchableOpacity>

            {/* WhatsApp — outline verde */}
            {waNumber && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: WA_COLOR }]}
                onPress={() => handleWhatsApp(sale.paymentMethod === 'transfer' ? 'transfer' : 'ticket')}
              >
                <Feather name="message-circle" size={18} color={WA_COLOR} />
                <Text style={[styles.actionLabel, { color: WA_COLOR }]}>WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={[styles.idSection, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.idValue, { color: theme.textMuted }]}>#{sale.id}</Text>
        </View>

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
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  amountSection: { alignItems: 'center', paddingVertical: 30 },
  amount: { fontSize: 52, fontWeight: '900' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  infoCard: { width: '48%', borderRadius: 14, padding: 16, borderWidth: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  card: { borderRadius: 16, padding: 18, borderWidth: 1 },
  productName: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  divider: { height: 1, marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700' },
  voucherImg: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'cover' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, gap: 6,
  },
  actionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  idSection: { alignItems: 'center', marginTop: 30, paddingVertical: 16, borderTopWidth: 1 },
  idValue: { fontSize: 11, fontWeight: '600' },
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