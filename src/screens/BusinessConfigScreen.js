import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  saveBankConfig, loadBankConfig,
  saveWhatsAppNumber, loadWhatsAppNumber,
  saveKitchenNumber, loadKitchenNumber,
} from '../utils/businessConfig';

export default function BusinessConfigScreen({ navigation }) {
  const { theme } = useTheme();

  const [bank, setBank] = useState('');
  const [holder, setHolder] = useState('');
  const [account, setAccount] = useState('');
  const [qrImage, setQrImage] = useState(null);
  const [waNumber, setWaNumber] = useState('');
  const [kitchenNumber, setKitchenNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const bc = await loadBankConfig();
      if (bc) { setBank(bc.bank || ''); setHolder(bc.holder || ''); setAccount(bc.account || ''); setQrImage(bc.qrImage || null); }
      const wa = await loadWhatsAppNumber();
      if (wa) setWaNumber(wa);
      const kn = await loadKitchenNumber();
      if (kn) setKitchenNumber(kn);
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
    const waCleaned = waNumber.replace(/\D/g, '');
    if (waCleaned) await saveWhatsAppNumber(waCleaned);
    const knCleaned = kitchenNumber.replace(/\D/g, '');
    if (knCleaned) await saveKitchenNumber(knCleaned);
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigation.goBack(), 600);
  };

  const bankComplete = bank.trim() && holder.trim() && account.trim();
  const waComplete = waNumber.replace(/\D/g, '').length >= 8;
  const kitchenComplete = kitchenNumber.replace(/\D/g, '').length >= 8;

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
          <View style={[styles.savedDot, { backgroundColor: theme.success }]} />
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
          <Feather name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>CONFIGURACIÓN DE COBRO</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* STATUS */}
        <View style={styles.statusRow}>
          {[
            { label: 'Banco', done: bankComplete },
            { label: 'WhatsApp', done: waComplete },
            { label: 'Cocina', done: kitchenComplete },
          ].map(s => (
            <View key={s.label} style={[styles.statusPill, {
              backgroundColor: theme.card,
              borderColor: s.done ? theme.success : theme.cardBorder,
            }]}>
              <View style={[styles.statusDot, { backgroundColor: s.done ? theme.success : theme.cardBorder }]} />
              <Text style={[styles.statusText, { color: s.done ? theme.text : theme.textMuted }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* WHATSAPP NEGOCIO */}
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
              {['Tickets al cliente por WhatsApp', 'Datos de transferencia automáticos', 'Aviso de pedido listo'].map(b => (
                <View key={b} style={styles.benefitRow}>
                  <View style={[styles.benefitDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.benefitText, { color: theme.textSecondary }]}>{b}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* WHATSAPP COCINA */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>WHATSAPP DE COCINA</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            Recibe cada pedido nuevo automáticamente
          </Text>
          <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 10 }]}>
            <Text style={[styles.prefix, { color: theme.textMuted }]}>+503</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={kitchenNumber}
              onChangeText={setKitchenNumber}
              placeholder="7000-0000"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>
        </View>

        {/* BANCO */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DATOS BANCARIOS</Text>
          {[
            { placeholder: 'Banco', value: bank, setter: setBank, max: 40 },
            { placeholder: 'Titular de la cuenta', value: holder, setter: setHolder, max: 60 },
            { placeholder: 'Número de cuenta', value: account, setter: setAccount, max: 30, numeric: true },
          ].map((f, i) => (
            <View key={i} style={[styles.inputRow, {
              backgroundColor: theme.card, borderColor: theme.cardBorder,
              marginTop: i === 0 ? 0 : 8,
            }]}>
              <TextInput
                style={[styles.inputFull, { color: theme.text }]}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                placeholderTextColor={theme.textMuted}
                keyboardType={f.numeric ? 'numeric' : 'default'}
                maxLength={f.max}
              />
            </View>
          ))}
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
              <Feather name="upload" size={20} color={theme.textMuted} />
              <Text style={[styles.qrUploadLabel, { color: theme.textMuted }]}>Subir QR</Text>
              <Text style={[styles.qrUploadSub, { color: theme.textMuted }]}>
                Se muestra al cliente en transferencias
              </Text>
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
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  savedScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  savedDot: { width: 12, height: 12, borderRadius: 6 },
  savedText: { fontSize: 18, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 4 },
  statusPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  section: { marginTop: 28 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  sectionSub: { fontSize: 12, fontWeight: '500', marginTop: -6 },
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
    borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', gap: 8,
  },
  qrUploadLabel: { fontSize: 14, fontWeight: '700' },
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