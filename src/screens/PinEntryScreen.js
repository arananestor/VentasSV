import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PIN_LENGTH = 4;

export default function PinEntryScreen({ route, navigation }) {
  const { worker }       = route.params;
  const { loginWithPin } = useAuth();
  const { theme }        = useTheme();

  const [pin, setPin]     = useState('');
  const [error, setError] = useState(false);
  const shakeAnim         = useRef(new Animated.Value(0)).current;

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
      const result = loginWithPin(newPin, worker.id);
      if (!result) {
        setError(true);
        shake();
      }
    }
  };

  const handleDelete = () => { if (pin.length > 0) { setPin(pin.slice(0, -1)); setError(false); } };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="chevron-left" size={20} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.top}>
        {worker.photo ? (
          <Image source={{ uri: worker.photo }} style={styles.photo} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: worker.color || theme.accent }]}>
            <Text style={[styles.avatarText, { color: theme.accentText }]}>
              {worker.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: theme.text }]}>{worker.name}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {worker.puesto?.toUpperCase() || 'EMPLEADO'}
        </Text>

        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { borderColor: error ? theme.danger : theme.textMuted },
                i < pin.length && {
                  backgroundColor: error ? theme.danger : theme.accent,
                  borderColor: error ? theme.danger : theme.accent,
                },
              ]}
            />
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
              if (key === '') return <View key={`empty-${ri}-${ki}`} style={styles.keyEmpty} />;
              return (
                <TouchableOpacity
                  key={`key-${ri}-${ki}`}
                  style={[
                    styles.key,
                    { backgroundColor: theme.keypad, borderColor: theme.cardBorder },
                    key === '⌫' && { backgroundColor: 'transparent', borderColor: 'transparent' },
                  ]}
                  onPress={() => key === '⌫' ? handleDelete() : handlePress(key)}
                  activeOpacity={0.6}
                >
                  {key === '⌫' ? (
                    <Feather name="delete" size={22} color={theme.textMuted} />
                  ) : (
                    <Text style={[styles.keyText, { color: theme.keypadText }]}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute', top: 56, left: 16, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  top: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  photo:      { width: 84, height: 84, borderRadius: 42, marginBottom: 16, resizeMode: 'cover' },
  avatar:     { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 34, fontWeight: '900' },
  name:       { fontSize: 24, fontWeight: '900' },
  subtitle:   { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 6 },
  dotsRow:    { flexDirection: 'row', gap: 20, marginTop: 36 },
  dot:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  errorText:  { fontSize: 13, fontWeight: '700', marginTop: 20 },
  keypad:     { paddingHorizontal: 40, paddingBottom: 48 },
  keyRow:     { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 16 },
  key:        { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  keyEmpty:   { width: 74, height: 74 },
  keyText:    { fontSize: 28, fontWeight: '600' },
});
