import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, Modal, Image, Alert, ScrollView,
  ActivityIndicator, Linking, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { printTicket, shareTicket } from '../utils/ticketPrinter';
import {
  loadBankConfig, loadWhatsAppNumber,
  buildTransferMessage, buildTicketMessage,
} from '../utils/businessConfig';

const { height } = Dimensions.get('window');

export default function PaymentScreen({ route, navigation }) {
  const { order } = route.params;
  const { addSale } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashGiven, setCashGiven] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [voucherImage, setVoucherImage] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const [bankConfig, setBankConfig] = useState(null);
  const [waNumber, setWaNumber] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [waPendingAction, setWaPendingAction] = useState(null);

  const change = cashGiven ? parseFloat(cashGiven) - order.total : 0;
  const quickAmounts = [1, 2, 5, 10, 20];

  useEffect(() => {
    (async () => {
      const bc = await loadBankConfig();
      const wa = await loadWhatsAppNumber();
      setBankConfig(bc);
      setWaNumber(wa);
    })();
  }, []);

  const takeVoucherPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('', 'Necesitamos la cámara'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setVoucherImage(result.assets[0].uri);
  };

  const pickVoucherFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) setVoucherImage(result.assets[0].uri);
  };

  const handleComplete = async () => {
    const saleData = {
      productId: order.product.id,
      productName: order.product.name,
      size: order.size.name,
      toppings: order.toppings,
      quantity: order.quantity,
      total: order.total,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
      change: paymentMethod === 'cash' ? change : null,
      voucherImage: paymentMethod === 'transfer' ? voucherImage : null,
      workerId: currentWorker?.id || null,
      workerName: currentWorker?.name || 'Sin asignar',
    };
    const newSale = await addSale(saleData);
    setCompletedSale(newSale);
    setShowSuccess(true);
  };

  const handleWhatsApp = (action) => {
    setWaPendingAction(action);
    setClientPhone('');
    setShowPhoneModal(true);
  };

  const sendWhatsApp = () => {
    const cleaned = clientPhone.replace(/\D/g, '');
    if (cleaned.length < 8) { Alert.alert('', 'Ingresá un número válido'); return; }
    const fullNumber = `503${cleaned}`;
    let message = '';
    if (waPendingAction === 'transfer' && bankConfig) {
      message = buildTransferMessage(
        { ...order, id: completedSale?.id || 'XXXX', productName: order.product.name },
        bankConfig
      );
    } else {
      message = buildTicketMessage(
        completedSale || { ...order, productName: order.product.name, id: 'XXXX' }
      );
    }
    Linking.openURL(`https://wa.me/${fullNumber}?text=${message}`);
    setShowPhoneModal(false);
  };

  const handlePrint = async () => {
    if (!completedSale) return;
    setIsPrinting(true);
    await printTicket(completedSale);
    setIsPrinting(false);
    handleDone();
  };

  const handleShare = async () => {
    if (!completedSale) return;
    setIsPrinting(true);
    await shareTicket(completedSale);
    setIsPrinting(false);
    handleDone();
  };

  const handleDone = () => {
    setShowSuccess(false);
    navigation.popToTop();
  };

  const canComplete =
    (paymentMethod === 'cash' && cashGiven !== '' && change >= 0) ||
    (paymentMethod === 'transfer');

  // ── SUCCESS SCREEN ──────────────────────────────────────
  if (showSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

        {/* TOP — confirmación */}
        <View style={styles.successTop}>
          <View style={[styles.successDot, { backgroundColor: theme.success }]} />
          <Text style={[styles.successLabel, { color: theme.textMuted }]}>VENTA REGISTRADA</Text>
          <Text style={[styles.successAmount, { color: theme.text }]}>
            ${order.total.toFixed(2)}
          </Text>
          <Text style={[styles.successDetail, { color: theme.textMuted }]}>
            {order.quantity}x {order.size.name} · {order.product.name}
          </Text>
          <Text style={[styles.successWorker, { color: theme.textMuted }]}>
            {currentWorker?.name || '—'}
          </Text>
        </View>

        {/* MIDDLE — acciones primarias */}
        {isPrinting ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.text} size="large" />
          </View>
        ) : (
          <View style={styles.successActions}>

            {/* Fila principal — WhatsApp + Imprimir */}
            <View style={styles.primaryRow}>
              {waNumber ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => handleWhatsApp(paymentMethod === 'transfer' ? 'transfer' : 'ticket')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.primaryBtnEmoji}>💬</Text>
                  <Text style={[styles.primaryBtnLabel, { color: theme.text }]}>WhatsApp</Text>
                  <Text style={[styles.primaryBtnSub, { color: theme.textMuted }]}>
                    {paymentMethod === 'transfer' ? 'Datos de pago' : 'Ticket al cliente'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: theme.accent },
                  !waNumber && { flex: 1 },
                ]}
                onPress={handlePrint}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryBtnEmoji}>🖨️</Text>
                <Text style={[styles.primaryBtnLabel, { color: theme.accentText }]}>Imprimir</Text>
                <Text style={[styles.primaryBtnSub, { color: theme.mode === 'dark' ? '#666' : '#999' }]}>
                  Ticket físico
                </Text>
              </TouchableOpacity>
            </View>

            {/* Secundario — Compartir PDF */}
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
                📤  Compartir PDF
              </Text>
            </TouchableOpacity>

          </View>
        )}

        {/* BOTTOM — continuar */}
        <TouchableOpacity style={styles.doneLink} onPress={handleDone}>
          <Text style={[styles.doneLinkText, { color: theme.textMuted }]}>Continuar</Text>
        </TouchableOpacity>

        {/* PHONE MODAL */}
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

  // ── COBRO SCREEN ────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>COBRAR</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={[styles.totalSection, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.totalLabel, { color: theme.textMuted }]}>TOTAL</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>${order.total.toFixed(2)}</Text>
          <Text style={[styles.totalDetail, { color: theme.textMuted }]}>
            {order.quantity}x {order.size.name} · {order.product.name}
          </Text>
        </View>

        <View style={styles.methodSection}>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              paymentMethod === 'cash' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => { setPaymentMethod('cash'); setVoucherImage(null); }}
          >
            <Text style={styles.methodEmoji}>💵</Text>
            <Text style={[styles.methodText, { color: theme.textSecondary },
              paymentMethod === 'cash' && { color: theme.accentText }]}>Efectivo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              paymentMethod === 'transfer' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => { setPaymentMethod('transfer'); setCashGiven(''); }}
          >
            <Text style={styles.methodEmoji}>🏦</Text>
            <Text style={[styles.methodText, { color: theme.textSecondary },
              paymentMethod === 'transfer' && { color: theme.accentText }]}>Transferencia</Text>
          </TouchableOpacity>
        </View>

        {/* EFECTIVO */}
        {paymentMethod === 'cash' && (
          <View style={styles.cashSection}>
            <View style={styles.quickGrid}>
              {quickAmounts.map(a => (
                <TouchableOpacity key={a}
                  style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    parseFloat(cashGiven) === a && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => setCashGiven(a.toString())}
                >
                  <Text style={[styles.quickBtnText, { color: theme.textSecondary },
                    parseFloat(cashGiven) === a && { color: theme.accentText }]}>${a}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  parseFloat(cashGiven) === order.total && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                onPress={() => setCashGiven(order.total.toString())}
              >
                <Text style={[styles.quickBtnText, { color: theme.textSecondary, fontSize: 11 },
                  parseFloat(cashGiven) === order.total && { color: theme.accentText }]}>EXACTO</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.inputDollar, { color: theme.text }]}>$</Text>
              <TextInput
                style={[styles.cashInput, { color: theme.text }]}
                value={cashGiven} onChangeText={setCashGiven}
                keyboardType="numeric" placeholder="0.00"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {cashGiven !== '' && (
              <View style={[styles.changeBox,
                change >= 0 ? { backgroundColor: theme.accent } : { backgroundColor: theme.danger }]}>
                <Text style={[styles.changeLabel, { color: theme.accentText }]}>
                  {change > 0 ? 'VUELTO' : change === 0 ? '¡JUSTO!' : 'FALTA'}
                </Text>
                <Text style={[styles.changeAmount, { color: theme.accentText }]}>
                  ${Math.abs(change).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TRANSFERENCIA */}
        {paymentMethod === 'transfer' && (
          <View style={styles.transferSection}>
            {bankConfig ? (
              <View style={[styles.bankCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.bankCardLabel, { color: theme.textMuted }]}>DATOS PARA TRANSFERIR</Text>
                <View style={styles.bankRow}>
                  <Text style={[styles.bankKey, { color: theme.textMuted }]}>Banco</Text>
                  <Text style={[styles.bankVal, { color: theme.text }]}>{bankConfig.bank}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.bankRow}>
                  <Text style={[styles.bankKey, { color: theme.textMuted }]}>Titular</Text>
                  <Text style={[styles.bankVal, { color: theme.text }]}>{bankConfig.holder}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.bankRow}>
                  <Text style={[styles.bankKey, { color: theme.textMuted }]}>Cuenta</Text>
                  <Text style={[styles.bankVal, { color: theme.text }]}>{bankConfig.account}</Text>
                </View>
                {bankConfig.qrImage && (
                  <View style={styles.qrSection}>
                    <View style={[styles.divider, { backgroundColor: theme.cardBorder, marginBottom: 16 }]} />
                    <Text style={[styles.bankKey, { color: theme.textMuted, marginBottom: 12 }]}>QR DE PAGO</Text>
                    <Image source={{ uri: bankConfig.qrImage }} style={styles.qrDisplay} />
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.noBankCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.noBankText, { color: theme.textMuted }]}>
                  Sin datos bancarios configurados
                </Text>
                <Text style={[styles.noBankSub, { color: theme.textMuted }]}>
                  Perfil → Configuración de cobro
                </Text>
              </View>
            )}

            <Text style={[styles.voucherLabel, { color: theme.textMuted }]}>COMPROBANTE (opcional)</Text>
            {voucherImage ? (
              <View style={styles.voucherWrap}>
                <Image source={{ uri: voucherImage }} style={styles.voucherImg} />
                <TouchableOpacity
                  style={[styles.voucherRemove, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => setVoucherImage(null)}
                >
                  <Text style={[styles.voucherRemoveText, { color: theme.text }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.voucherBtns}>
                <TouchableOpacity
                  style={[styles.voucherBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={takeVoucherPhoto}
                >
                  <Text style={styles.voucherIcon}>📸</Text>
                  <Text style={[styles.voucherText, { color: theme.textSecondary }]}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voucherBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={pickVoucherFromGallery}
                >
                  <Text style={styles.voucherIcon}>🖼️</Text>
                  <Text style={[styles.voucherText, { color: theme.textSecondary }]}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {paymentMethod && (
        <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }, !canComplete && { opacity: 0.3 }]}
            onPress={handleComplete}
            disabled={!canComplete}
          >
            <Text style={[styles.doneText, { color: theme.accentText }]}>✓  LISTO</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── COBRO ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backText: { fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingBottom: 120 },
  totalSection: { alignItems: 'center', paddingVertical: 30, marginHorizontal: 16, borderBottomWidth: 1 },
  totalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  totalAmount: { fontSize: 56, fontWeight: '900', marginTop: 6 },
  totalDetail: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  methodSection: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 24 },
  methodBtn: { flex: 1, borderRadius: 16, paddingVertical: 22, alignItems: 'center', gap: 8, borderWidth: 1 },
  methodEmoji: { fontSize: 28 },
  methodText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  cashSection: { paddingHorizontal: 16, marginTop: 20 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { width: '31%', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1 },
  quickBtnText: { fontSize: 16, fontWeight: '800' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 18, marginTop: 14, borderWidth: 1 },
  inputDollar: { fontSize: 28, fontWeight: '900' },
  cashInput: { flex: 1, fontSize: 34, fontWeight: '900', paddingVertical: 16, paddingLeft: 8 },
  changeBox: { marginTop: 14, borderRadius: 14, paddingVertical: 22, alignItems: 'center' },
  changeLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  changeAmount: { fontSize: 38, fontWeight: '900', marginTop: 4 },
  transferSection: { paddingHorizontal: 16, marginTop: 20, gap: 16 },
  bankCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  bankCardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  bankKey: { fontSize: 12, fontWeight: '600' },
  bankVal: { fontSize: 15, fontWeight: '700' },
  divider: { height: 1 },
  qrSection: { alignItems: 'center', marginTop: 4 },
  qrDisplay: { width: 160, height: 160, borderRadius: 10 },
  noBankCard: { borderRadius: 16, padding: 20, borderWidth: 1, alignItems: 'center', gap: 6 },
  noBankText: { fontSize: 14, fontWeight: '700' },
  noBankSub: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  voucherLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  voucherBtns: { flexDirection: 'row', gap: 10 },
  voucherBtn: { flex: 1, borderRadius: 16, paddingVertical: 28, alignItems: 'center', gap: 8, borderWidth: 1 },
  voucherIcon: { fontSize: 28 },
  voucherText: { fontSize: 12, fontWeight: '700' },
  voucherWrap: { position: 'relative' },
  voucherImg: { width: '100%', height: 180, borderRadius: 14, resizeMode: 'cover' },
  voucherRemove: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  voucherRemoveText: { fontSize: 16, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, borderTopWidth: 1 },
  doneBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  doneText: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },

  // ── SUCCESS ──
  successTop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successDot: {
    width: 10, height: 10, borderRadius: 5, marginBottom: 20,
  },
  successLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 16,
  },
  successAmount: {
    fontSize: 72, fontWeight: '900', letterSpacing: -2,
  },
  successDetail: {
    fontSize: 14, fontWeight: '600', marginTop: 10,
  },
  successWorker: {
    fontSize: 12, fontWeight: '600', marginTop: 6,
  },
  loadingWrap: {
    height: 180, alignItems: 'center', justifyContent: 'center',
  },
  successActions: {
    paddingHorizontal: 16, paddingBottom: 8, gap: 10,
  },
  primaryRow: {
    flexDirection: 'row', gap: 10,
  },
  primaryBtn: {
    flex: 1, borderRadius: 18, paddingVertical: 22,
    alignItems: 'center', justifyContent: 'center',
    gap: 4, borderWidth: 1,
  },
  primaryBtnEmoji: { fontSize: 26 },
  primaryBtnLabel: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  primaryBtnSub: { fontSize: 11, fontWeight: '500' },
  secondaryBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
  doneLink: {
    paddingVertical: 24, alignItems: 'center',
  },
  doneLinkText: { fontSize: 14, fontWeight: '600' },

  // ── PHONE MODAL ──
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