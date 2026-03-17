import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import {
  saveBankConfig, loadBankConfig,
  saveWhatsAppNumber, loadWhatsAppNumber,
} from '../utils/businessConfig';

export default function BusinessConfigScreen({ navigation }) {
  const { theme } = useTheme();

  const [bank, setBank] = useState('');
  const [holder, setHolder] = useState('');
  const [account, setAccount] = useState('');
  const [qrImage, setQrImage] = useState(null);
  const [waNumber, setWaNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const bc = await loadBankConfig();
      if (bc) {
        setBank(bc.bank || '');
        setHolder(bc.holder || '');
        setAccount(bc.account || '');
        setQrImage(bc.qrImage || null);
      }
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
    setSaved(true);
    setTimeout(() => navigation.goBack(), 800);
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

  if (saved) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.savedScreen}>
          <View style={[styles.savedDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.savedText, { color: theme.text }]}>Guardado</Text>
        </View>
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

        {/* STATUS ROW */}
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, {
            backgroundColor: theme.card,
            borderColor: bankComplete ? theme.accent : theme.cardBorder,
          }]}>
            <View style={[styles.statusDot, { backgroundColor: bankComplete ? theme.accent : theme.cardBorder }]} />
            <Text style={[styles.statusText, { color: bankComplete ? theme.text : theme.textMuted }]}>
              Banco {bankComplete ? 'configurado' : 'pendiente'}
            </Text>
          </View>
          <View style={[styles.statusPill, {
            backgroundColor: theme.card,
            borderColor: waComplete ? '#25D366' : theme.cardBorder,
          }]}>
            <View style={[styles.statusDot, { backgroundColor: waComplete ? '#25D366' : theme.cardBorder }]} />
            <Text style={[styles.statusText, { color: waComplete ? theme.text : theme.textMuted }]}>
              WhatsApp {waComplete ? 'conectado' : 'pendiente'}
            </Text>
          </View>
        </View>

        {/* WHATSAPP */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>WHATSAPP DEL NEGOCIO</Text>
          <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
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
            <View style={styles.benefitList}>
              {['Enviar tickets al cliente', 'Compartir datos de transferencia', 'Aviso de pedido listo'].map(b => (
                <View key={b} style={styles.benefitRow}>
                  <View style={[styles.benefitDot, { backgroundColor: '#25D366' }]} />
                  <Text style={[styles.benefitText, { color: theme.textSecondary }]}>{b}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* BANCO */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DATOS BANCARIOS</Text>

          <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TextInput
              style={[styles.inputFull, { color: theme.text }]}
              value={bank}
              onChangeText={setBank}
              placeholder="Banco"
              placeholderTextColor={theme.textMuted}
              maxLength={40}
            />
          </View>

          <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 8 }]}>
            <TextInput
              style={[styles.inputFull, { color: theme.text }]}
              value={holder}
              onChangeText={setHolder}
              placeholder="Titular de la cuenta"
              placeholderTextColor={theme.textMuted}
              maxLength={60}
            />
          </View>

          <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 8 }]}>
            <TextInput
              style={[styles.inputFull, { color: theme.text }]}
              value={account}
              onChangeText={setAccount}
              placeholder="Número de cuenta"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              maxLength={30}
            />
          </View>
        </View>

        {/* QR */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>QR DE TRANSFERENCIA</Text>
          {qrImage ? (
            <View style={[styles.qrCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Image source={{ uri: qrImage }} style={styles.qrImage} />
              <TouchableOpacity
                style={[styles.qrRemoveBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setQrImage(null)}
              >
                <Text style={[styles.qrRemoveText, { color: theme.textMuted }]}>Quitar imagen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.qrUpload, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={pickQR}
            >
              <Text style={[styles.qrUploadLabel, { color: theme.textMuted }]}>Subir QR  ↑</Text>
              <Text style={[styles.qrUploadSub, { color: theme.textMuted }]}>Se muestra al cliente en transferencias</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={theme.accentText} />
            : <Text style={[styles.saveBtnText, { color: theme.accentText }]}>GUARDAR</Text>
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
  savedScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  savedDot: { width: 12, height: 12, borderRadius: 6 },
  savedText: { fontSize: 18, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 4 },
  statusPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  section: { marginTop: 28 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 16, borderWidth: 1,
  },
  prefix: { fontSize: 15, fontWeight: '600', marginRight: 8 },
  input: { flex: 1, fontSize: 17, fontWeight: '600', paddingVertical: 16 },
  inputFull: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 16 },
  benefitList: { marginTop: 12, gap: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitDot: { width: 6, height: 6, borderRadius: 3 },
  benefitText: { fontSize: 13, fontWeight: '500' },
  qrUpload: {
    borderRadius: 14, paddingVertical: 28, paddingHorizontal: 20,
    borderWidth: 1, borderStyle: 'dashed',
  },
  qrUploadLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  qrUploadSub: { fontSize: 12, fontWeight: '500' },
  qrCard: { borderRadius: 14, padding: 20, alignItems: 'center', gap: 16, borderWidth: 1 },
  qrImage: { width: 160, height: 160, borderRadius: 10 },
  qrRemoveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  qrRemoveText: { fontSize: 13, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 34, borderTopWidth: 1,
  },
  saveBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 3 },
});