import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ITEM_H = 40;
const VISIBLE = 3;

function WheelColumn({ items, selected, onSelect }) {
  const { theme } = useTheme();
  const offsetY = useRef(new Animated.Value(-selected * ITEM_H)).current;
  const startY = useRef(0);
  const currentIdx = useRef(selected);

  useEffect(() => {
    currentIdx.current = selected;
    offsetY.setValue(-selected * ITEM_H);
  }, [selected]);

  const clamp = (idx) => Math.max(0, Math.min(items.length - 1, idx));

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderGrant: () => { startY.current = -currentIdx.current * ITEM_H; },
    onPanResponderMove: (_, g) => { offsetY.setValue(startY.current + g.dy); },
    onPanResponderRelease: (_, g) => {
      const raw = startY.current + g.dy;
      const idx = clamp(Math.round(-raw / ITEM_H));
      currentIdx.current = idx;
      Animated.spring(offsetY, { toValue: -idx * ITEM_H, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
      onSelect(idx);
    },
  })).current;

  return (
    <View style={styles.column} {...responder.panHandlers}>
      <Animated.View style={{ transform: [{ translateY: Animated.add(offsetY, new Animated.Value(ITEM_H)) }] }}>
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
      </Animated.View>
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
