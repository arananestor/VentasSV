import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SetupScreen() {
  const { setupAdmin } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');

  const handleCreatePin = () => {
    if (!name.trim()) {
      Alert.alert('', 'Escribí tu nombre');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('', 'El PIN debe tener al menos 4 dígitos');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('', 'Los PIN no coinciden');
      return;
    }
    setStep(2);
  };

  const handleConfirmSetup = async () => {
    const result = await setupAdmin(pin, name.trim());
    setGeneratedPin(result);
    setStep(3);
  };

  if (step === 3) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.title}>¡LISTO!</Text>
          <Text style={styles.subtitle}>Tu cuenta de administrador está creada</Text>
          <View style={styles.pinDisplay}>
            <Text style={styles.pinLabel}>TU PIN DE ADMIN</Text>
            <Text style={styles.pinValue}>{generatedPin}</Text>
          </View>
          <Text style={styles.warning}>
            ⚠️  Guardá este PIN en un lugar seguro.{'\n'}Lo necesitarás para cambios importantes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>CONFIRMAR</Text>
          <Text style={styles.subtitle}>
            Nombre: {name}{'\n'}PIN: {'•'.repeat(pin.length)}
          </Text>
          <Text style={styles.warningSmall}>
            Este PIN será tu llave maestra. No se puede recuperar.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmSetup}>
            <Text style={styles.primaryBtnText}>CREAR CUENTA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
            <Text style={styles.secondaryBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.logo}>VENTA</Text>
        <Text style={styles.logoSub}>CONFIGURACIÓN INICIAL</Text>

        <View style={styles.form}>
          <Text style={styles.label}>TU NOMBRE</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Carlos López"
            placeholderTextColor="#333"
          />

          <Text style={styles.label}>CREÁ TU PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="Mínimo 4 dígitos"
            placeholderTextColor="#333"
            keyboardType="numeric"
            secureTextEntry
            maxLength={8}
          />

          <Text style={styles.label}>CONFIRMÁ TU PIN</Text>
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Repetí el PIN"
            placeholderTextColor="#333"
            keyboardType="numeric"
            secureTextEntry
            maxLength={8}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreatePin}>
          <Text style={styles.primaryBtnText}>CONTINUAR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 8,
    textAlign: 'center',
  },
  logoSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  form: { marginTop: 10 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 3,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#222',
  },
  primaryBtn: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  secondaryBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '700',
  },
  pinDisplay: {
    backgroundColor: '#111',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#222',
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 3,
  },
  pinValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 10,
    marginTop: 8,
  },
  warning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  warningSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  successCheck: { fontSize: 36, color: '#FFF' },
});