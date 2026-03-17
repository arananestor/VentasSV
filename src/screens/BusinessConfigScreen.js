import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, ScrollView, Alert, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import {
  saveBankConfig, loadBankConfig,
  saveWhatsAppNumber, loadWhatsAppNumber,
} from '../utils/businessConfig';

export default function BusinessConfigScreen({ navigation }) {
  const { theme } = useTheme();

  // Banco
  const [bank, setBank] = useState('');
  const [holder, setHolder] = useState('');
  const [account, setAccount] = useState('');
  const [qrImage, setQrImage] = useState(null);

  // WhatsApp
  const [waNumber, setWaNumber] = useState('');

  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const bc = await loadBankConfig();
      if (bc) { setBank(bc.bank || ''); setHolder(bc.holder || ''); setAccount(bc.account || ''); setQrImage(bc.qrImage || null); }
      const wa = await loadWhatsAppNumber();
      if (wa) setWaNumber(wa);
      setLoaded(true);
    })();
  }, []);

  const pickQR = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) setQrImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveBankConfig({ bank: bank.trim(), holder: holder.trim(), account: account.trim(), qrImage });
    const cleaned = waNumber.replace(/\D/g, '');
    if (cleaned) await saveWhatsAppNumber(cleaned);
    setSaving(false);
    Alert.alert('✓ Guardado', 'Configuración actualizada');
  };

  const bankComplete = bank.trim() && holder.trim() && account.trim();
  const waComplete = waNumber.replace(/\D/g, '').length >= 8;

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.text} size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>CONFIGURACIÓN DE COBRO</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STATUS CARDS ── */}
        <View style={styles.statusRow}>
          <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: bankComplete ? '#34C759' : theme.cardBorder }]}>
            <Text style={styles.statusIcon}>{bankComplete ? '✅' : '⚪️'}</Text>
            <Text style={[styles.statusLabel, { color: theme.textMuted }]}>BANCO</Text>
            <Text style={[styles.statusVal, { color: bankComplete ? '#34C759' : theme.textMuted }]}>
              {bankComplete ? 'Listo' : 'Pendiente'}
            </Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: waComplete ? '#25D366' : theme.cardBorder }]}>
            <Text style={styles.statusIcon}>{waComplete ? '✅' : '⚪️'}</Text>
            <Text style={[styles.statusLabel, { color: theme.textMuted }]}>WHATSAPP</Text>
            <Text style={[styles.statusVal, { color: waComplete ? '#25D366' : theme.textMuted }]}>
              {waComplete ? 'Conectado' : 'Pendiente'}
            </Text>
          </View>
        </View>

        {/* ── WHATSAPP ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💬</Text>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>WhatsApp del negocio</Text>
              <Text style={[styles.sectionSub, { color: theme.textMuted }]}>Recibí comprobantes y enviá tickets al cliente</Text>
            </View>
          </View>

          <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.prefix, { color: theme.textMuted }]}>+503</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={waNumber}
              onChangeText={setWaNumber}
              placeholder="7000-0000"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>

          {waComplete && (
            <View style={[styles.benefitBox, { backgroundColor: '#25D36615', borderColor: '#25D36640' }]}>
              <Text style={styles.benefitText}>✓  Envío de tickets por WhatsApp</Text>
              <Text style={styles.benefitText}>✓  Datos bancarios al instante</Text>
              <Text style={styles.benefitText}>✓  QR de pago en pantalla</Text>
              <Text style={styles.benefitText}>✓  Aviso "Pedido listo" al cliente</Text>
            </View>
          )}
        </View>

        {/* ── BANCO ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏦</Text>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Datos bancarios</Text>
              <Text style={[styles.sectionSub, { color: theme.textMuted }]}>Para cobros por transferencia</Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>BANCO</Text>
          <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.inputFull, { color: theme.text }]}
              value={bank}
              onChangeText={setBank}
              placeholder="Ej: Banco Agrícola"
              placeholderTextColor={theme.textMuted}
              maxLength={40}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TITULAR</Text>
          <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.inputFull, { color: theme.text }]}
              value={holder}
              onChangeText={setHolder}
              placeholder="Nombre completo"
              placeholderTextColor={theme.textMuted}
              maxLength={60}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>NÚMERO DE CUENTA</Text>
          <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.inputFull, { color: theme.text }]}
              value={account}
              onChangeText={setAccount}
              placeholder="0000-000000-00"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              maxLength={30}
            />
          </View>

          {/* QR */}
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>QR DE PAGO (opcional)</Text>
          {qrImage ? (
            <View style={styles.qrWrap}>
              <Image source={{ uri: qrImage }} style={styles.qrPreview} />
              <TouchableOpacity
                style={[styles.qrRemove, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => setQrImage(null)}
              >
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>✕ Quitar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.qrUpload, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={pickQR}
            >
              <Text style={{ fontSize: 32 }}>📷</Text>
              <Text style={[{ color: theme.textMuted, fontSize: 13, fontWeight: '700', marginTop: 8 }]}>
                Subir QR de transferencia
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* SAVE BUTTON */}
      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={theme.accentText} />
            : <Text style={[styles.saveBtnText, { color: theme.accentText }]}>GUARDAR CONFIGURACIÓN</Text>
          }
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
  statusCard: {
    flex: 1, borderRadius: 14, padding: 16, alignItems: 'center',
    gap: 4, borderWidth: 1.5,
  },
  statusIcon: { fontSize: 22 },
  statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  statusVal: { fontSize: 13, fontWeight: '700' },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIcon: { fontSize: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6, marginTop: 12 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 16, borderWidth: 1,
  },
  prefix: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  input: { flex: 1, fontSize: 18, fontWeight: '700', paddingVertical: 16 },
  inputFull: { flex: 1, fontSize: 16, fontWeight: '700', paddingVertical: 16 },
  benefitBox: { borderRadius: 14, padding: 16, marginTop: 12, borderWidth: 1, gap: 6 },
  benefitText: { color: '#25D366', fontSize: 13, fontWeight: '700' },
  qrUpload: {
    borderRadius: 16, paddingVertical: 32, alignItems: 'center',
    borderWidth: 1, borderStyle: 'dashed', marginTop: 8,
  },
  qrWrap: { marginTop: 8, alignItems: 'center', gap: 12 },
  qrPreview: { width: 180, height: 180, borderRadius: 12 },
  qrRemove: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 34, borderTopWidth: 1,
  },
  saveBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 2 },
});