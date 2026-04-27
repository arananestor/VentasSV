import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const MAX_H = Dimensions.get('window').height * 0.8;

export default function CenterModal({ visible, onClose, title, children }) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, maxHeight: MAX_H }]}>
          {title ? (
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          ) : null}
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled bounces={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: { borderRadius: 20, padding: 24, borderWidth: 1 },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginBottom: 20 },
});
