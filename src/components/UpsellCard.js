import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getDefaultCtaLabel } from '../utils/upsellCardLogic';

export default function UpsellCard({ title, description, ctaLabel, onCta }) {
  const { theme } = useTheme();
  const label = getDefaultCtaLabel(ctaLabel);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="cloud-lock-outline" size={28} color={theme.textMuted} />
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
      <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
      {onCta && (
        <TouchableOpacity style={[styles.cta, { backgroundColor: theme.accent }]} onPress={onCta}>
          <Text style={[styles.ctaText, { color: theme.accentText }]}>{label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 20, borderWidth: 1, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 16, fontWeight: '800', flex: 1 },
  description: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
  cta: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  ctaText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
