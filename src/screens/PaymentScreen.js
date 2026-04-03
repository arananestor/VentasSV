import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Image, Alert, ScrollView, Animated,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { printTicket } from '../utils/ticketPrinter';
import {
  loadBankConfig, loadWhatsAppNumber, loadKitchenNumber,
  buildTicketMessage, buildKitchenMessage,
} from '../utils/businessConfig';

const WA_COLOR = '#25D366';

export default function PaymentScreen({ route, navigation }) {
  const { fromCart } = route.params || {};
  const { addSale, cart, clearCart, cartTotal, cartCount } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();

  // Si viene del carrito usamos el carrito, si no viene con order legacy lo soportamos
  const legacyOrder = route.params?.order;
  const isCartMode = fromCart || !legacyOrder;

  const totalAmount = isCartMode ? cartTotal : (legacyOrder?.total || 0);
  const itemCount = isCartMode ? cartCount : 1;

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashGiven, setCashGiven] = useState('');
  const [voucherImage, setVoucherImage] = useState(null);
  const [bankConfig, setBankConfig] = useState(null);
  const [waNumber, setWaNumber] = useState(null);
  const [kitchenNumber, setKitchenNumber] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [completedSales, setCompletedSales] = useState([]);

  const snackAnim = useRef(new Animated.Value(120)).current;
  const snackOpacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef(null);
  const amountInputRef = useRef(null);

  const quickBills = [1, 2, 5, 10, 20];
  const parsedCash = parseFloat(cashGiven) || 0;
  const effectiveAmount = cashGiven !== '' ? parsedCash : totalAmount;
  const change = effectiveAmount - totalAmount;

  useEffect(() => {
    (async () => {
      setBankConfig(await loadBankConfig());
      setWaNumber(await loadWhatsAppNumber());
      setKitchenNumber(await loadKitchenNumber());
      await Location.requestForegroundPermissionsAsync();
    })();
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: loc.coords.accuracy };
    } catch { return null; }
  };

  const showSnack = (sales) => {
    setCompletedSales(sales);
    Animated.parallel([
      Animated.spring(snackAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
      Animated.timing(snackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    // Regresa a Home automáticamente después de 2.5s sin bloquear
    dismissTimer.current = setTimeout(() => dismissSnack(), 2500);
  };

  const dismissSnack = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.parallel([
      Animated.timing(snackAnim, { toValue: 120, duration: 220, useNativeDriver: true }),
      Animated.timing(snackOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => navigation.popToTop());
  };

  const handleComplete = async () => {
    setCompleting(true);
    const geo = await getLocation();
    const savedSales = [];

    if (isCartMode) {
      // Registrar cada ítem del carrito como venta separada
      for (const item of cart) {
        const saleData = {
          productId: item.product.id,
          productName: item.product.name,
          size: item.size?.name || '',
          units: item.units || [],
          extras: item.extras || [],
          note: item.note || '',
          quantity: item.quantity,
          total: item.total,
          paymentMethod,
          cashGiven: paymentMethod === 'cash' ? effectiveAmount : null,
          change: paymentMethod === 'cash' ? change : null,
          voucherImage: paymentMethod === 'transfer' ? voucherImage : null,
          workerId: currentWorker?.id || null,
          workerName: currentWorker?.name || 'Sin asignar',
          geo,
        };
        const sale = await addSale(saleData);
        savedSales.push(sale);
        if (kitchenNumber) {
          const msg = buildKitchenMessage(sale);
          Linking.openURL(`https://wa.me/503${kitchenNumber}?text=${msg}`);
        }
      }
      clearCart();
    } else {
      // Modo legacy — orden individual
      const saleData = {
        productId: legacyOrder.product.id,
        productName: legacyOrder.product.name,
        size: legacyOrder.size?.name || '',
        units: legacyOrder.units || [],
        extras: legacyOrder.toppings || [],
        note: '',
        quantity: legacyOrder.quantity,
        total: legacyOrder.total,
        paymentMethod,
        cashGiven: paymentMethod === 'cash' ? effectiveAmount : null,
        change: paymentMethod === 'cash' ? change : null,
        voucherImage: paymentMethod === 'transfer' ? voucherImage : null,
        workerId: currentWorker?.id || null,
        workerName: currentWorker?.name || 'Sin asignar',
        geo,
      };
      const sale = await addSale(saleData);
      savedSales.push(sale);
    }

    setCompleting(false);
    showSnack(savedSales);
  };

  const handleSnackWhatsApp = () => {
    if (!completedSales.length || !waNumber) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    completedSales.forEach(sale => {
      const msg = buildTicketMessage(sale);
      Linking.openURL(`https://wa.me/503${waNumber}?text=${msg}`);
    });
    dismissSnack();
  };

  const handlePrint = async () => {
    if (!completedSales.length) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    for (const sale of completedSales) { await printTicket(sale); }
    dismissSnack();
  };

  const handleAmountTap = () => {
    setCashGiven('');
    setTimeout(() => amountInputRef.current?.focus(), 50);
  };

  const handleAmountChange = (text) => setCashGiven(text.replace(/[^0-9.]/g, ''));

  const takeVoucherPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setVoucherImage(result.assets[0].uri);
  };

  const pickVoucherFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) setVoucherImage(result.assets[0].uri);
  };

  const canComplete =
    (paymentMethod === 'cash' && effectiveAmount >= totalAmount) ||
    paymentMethod === 'transfer';

  const displayAmount = cashGiven !== '' ? cashGiven : totalAmount.toFixed(2);
  const showChange = paymentMethod === 'cash' && cashGiven !== '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>COBRAR</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        <TouchableOpacity
          style={styles.totalSection}
          onPress={paymentMethod === 'cash' ? handleAmountTap : undefined}
          activeOpacity={paymentMethod === 'cash' ? 0.7 : 1}
        >
          <Text style={[styles.totalLabel, { color: theme.textMuted }]}>TOTAL</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>${displayAmount}</Text>
          <Text style={[styles.totalDetail, { color: theme.textMuted }]}>
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </Text>
          {paymentMethod === 'cash' && (
            <TextInput
              ref={amountInputRef}
              style={styles.hiddenInput}
              value={cashGiven}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              onBlur={() => {}}
            />
          )}
        </TouchableOpacity>

        {showChange && (
          <View style={[styles.changeBar, {
            backgroundColor: change >= 0 ? theme.accent : theme.danger,
          }]}>
            <Text style={[styles.changeBarLabel, { color: theme.accentText }]}>
              {change > 0 ? 'VUELTO' : change === 0 ? 'EXACTO' : 'FALTA'}
            </Text>
            <Text style={[styles.changeBarAmount, { color: theme.accentText }]}>
              ${Math.abs(change).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.methodSection}>
          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              paymentMethod === 'cash' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => { setPaymentMethod('cash'); setCashGiven(''); setVoucherImage(null); }}
          >
            <MaterialCommunityIcons name="cash-multiple" size={28}
              color={paymentMethod === 'cash' ? theme.accentText : theme.textSecondary} />
            <Text style={[styles.methodText, { color: theme.textSecondary },
              paymentMethod === 'cash' && { color: theme.accentText }]}>Efectivo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
              paymentMethod === 'transfer' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => { setPaymentMethod('transfer'); setCashGiven(''); }}
          >
            <MaterialCommunityIcons name="bank-transfer" size={28}
              color={paymentMethod === 'transfer' ? theme.accentText : theme.textSecondary} />
            <Text style={[styles.methodText, { color: theme.textSecondary },
              paymentMethod === 'transfer' && { color: theme.accentText }]}>Transferencia</Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === 'cash' && (
          <View style={styles.cashSection}>
            <View style={styles.billsRow}>
              {quickBills.map(bill => (
                <TouchableOpacity key={bill}
                  style={[styles.billBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    parsedCash === bill && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => { setCashGiven(bill.toString()); amountInputRef.current?.blur(); }}
                >
                  <Text style={[styles.billText, { color: theme.textSecondary },
                    parsedCash === bill && { color: theme.accentText }]}>${bill}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {paymentMethod === 'transfer' && (
          <View style={styles.transferSection}>
            {bankConfig ? (
              <View style={[styles.bankCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.bankCardLabel, { color: theme.textMuted }]}>DATOS PARA TRANSFERIR</Text>
                {[
                  { k: 'Banco', v: bankConfig.bank },
                  { k: 'Titular', v: bankConfig.holder },
                  { k: 'Cuenta', v: bankConfig.account },
                ].map((r, i, arr) => (
                  <View key={r.k}>
                    <View style={styles.bankRow}>
                      <Text style={[styles.bankKey, { color: theme.textMuted }]}>{r.k}</Text>
                      <Text style={[styles.bankVal, { color: theme.text }]}>{r.v}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />}
                  </View>
                ))}
                {bankConfig.qrImage && (
                  <View style={styles.qrSection}>
                    <View style={[styles.divider, { backgroundColor: theme.cardBorder, marginBottom: 16 }]} />
                    <Image source={{ uri: bankConfig.qrImage }} style={styles.qrDisplay} />
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.noBankCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <MaterialCommunityIcons name="bank-off-outline" size={28} color={theme.textMuted} />
                <Text style={[styles.noBankText, { color: theme.textMuted }]}>Sin datos bancarios</Text>
                <Text style={[styles.noBankSub, { color: theme.textMuted }]}>Perfil → Configuración de cobro</Text>
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
                  <Feather name="x" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.voucherBtns}>
                <TouchableOpacity
                  style={[styles.voucherBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={takeVoucherPhoto}
                >
                  <MaterialCommunityIcons name="camera-outline" size={22} color={theme.textSecondary} />
                  <Text style={[styles.voucherText, { color: theme.textSecondary }]}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voucherBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={pickVoucherFromGallery}
                >
                  <MaterialCommunityIcons name="image-outline" size={22} color={theme.textSecondary} />
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

      {/* SNACKBAR — no bloquea, regresa solo */}
      <Animated.View
        style={[
          styles.snack,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
          { transform: [{ translateY: snackAnim }], opacity: snackOpacity },
        ]}
      >
        <View style={styles.snackLeft}>
          <View style={[styles.snackDot, { backgroundColor: theme.success }]} />
          <View>
            <Text style={[styles.snackTitle, { color: theme.text }]}>Venta registrada</Text>
            <Text style={[styles.snackSub, { color: theme.textMuted }]}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.snackActions}>
          <TouchableOpacity
            style={[styles.snackBtn, { backgroundColor: theme.accent }]}
            onPress={handlePrint}
          >
            <MaterialCommunityIcons name="printer" size={16} color={theme.accentText} />
          </TouchableOpacity>
          {waNumber && (
            <TouchableOpacity
              style={[styles.snackBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: WA_COLOR }]}
              onPress={handleSnackWhatsApp}
            >
              <MaterialCommunityIcons name="whatsapp" size={16} color={WA_COLOR} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.snackClose} onPress={dismissSnack}>
            <Feather name="x" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
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
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingBottom: 120 },
  totalSection: { alignItems: 'center', paddingVertical: 30, marginHorizontal: 16 },
  totalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  totalAmount: { fontSize: 64, fontWeight: '900', marginTop: 6, letterSpacing: -2 },
  totalDetail: { fontSize: 13, fontWeight: '500', marginTop: 8 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  changeBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 8,
  },
  changeBarLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  changeBarAmount: { fontSize: 24, fontWeight: '900' },
  methodSection: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 8 },
  methodBtn: { flex: 1, borderRadius: 16, paddingVertical: 22, alignItems: 'center', gap: 8, borderWidth: 1 },
  methodText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  cashSection: { paddingHorizontal: 16, marginTop: 16 },
  billsRow: { flexDirection: 'row', gap: 8 },
  billBtn: { flex: 1, borderRadius: 12, paddingVertical: 18, alignItems: 'center', borderWidth: 1 },
  billText: { fontSize: 16, fontWeight: '800' },
  transferSection: { paddingHorizontal: 16, marginTop: 16, gap: 16 },
  bankCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  bankCardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  bankKey: { fontSize: 12, fontWeight: '600' },
  bankVal: { fontSize: 15, fontWeight: '700' },
  divider: { height: 1 },
  qrSection: { alignItems: 'center', marginTop: 4 },
  qrDisplay: { width: 160, height: 160, borderRadius: 10 },
  noBankCard: { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center', gap: 8 },
  noBankText: { fontSize: 14, fontWeight: '700' },
  noBankSub: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  voucherLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  voucherBtns: { flexDirection: 'row', gap: 10 },
  voucherBtn: { flex: 1, borderRadius: 14, paddingVertical: 24, alignItems: 'center', gap: 8, borderWidth: 1 },
  voucherText: { fontSize: 12, fontWeight: '700' },
  voucherWrap: { position: 'relative' },
  voucherImg: { width: '100%', height: 180, borderRadius: 14, resizeMode: 'cover' },
  voucherRemove: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, borderTopWidth: 1 },
  doneBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  doneText: { fontSize: 16, fontWeight: '900', letterSpacing: 4 },
  snack: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    borderRadius: 16, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  snackLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  snackDot: { width: 8, height: 8, borderRadius: 4 },
  snackTitle: { fontSize: 13, fontWeight: '700' },
  snackSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  snackActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  snackBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  snackClose: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
});