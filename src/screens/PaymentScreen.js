import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function PaymentScreen({ route, navigation }) {
  const { order } = route.params;
  const { addSale } = useApp();
  const { currentWorker } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashGiven, setCashGiven] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [voucherImage, setVoucherImage] = useState(null);

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
      Alert.alert('', 'Tomá foto del voucher o subilo de la galería');
      return;
    }
    const sale = {
      productId: order.product.id,
      productName: order.product.name,
      size: order.size.name,
      toppings: order.toppings,
      quantity: order.quantity,
      total: order.total,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
      change: paymentMethod === 'cash' ? change : null,
      voucherImage: paymentMethod === 'card' ? voucherImage : null,
      workerId: currentWorker?.id || null,
      workerName: currentWorker?.name || 'Sin asignar',
    };
    await addSale(sale);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigation.popToTop();
    }, 1800);
  };

  const canComplete =
    (paymentMethod === 'cash' && cashGiven !== '' && change >= 0) ||
    (paymentMethod === 'card' && voucherImage);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>COBRAR</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
          <Text style={styles.totalDetail}>
            {order.quantity}x {order.size.name} · {order.product.name}
          </Text>
        </View>

        <View style={styles.methodSection}>
          <TouchableOpacity
            style={[styles.methodBtn, paymentMethod === 'cash' && styles.methodActive]}
            onPress={() => { setPaymentMethod('cash'); setVoucherImage(null); }}
          >
            <Text style={styles.methodEmoji}>💵</Text>
            <Text style={[styles.methodText, paymentMethod === 'cash' && styles.methodTextActive]}>
              Efectivo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, paymentMethod === 'card' && styles.methodActive]}
            onPress={() => { setPaymentMethod('card'); setCashGiven(''); }}
          >
            <Text style={styles.methodEmoji}>💳</Text>
            <Text style={[styles.methodText, paymentMethod === 'card' && styles.methodTextActive]}>
              Tarjeta
            </Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === 'cash' && (
          <View style={styles.cashSection}>
            <View style={styles.quickGrid}>
              {quickAmounts.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.quickBtn, parseFloat(cashGiven) === amount && styles.quickBtnActive]}
                  onPress={() => setCashGiven(amount.toString())}
                >
                  <Text style={[styles.quickBtnText, parseFloat(cashGiven) === amount && styles.quickBtnTextActive]}>
                    ${amount}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickBtn, parseFloat(cashGiven) === order.total && styles.quickBtnActive]}
                onPress={() => setCashGiven(order.total.toString())}
              >
                <Text style={[styles.quickBtnText, { fontSize: 11 }, parseFloat(cashGiven) === order.total && styles.quickBtnTextActive]}>
                  EXACTO
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputDollar}>$</Text>
              <TextInput
                style={styles.cashInput}
                value={cashGiven}
                onChangeText={setCashGiven}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#333"
              />
            </View>

            {cashGiven !== '' && (
              <View style={[
                styles.changeBox,
                change > 0 && styles.changeGood,
                change === 0 && styles.changeExact,
                change < 0 && styles.changeBad,
              ]}>
                <Text style={styles.changeLabel}>
                  {change > 0 ? 'VUELTO' : change === 0 ? '¡JUSTO!' : 'FALTA'}
                </Text>
                <Text style={styles.changeAmount}>${Math.abs(change).toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        {paymentMethod === 'card' && (
          <View style={styles.cardSection}>
            {voucherImage ? (
              <View style={styles.voucherWrap}>
                <Image source={{ uri: voucherImage }} style={styles.voucherImg} />
                <TouchableOpacity style={styles.voucherRemove} onPress={() => setVoucherImage(null)}>
                  <Text style={styles.voucherRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.voucherBtns}>
                <TouchableOpacity style={styles.voucherBtn} onPress={takePhoto}>
                  <Text style={styles.voucherIcon}>📸</Text>
                  <Text style={styles.voucherText}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.voucherBtn} onPress={pickFromGallery}>
                  <Text style={styles.voucherIcon}>🖼️</Text>
                  <Text style={styles.voucherText}>Galería</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {paymentMethod && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.doneBtn, !canComplete && styles.doneBtnDisabled]}
            onPress={handleComplete}
            disabled={!canComplete}
          >
            <Text style={[styles.doneText, !canComplete && styles.doneTextDisabled]}>✓  LISTO</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>REGISTRADA</Text>
          <Text style={styles.successAmount}>${order.total.toFixed(2)}</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  backText: { color: '#FFF', fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingBottom: 120 },
  totalSection: {
    alignItems: 'center', paddingVertical: 30,
    marginHorizontal: 16, borderBottomWidth: 1, borderColor: '#191919',
  },
  totalLabel: { fontSize: 11, fontWeight: '800', color: '#555', letterSpacing: 3 },
  totalAmount: { fontSize: 56, fontWeight: '900', color: '#FFF', marginTop: 6 },
  totalDetail: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 6 },
  methodSection: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 24 },
  methodBtn: {
    flex: 1, backgroundColor: '#111', borderRadius: 16,
    paddingVertical: 22, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#222',
  },
  methodActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  methodEmoji: { fontSize: 28 },
  methodText: { fontSize: 13, fontWeight: '800', color: '#888', letterSpacing: 1 },
  methodTextActive: { color: '#000' },
  cashSection: { paddingHorizontal: 16, marginTop: 20 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    width: '31%', backgroundColor: '#111', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222',
  },
  quickBtnActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  quickBtnText: { fontSize: 16, fontWeight: '800', color: '#888' },
  quickBtnTextActive: { color: '#000' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 14, paddingHorizontal: 18, marginTop: 14,
    borderWidth: 1, borderColor: '#222',
  },
  inputDollar: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  cashInput: {
    flex: 1, fontSize: 34, fontWeight: '900', color: '#FFF',
    paddingVertical: 16, paddingLeft: 8,
  },
  changeBox: { marginTop: 14, borderRadius: 14, paddingVertical: 22, alignItems: 'center' },
  changeGood: { backgroundColor: '#FFF' },
  changeExact: { backgroundColor: '#FFF' },
  changeBad: { backgroundColor: '#FF3B30' },
  changeLabel: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 3 },
  changeAmount: { fontSize: 38, fontWeight: '900', color: '#000', marginTop: 4 },
  cardSection: { paddingHorizontal: 16, marginTop: 20 },
  voucherBtns: { flexDirection: 'row', gap: 10 },
  voucherBtn: {
    flex: 1, backgroundColor: '#111', borderRadius: 16,
    paddingVertical: 36, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#222',
  },
  voucherIcon: { fontSize: 36 },
  voucherText: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 1 },
  voucherWrap: { position: 'relative' },
  voucherImg: { width: '100%', height: 200, borderRadius: 14, resizeMode: 'cover' },
  voucherRemove: {
    position: 'absolute', top: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#000', borderWidth: 1, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  voucherRemoveText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 34, backgroundColor: '#000',
    borderTopWidth: 1, borderColor: '#111',
  },
  doneBtn: { backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  doneBtnDisabled: { backgroundColor: '#191919' },
  doneText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  doneTextDisabled: { color: '#333' },
  successOverlay: {
    flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center',
  },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successCheck: { fontSize: 48, color: '#FFF' },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 6 },
  successAmount: { fontSize: 36, fontWeight: '900', color: '#555', marginTop: 8 },
});