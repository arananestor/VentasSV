import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Vibration,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function PinEntryScreen({ route, navigation }) {
  const { worker } = route.params;
  const { loginWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePress = (num) => {
    if (pin.length < 8) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length >= 4) {
        const result = loginWithPin(newPin, worker.id);
        if (result) {
          // Success — navigation handled by App.js
        } else if (newPin.length === 8) {
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
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length && styles.dotFilled,
            error && i < pin.length && styles.dotError,
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.top}>
        {worker.photo ? (
          <Image source={{ uri: worker.photo }} style={styles.photo} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: worker.color || '#FFF' }]}>
            <Text style={styles.avatarText}>
              {worker.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{worker.name}</Text>
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
                  (key === 'C' || key === '⌫') && styles.keyAction,
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
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  backText: { color: '#FFF', fontSize: 24, fontWeight: '300', marginTop: -2 },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
    marginBottom: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#000',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 28,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  keyActionText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '800',
  },
});