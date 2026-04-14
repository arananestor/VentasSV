import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Image, ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Divider from '../components/Divider';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { loadBankConfig, loadWhatsAppNumber, loadKitchenNumber, buildKitchenMessage } from '../utils/businessConfig';
import { shouldRequestPermission, canGetLocation, buildGeoPayload } from '../utils/geoLogic';
import { buildMultiItemSaleData } from '../utils/itemsLogic';

export default function PaymentScreen({ route, navigation }) {
  const { fromCart } = route.params || {};
  const { addSale, cart, clearCart, cartTotal, cartCount, showSnack } = useApp();
  const { currentWorker } = useAuth();
  const { theme } = useTheme();

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
    })();
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (shouldRequestPermission(status)) {
        const response = await Location.requestForegroundPermissionsAsync();
        status = response.status;
      }
      if (!canGetLocation(status)) return null;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 5000,
      });
      return buildGeoPayload(loc.coords);
    } catch (err) {
      console.warn('[location]', err);
      return null;
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    const geo = await getLocation();

    // Consolidate both cart and legacy single-product into one path
    const cartItems = isCartMode ? cart : [{
      product: legacyOrder.product,
      size: legacyOrder.size,
      quantity: legacyOrder.quantity,
      units: legacyOrder.units || [],
      extras: legacyOrder.toppings || [],
      note: '',
      total: legacyOrder.total,
    }];

    const saleData = buildMultiItemSaleData({
      cart: cartItems,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? effectiveAmount : null,
      change: paymentMethod === 'cash' ? change : null,
      voucherImage: paymentMethod === 'transfer' ? voucherImage : null,
      worker: currentWorker,
      geo,
    });

    const sale = await addSale(saleData);

    if (kitchenNumber) {
      const msg = buildKitchenMessage(sale);
      Linking.openURL(`https://wa.me/503${kitchenNumber}?text=${msg}`);
    }

    if (isCartMode) clearCart();

    setCompleting(false);
    showSnack({ sales: [sale], total: sale.total, waNumber });
    navigation.popToTop();
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
      <ScreenHeader title="COBRAR" onBack={() => navigation.goBack()} />

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
                    {i < arr.length - 1 && <Divider />}
                  </View>
                ))}
                {bankConfig.qrImage && (
                  <View style={styles.qrSection}>
                    <Divider />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});