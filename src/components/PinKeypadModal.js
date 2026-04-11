import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import CenterModal from './CenterModal';

const PIN_LENGTH = 4;

export default function PinKeypadModal({
  visible, onClose, onVerify,
  title = 'AUTORIZACIÓN', subtitle = 'PIN de autorización',
}) {
  const { theme } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) { setPin(''); setError(false); }
  }, [visible]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
    ]).start(() => setTimeout(() => { setPin(''); setError(false); }, 300));
  };

  const handlePress = (num) => {
    if (pin.length >= PIN_LENGTH) return;
    const newPin = pin + num;
    setPin(newPin);
    setError(false);
    if (newPin.length === PIN_LENGTH) {
      if (onVerify(newPin)) {
        onClose();
      } else {
        setError(true);
        shake();
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) { setPin(pin.slice(0, -1)); setError(false); }
  };

  return (
    <CenterModal visible={visible} onClose={onClose}>
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.iconWrap, { backgroundColor: theme.bg }]}>
          <Feather name="lock" size={24} color={theme.text} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>

        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[
              styles.dot,
              { borderColor: error ? theme.danger : theme.textMuted },
              i < pin.length && {
                backgroundColor: error ? theme.danger : theme.accent,
                borderColor: error ? theme.danger : theme.accent,
              },
            ]} />
          ))}
        </Animated.View>

        {error && (
          <Text style={[styles.errorText, { color: theme.danger }]}>PIN incorrecto</Text>
        )}
      </View>

      <View style={styles.keypad}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => {
              if (key === '') return <View key={`e-${ri}-${ki}`} style={styles.keyEmpty} />;
              return (
                <TouchableOpacity
                  key={`k-${ri}-${ki}`}
                  style={[styles.key, { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    key === '⌫' && { backgroundColor: 'transparent', borderColor: 'transparent' }]}
                  onPress={() => key === '⌫' ? handleDelete() : handlePress(key)}
                  activeOpacity={0.6}
                >
                  {key === '⌫'
                    ? <Feather name="delete" size={20} color={theme.textMuted} />
                    : <Text style={[styles.keyText, { color: theme.text }]}>{key}</Text>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.cancel} onPress={onClose}>
        <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancelar</Text>
      </TouchableOpacity>
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 6, marginBottom: 20 },
  dotsRow: { flexDirection: 'row', gap: 18, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  errorText: { fontSize: 13, fontWeight: '700', marginTop: 12 },
  keypad: { marginTop: 16 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
  key: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  keyEmpty: { width: 64, height: 64 },
  keyText: { fontSize: 24, fontWeight: '600' },
  cancel: { paddingVertical: 14 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
