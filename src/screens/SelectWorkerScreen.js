import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_GAP = 14;
const PADDING = 20;
const CARD_SIZE = (width - (PADDING * 2) - CARD_GAP) / 2;

export default function SelectWorkerScreen({ navigation }) {
  const { workers } = useAuth();

  const handleSelect = (worker) => {
    navigation.navigate('PinEntry', { worker });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <Text style={styles.logo}>VENTA</Text>
        <Text style={styles.title}>¿Quién trabaja hoy?</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {workers.map((worker) => (
          <TouchableOpacity
            key={worker.id}
            style={styles.workerCard}
            activeOpacity={0.8}
            onPress={() => handleSelect(worker)}
          >
            {worker.photo ? (
              <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
            ) : (
              <View style={[styles.workerAvatar, { backgroundColor: worker.color || '#FFF' }]}>
                <Text style={styles.workerInitial}>
                  {worker.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.workerName} numberOfLines={1}>{worker.name}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
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
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingHorizontal: PADDING,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PADDING,
    gap: CARD_GAP,
    paddingBottom: 60,
    justifyContent: 'center',
  },
  workerCard: {
    width: CARD_SIZE,
    backgroundColor: '#111',
    borderRadius: 22,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  workerPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    resizeMode: 'cover',
  },
  workerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerInitial: {
    fontSize: 30,
    fontWeight: '900',
    color: '#000',
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  rolePill: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 2,
  },
});