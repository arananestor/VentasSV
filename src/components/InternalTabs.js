import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function InternalTabs({ tabs, activeKey, onTabChange }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { borderBottomColor: theme.cardBorder }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map(tab => {
          const isActive = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && { borderBottomColor: theme.text, borderBottomWidth: 2 }]}
              onPress={() => onTabChange(tab.key)}
            >
              <Text style={[styles.label, { color: isActive ? theme.text : theme.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1 },
  row: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 12 },
  label: { fontSize: 13, fontWeight: '700' },
});
