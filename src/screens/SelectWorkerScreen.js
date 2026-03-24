import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_GAP = 14;
const PADDING = 20;
const CARD_SIZE = (width - (PADDING * 2) - CARD_GAP) / 2;

export default function SelectWorkerScreen({ navigation }) {
  const { workers } = useAuth();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <View style={styles.header}>
        <Text style={[styles.logo, { color: theme.text }]}>VENTA</Text>
        <Text style={[styles.title, { color: theme.textSecondary }]}>¿Quién trabaja hoy?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {workers.map((worker) => (
          <TouchableOpacity
            key={worker.id}
            style={[styles.workerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PinEntry', { worker })}
          >
            {worker.photo ? (
              <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
            ) : (
              <View style={[styles.workerAvatar, { backgroundColor: worker.color || theme.accent }]}>
                <Text style={[styles.workerInitial, { color: '#000' }]}>
                  {worker.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[styles.workerName, { color: theme.text }]} numberOfLines={1}>{worker.name}</Text>
            <View style={[styles.rolePill, { backgroundColor: theme.bg }]}>
              <Text style={[styles.roleText, { color: theme.textMuted }]}>
                {worker.role === 'admin' ? 'ADMIN' : 'CAJERO'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: PADDING, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '900', letterSpacing: 8 },
  title: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: PADDING, gap: CARD_GAP, paddingBottom: 60, justifyContent: 'center',
  },
  workerCard: {
    width: CARD_SIZE, borderRadius: 22, paddingVertical: 28,
    alignItems: 'center', borderWidth: 1, gap: 12,
  },
  workerPhoto: { width: 72, height: 72, borderRadius: 36, resizeMode: 'cover' },
  workerAvatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  workerInitial: { fontSize: 30, fontWeight: '900' },
  workerName: { fontSize: 16, fontWeight: '800', paddingHorizontal: 12, textAlign: 'center' },
  rolePill: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
});