import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, Modal, Image, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { printTicket, shareTicket } from '../utils/ticketPrinter';

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

  const change = cashGiven ? parseFloat(cashGiven) - order.total : 0;
  const quickAmounts = [1, 2, 5, 10, 20];

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('', 'Necesitamos la cámara'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setVoucherImage(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) setVoucherImage(result.assets[0].uri);
  };

  const handleComplete = async () => {
    if (paymentMethod === 'card' && !voucherImage) {
      Alert.alert('', 'Tomá foto del voucher o subilo de la galería'); return;
    }
    const saleData = {
      productId: order.product.id, productName: order.product.name,
      size: order.size.name, toppings: order.toppings,
      quantity: order.quantity, total: order.total, paymentMethod,
      cashGiven: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
      change: paymentMethod === 'cash' ? change : null,
      voucherImage: paymentMethod === 'card' ? voucherImage : null,
      workerId: currentWorker?.id || null,
      workerName: currentWorker?.name || 'Sin asignar',
    };
    const newSale = await addSale(saleData);
    setCompletedSale(newSale);
    setShowSuccess(true);
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
    (paymentMethod === 'card' && voucherImage);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
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
              paymentMethod === 'card' && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => { setPaymentMethod('card'); setCashGiven(''); }}
          >
            <Text style={styles.methodEmoji}>💳</Text>
            <Text style={[styles.methodText, { color: theme.textSecondary },
              paymentMethod === 'card' && { color: theme.accentText }]}>Tarjeta</Text>
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
              <TextInput style={[styles.cashInput, { color: theme.text }]}
                value={cashGiven} onChangeText={setCashGiven}
                keyboardType="numeric" placeholder="0.00" placeholderTextColor={theme.textMuted} />
            </View>

            {cashGiven !== '' && (
              <View style={[styles.changeBox,
                change >= 0 ? { backgroundColor: theme.accent } : { backgroundColor: theme.danger }]}>
                <Text style={[styles.changeLabel, { color: theme.accentText }]}>
                  {change > 0 ? 'VUELTO' : change === 0 ? '¡JUSTO!' : 'FALTA'}
                </Text>
                <Text style={[styles.changeAmount, { color: theme.accentText }]}>${Math.abs(change).toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        {paymentMethod === 'card' && (
          <View style={styles.cardSection}>
            {voucherImage ? (
              <View style={styles.voucherWrap}>
                <Image source={{ uri: voucherImage }} style={styles.voucherImg} />
                <TouchableOpacity style={[styles.voucherRemove, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}
                  onPress={() => setVoucherImage(null)}>
                  <Text style={[styles.voucherRemoveText, { color: theme.text }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.voucherBtns}>
                <TouchableOpacity style={[styles.voucherBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={takePhoto}>
                  <Text style={styles.voucherIcon}>📸</Text>
                  <Text style={[styles.voucherText, { color: theme.textSecondary }]}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.voucherBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={pickFromGallery}>
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
            onPress={handleComplete} disabled={!canComplete}
          >
            <Text style={[styles.doneText, { color: theme.accentText }]}>✓  LISTO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success + Print Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={[styles.successOverlay, { backgroundColor: theme.bg }]}>
          <View style={[styles.successCircle, { borderColor: theme.accent }]}>
            <Text style={[styles.successCheck, { color: theme.accent }]}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>REGISTRADA</Text>
          <Text style={[styles.successAmount, { color: theme.textMuted }]}>${order.total.toFixed(2)}</Text>

          <View style={styles.printSection}>
            {isPrinting ? (
              <ActivityIndicator color={theme.text} size="large" style={{ marginTop: 30 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.printBtn, { backgroundColor: theme.accent }]}
                  onPress={handlePrint}
                >
                  <Text style={styles.printIcon}>🖨️</Text>
                  <Text style={[styles.printBtnText, { color: theme.accentText }]}>IMPRIMIR TICKET</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shareBtn, { borderColor: theme.cardBorder }]}
                  onPress={handleShare}
                >
                  <Text style={styles.shareIcon}>📤</Text>
                  <Text style={[styles.shareBtnText, { color: theme.textSecondary }]}>Compartir PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={handleDone}>
                  <Text style={[styles.skipText, { color: theme.textMuted }]}>Continuar sin ticket</Text>
                </TouchableOpacity>
              </>
            )}
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
  cardSection: { paddingHorizontal: 16, marginTop: 20 },
  voucherBtns: { flexDirection: 'row', gap: 10 },
  voucherBtn: { flex: 1, borderRadius: 16, paddingVertical: 36, alignItems: 'center', gap: 10, borderWidth: 1 },
  voucherIcon: { fontSize: 36 },
  voucherText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  voucherWrap: { position: 'relative' },
  voucherImg: { width: '100%', height: 200, borderRadius: 14, resizeMode: 'cover' },
  voucherRemove: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  voucherRemoveText: { fontSize: 16, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, borderTopWidth: 1 },
  doneBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  doneText: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  successOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  successCircle: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successCheck: { fontSize: 48 },
  successTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 6 },
  successAmount: { fontSize: 36, fontWeight: '900', marginTop: 8 },
  printSection: { width: '100%', marginTop: 30, gap: 12 },
  printBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, paddingVertical: 18, gap: 10,
  },
  printIcon: { fontSize: 22 },
  printBtnText: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, paddingVertical: 16, gap: 10, borderWidth: 1,
  },
  shareIcon: { fontSize: 20 },
  shareBtnText: { fontSize: 14, fontWeight: '700' },
  skipBtn: { paddingVertical: 14, alignItems: 'center' },
  skipText: { fontSize: 14, fontWeight: '600' },
});