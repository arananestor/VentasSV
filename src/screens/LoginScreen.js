import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Vibration,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { loginWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePress = (num) => {
    if (pin.length < 8) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length >= 4) {
        const worker = loginWithPin(newPin);
        if (!worker && newPin.length === 8) {
          setError(true);
          Vibration.vibrate(200);
          setTimeout(() => setPin(''), 400);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 8; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>VENTA</Text>
        <Text style={styles.subtitle}>Ingresá tu PIN</Text>

        <View style={styles.dotsRow}>{renderDots()}</View>

        {error && <Text style={styles.errorText}>PIN incorrecto</Text>}
      </View>

      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['C', '0', '⌫'],
        ].map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.key,
                  key === 'C' && styles.keyAction,
                  key === '⌫' && styles.keyAction,
                ]}
                onPress={() => {
                  if (key === '⌫') handleDelete();
                  else if (key === 'C') handleClear();
                  else handlePress(key);
                }}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.keyText,
                  (key === 'C' || key === '⌫') && styles.keyActionText,
                ]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#333',
  },
  dotFilled: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  dotError: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
  },
  keypad: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 14,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  keyAction: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFF',
  },
  keyActionText: {
    fontSize: 18,
    color: '#555',
    fontWeight: '800',
  },
});