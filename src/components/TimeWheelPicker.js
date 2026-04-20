import React, { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ITEM_H = 40;
const VISIBLE = 3;

function WheelColumn({ items, selected, onSelect }) {
  const { theme } = useTheme();
  const ref = useRef(null);

  const handleEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    if (idx >= 0 && idx < items.length) onSelect(idx);
  };

  return (
    <View style={styles.column}>
      <ScrollView
        ref={ref}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        onMomentumScrollEnd={handleEnd}
        contentOffset={{ x: 0, y: selected * ITEM_H }}
      >
        {items.map((item, i) => {
          const isSel = i === selected;
          return (
            <View key={i} style={[styles.item, isSel && { backgroundColor: theme.accent + '18' }]}>
              <Text style={[styles.itemText, { color: theme.text, opacity: isSel ? 1 : 0.4 }, isSel && { fontWeight: '800' }]}>
                {String(item).padStart(2, '0')}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

export default function TimeWheelPicker({ value = { hours: 8, minutes: 0 }, onChange }) {
  return (
    <View style={styles.container}>
      <WheelColumn items={hours} selected={value.hours} onSelect={h => onChange({ ...value, hours: h })} />
      <Text style={styles.sep}>:</Text>
      <WheelColumn items={minutes} selected={value.minutes} onSelect={m => onChange({ ...value, minutes: m })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  column: { height: ITEM_H * VISIBLE, width: 60, overflow: 'hidden' },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  itemText: { fontSize: 20, fontWeight: '500' },
  sep: { fontSize: 24, fontWeight: '700', marginHorizontal: 8 },
});
