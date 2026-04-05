import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useAuth, generatePin } from '../context/AuthContext';

const STEPS = 4;

export default function SetupScreen() {
  const { setupOwner } = useAuth();

  const [step, setStep]           = useState(1);
  const [name, setName]           = useState('');
  const [nameError, setNameError] = useState('');
  const [pin, setPin]             = useState(generatePin());
  const [device, setDevice]       = useState(null); // 'fixed' | 'personal'
  const [done, setDone]           = useState(false);

  const handleStep1 = () => {
    if (!name.trim()) { setNameError('Escribí tu nombre'); return; }
    setNameError('');
    setStep(2);
  };

  const handleStep2 = () => {
    setStep(3);
  };

  const handleStep3 = () => {
    if (!device) return;
    setStep(4);
  };

  const handleConfirm = async () => {
    await setupOwner(pin, name.trim(), device);
    setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.successRing}>
            <MaterialCommunityIcons name="check-bold" size={40} color="#FFF" />
          </View>
          <Text style={styles.doneTitle}>TODO LISTO</Text>
          <Text style={styles.doneSub}>Tu negocio está configurado</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="crown" size={16} color="#888" />
              <Text style={styles.summaryLabel}>DUEÑO</Text>
              <Text style={styles.summaryValue}>{name}</Text>
            </View>
            <View style={[styles.summaryDivider]} />
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="cellphone-key" size={16} color="#888" />
              <Text style={styles.summaryLabel}>PIN</Text>
              <Text style={styles.summaryValuePin}>{pin}</Text>
            </View>
            <View style={[styles.summaryDivider]} />
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons
                name={device === 'fixed' ? 'tablet' : 'cellphone'}
                size={16} color="#888"
              />
              <Text style={styles.summaryLabel}>DISPOSITIVO</Text>
              <Text style={styles.summaryValue}>{device === 'fixed' ? 'Fijo' : 'Personal'}</Text>
            </View>
          </View>

          <Text style={styles.warningNote}>
            Guardá tu PIN en un lugar seguro.{'\n'}No se puede recuperar sin él.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.center}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progressRow}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i + 1 <= step && styles.progressDotActive,
                  i + 1 < step  && styles.progressDotDone,
                ]}
              />
            ))}
          </View>

          {/* STEP 1 — Nombre */}
          {step === 1 && (
            <View style={styles.stepWrap}>
              <MaterialCommunityIcons name="crown" size={48} color="#FFF" style={styles.stepIcon} />
              <Text style={styles.stepTitle}>BIENVENIDO</Text>
              <Text style={styles.stepSub}>Primero, ¿cómo te llamás?{'\n'}Sos el dueño de este negocio.</Text>

              <Text style={styles.fieldLabel}>TU NOMBRE</Text>
              <TextInput
                style={[styles.input, nameError && styles.inputError]}
                value={name}
                onChangeText={t => { setName(t); setNameError(''); }}
                placeholder="Ej: Carlos López"
                placeholderTextColor="#444"
                autoCapitalize="words"
                autoFocus
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStep1}>
                <Text style={styles.primaryBtnText}>CONTINUAR</Text>
                <Feather name="arrow-right" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 — PIN */}
          {step === 2 && (
            <View style={styles.stepWrap}>
              <MaterialCommunityIcons name="lock" size={48} color="#FFF" style={styles.stepIcon} />
              <Text style={styles.stepTitle}>TU PIN</Text>
              <Text style={styles.stepSub}>Este es tu PIN de acceso.{'\n'}Solo vos lo sabés.</Text>

              <View style={styles.pinCard}>
                <Text style={styles.pinCardLabel}>PIN GENERADO</Text>
                <Text style={styles.pinCardValue}>{pin}</Text>
                <TouchableOpacity
                  style={styles.pinRefreshBtn}
                  onPress={() => setPin(generatePin())}
                >
                  <Feather name="refresh-cw" size={13} color="#666" />
                  <Text style={styles.pinRefreshText}>Generar otro</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.pinNote}>
                4 dígitos. Podés generar otro si no te gusta este.
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStep2}>
                <Text style={styles.primaryBtnText}>ESTE ME GUSTA</Text>
                <Feather name="arrow-right" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>Volver</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3 — Tipo de dispositivo */}
          {step === 3 && (
            <View style={styles.stepWrap}>
              <MaterialCommunityIcons name="devices" size={48} color="#FFF" style={styles.stepIcon} />
              <Text style={styles.stepTitle}>ESTE DISPOSITIVO</Text>
              <Text style={styles.stepSub}>¿Cómo se va a usar este teléfono o tablet?</Text>

              <TouchableOpacity
                style={[styles.deviceCard, device === 'fixed' && styles.deviceCardActive]}
                onPress={() => setDevice('fixed')}
                activeOpacity={0.8}
              >
                <View style={styles.deviceCardLeft}>
                  <MaterialCommunityIcons
                    name="tablet"
                    size={28}
                    color={device === 'fixed' ? '#000' : '#FFF'}
                  />
                  <View>
                    <Text style={[styles.deviceCardTitle, device === 'fixed' && { color: '#000' }]}>
                      Dispositivo fijo
                    </Text>
                    <Text style={[styles.deviceCardSub, device === 'fixed' && { color: '#333' }]}>
                      Caja, cocina, barra — varios empleados lo usan
                    </Text>
                  </View>
                </View>
                {device === 'fixed' && (
                  <MaterialCommunityIcons name="check-circle" size={22} color="#000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deviceCard, device === 'personal' && styles.deviceCardActive]}
                onPress={() => setDevice('personal')}
                activeOpacity={0.8}
              >
                <View style={styles.deviceCardLeft}>
                  <MaterialCommunityIcons
                    name="cellphone"
                    size={28}
                    color={device === 'personal' ? '#000' : '#FFF'}
                  />
                  <View>
                    <Text style={[styles.deviceCardTitle, device === 'personal' && { color: '#000' }]}>
                      Dispositivo personal
                    </Text>
                    <Text style={[styles.deviceCardSub, device === 'personal' && { color: '#333' }]}>
                      Solo vos lo usás — driver, camarero
                    </Text>
                  </View>
                </View>
                {device === 'personal' && (
                  <MaterialCommunityIcons name="check-circle" size={22} color="#000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, !device && { opacity: 0.3 }]}
                onPress={handleStep3}
                disabled={!device}
              >
                <Text style={styles.primaryBtnText}>CONTINUAR</Text>
                <Feather name="arrow-right" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>Volver</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4 — Confirmación */}
          {step === 4 && (
            <View style={styles.stepWrap}>
              <MaterialCommunityIcons name="storefront" size={48} color="#FFF" style={styles.stepIcon} />
              <Text style={styles.stepTitle}>CONFIRMAR</Text>
              <Text style={styles.stepSub}>Revisá antes de crear tu cuenta.</Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <MaterialCommunityIcons name="account" size={16} color="#888" />
                  <Text style={styles.summaryLabel}>NOMBRE</Text>
                  <Text style={styles.summaryValue}>{name}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <MaterialCommunityIcons name="lock" size={16} color="#888" />
                  <Text style={styles.summaryLabel}>PIN</Text>
                  <Text style={styles.summaryValuePin}>{pin}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <MaterialCommunityIcons
                    name={device === 'fixed' ? 'tablet' : 'cellphone'}
                    size={16} color="#888"
                  />
                  <Text style={styles.summaryLabel}>DISPOSITIVO</Text>
                  <Text style={styles.summaryValue}>{device === 'fixed' ? 'Fijo' : 'Personal'}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
                <Text style={styles.primaryBtnText}>CREAR MI CUENTA</Text>
                <MaterialCommunityIcons name="check-bold" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
                <Text style={styles.backBtnText}>Volver</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  progressRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 48 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#222' },
  progressDotActive: { backgroundColor: '#FFF', width: 24 },
  progressDotDone:   { backgroundColor: '#555', width: 8 },

  stepWrap: { width: '100%' },
  stepIcon: { alignSelf: 'center', marginBottom: 20 },
  stepTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 4, textAlign: 'center' },
  stepSub:   { fontSize: 14, fontWeight: '500', color: '#555', textAlign: 'center', marginTop: 10, lineHeight: 22, marginBottom: 32 },

  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#444', letterSpacing: 3, marginBottom: 8 },
  input: {
    backgroundColor: '#111', borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 17, fontWeight: '600', color: '#FFF',
    borderWidth: 1, borderColor: '#222',
  },
  inputError: { borderColor: '#FF3B30' },
  errorText:  { fontSize: 12, fontWeight: '600', color: '#FF3B30', marginTop: 6 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 18, marginTop: 24,
  },
  primaryBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 3 },
  backBtn:     { paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  backBtnText: { color: '#444', fontSize: 14, fontWeight: '700' },

  pinCard: {
    backgroundColor: '#111', borderRadius: 18, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#222',
  },
  pinCardLabel: { fontSize: 10, fontWeight: '800', color: '#444', letterSpacing: 3 },
  pinCardValue: { fontSize: 52, fontWeight: '900', color: '#FFF', letterSpacing: 16, marginTop: 10 },
  pinRefreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  pinRefreshText:{ fontSize: 12, fontWeight: '700', color: '#555' },
  pinNote: { fontSize: 12, fontWeight: '500', color: '#444', textAlign: 'center', marginTop: 14, lineHeight: 18 },

  deviceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#222', marginBottom: 10,
  },
  deviceCardActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  deviceCardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  deviceCardTitle:  { fontSize: 15, fontWeight: '700', color: '#FFF' },
  deviceCardSub:    { fontSize: 12, fontWeight: '500', color: '#555', marginTop: 3, flexShrink: 1 },

  summaryCard: {
    backgroundColor: '#111', borderRadius: 18,
    borderWidth: 1, borderColor: '#222', overflow: 'hidden', marginBottom: 24,
  },
  summaryRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  summaryLabel:    { fontSize: 10, fontWeight: '800', color: '#555', letterSpacing: 2, flex: 1 },
  summaryValue:    { fontSize: 15, fontWeight: '700', color: '#FFF' },
  summaryValuePin: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 8 },
  summaryDivider:  { height: 1, backgroundColor: '#1A1A1A' },

  warningNote: { fontSize: 12, fontWeight: '500', color: '#444', textAlign: 'center', lineHeight: 20 },

  doneTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 6, textAlign: 'center', marginTop: 24 },
  doneSub:   { fontSize: 14, fontWeight: '500', color: '#555', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  successRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
});