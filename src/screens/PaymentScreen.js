import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, Image, Alert, ScrollView, Animated,
  ActivityIndicator, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  loadBankConfig, loadWhatsAppNumber,
} from '../utils/businessConfig';

export default function PaymentScreen({ route, navigation }) {
  const { order } = route.params;
  const { addSale } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashGiven, setCashGiven] = useState('');
  const [voucherImage, setVoucherImage] = useState(null);
  const [bankConfig, setBankConfig] = useState(null);
  const [waNumber, setWaNumber] = useState(null);
  const [completing, setCompleting] = useState(false);

  const snackAnim = useRef(new Animated.Value(80)).current;
  const snackOpacity = useRef(new Animated.Value(0)).current;

  const change = cashGiven ? parseFloat(cashGiven) - order.total : 0;
  const quickAmounts = [1, 2, 5, 10, 20];

  useEffect(() => {
    (async () => {
      setBankConfig(await loadBankConfig());
      setWaNumber(await loadWhatsAppNumber());
    })();
  }, []);

  const showSnack = () => {
    Animated.parallel([
      Animated.spring(snackAnim, { toValue: 0, useNativeDriver: true, tension: 80 }),
      Animated.timing(snackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(snackAnim, { toValue: 80, duration: 250, useNativeDriver: true }),
        Animated.timing(snackOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => navigation.popToTop());
    }, 1500);
  };

  const handleComplete = async () => {
    setCompleting(true);
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
    await addSale(saleData);
    setCompleting(false);
    showSnack();
  };

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

  const canComplete =
    (paymentMethod === 'cash' && cashGiven !== '' && change >= 0) ||
    paymentMethod === 'transfer';

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
            <Text style={[styles.methodText, { color: theme.textSecondary },
              paymentMethod === 'cash' && { color: theme.accentText }]}>Efectivo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              paymentMethod === 'transfer' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => { setPaymentMethod('transfer'); setCashGiven(''); }}
          >
            <Text style={[styles.methodText, { color: theme.textSecondary },
              paymentMethod === 'transfer' && { color: theme.accentText }]}>Transferencia</Text>
          </TouchableOpacity>
        </View>

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
                <Text style={[styles.noBankText, { color: theme.textMuted }]}>Sin datos bancarios</Text>
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
                  <Text style={[styles.voucherText, { color: theme.textSecondary }]}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voucherBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={pickVoucherFromGallery}
                >
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
            style={[styles.doneBtn, { backgroundColor: theme.accent },
              (!canComplete || completing) && { opacity: 0.3 }]}
            onPress={handleComplete}
            disabled={!canComplete || completing}
          >
            {completing
              ? <ActivityIndicator color={theme.accentText} />
              : <Text style={[styles.doneText, { color: theme.accentText }]}>REGISTRAR</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* SNACKBAR */}
      <Animated.View
        style={[
          styles.snack,
          { backgroundColor: theme.success },
          { transform: [{ translateY: snackAnim }], opacity: snackOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.snackText}>Venta registrada · ${order.total.toFixed(2)}</Text>
      </Animated.View>

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
  scroll: { paddingBottom: 120 },
  totalSection: { alignItems: 'center', paddingVertical: 30, marginHorizontal: 16, borderBottomWidth: 1 },
  totalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  totalAmount: { fontSize: 56, fontWeight: '900', marginTop: 6 },
  totalDetail: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  methodSection: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 24 },
  methodBtn: { flex: 1, borderRadius: 14, paddingVertical: 18, alignItems: 'center', borderWidth: 1 },
  methodText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
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
  voucherBtn: { flex: 1, borderRadius: 14, paddingVertical: 22, alignItems: 'center', borderWidth: 1 },
  voucherText: { fontSize: 13, fontWeight: '700' },
  voucherWrap: { position: 'relative' },
  voucherImg: { width: '100%', height: 180, borderRadius: 14, resizeMode: 'cover' },
  voucherRemove: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  voucherRemoveText: { fontSize: 16, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, borderTopWidth: 1 },
  doneBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  doneText: { fontSize: 16, fontWeight: '900', letterSpacing: 4 },
  snack: {
    position: 'absolute', bottom: 34, left: 16, right: 16,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20,
    alignItems: 'center',
  },
  snackText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});