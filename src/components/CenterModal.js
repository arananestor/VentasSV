import React from 'react';
import { View, Text, Modal, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function CenterModal({ visible, onClose, title, children }) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {title ? (
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              ) : null}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: { borderRadius: 20, padding: 24, borderWidth: 1 },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginBottom: 20 },
});
