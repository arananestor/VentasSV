import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, PanResponder, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS = {
  new: { label: 'NUEVO', color: '#F77F00', next: 'processing' },
  processing: { label: 'EN PROCESO', color: '#4361EE', next: 'done' },
  done: { label: 'LISTO', color: '#2B9348', next: null },
};

const SECTIONS = [
  { key: 'new', label: 'Nuevos' },
  { key: 'processing', label: 'En proceso' },
  { key: 'done', label: 'Listos' },
];

function CompactCard({ sale, theme }) {
  return (
    <View style={[styles.compactCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.compactBar, { backgroundColor: STATUS.done.color }]} />
      <View style={styles.compactContent}>
        <Text style={[styles.compactOrder, { color: theme.textMuted }]}>
          #{sale.orderNumber || sale.id?.slice(-4)}
        </Text>
        <Text style={[styles.compactName, { color: theme.text }]} numberOfLines={1}>
          {sale.productName}
        </Text>
        <Text style={[styles.compactSub, { color: theme.textMuted }]}>
          {sale.quantity}x · {sale.size}
        </Text>
      </View>
      {sale.processingStartedAt && sale.completedAt && (() => {
        const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
        const m = Math.floor(diff / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        return (
          <Text style={[styles.compactTime, { color: STATUS.done.color }]}>⏱ {m}:{s}</Text>
        );
      })()}
    </View>
  );
}

function OrderCard({ sale, theme, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    if (sale.orderStatus === 'processing' && sale.processingStartedAt) {
      const interval = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(sale.processingStartedAt)) / 1000);
        const m = Math.floor(diff / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${m}:${s}`);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (sale.orderStatus === 'done' && sale.processingStartedAt && sale.completedAt) {
      const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }
  }, [sale.orderStatus, sale.processingStartedAt]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        const threshold = SCREEN_WIDTH * 0.28;
        if (gs.dx > threshold && STATUS[sale.orderStatus]?.next) {
          Animated.spring(pan, { toValue: { x: SCREEN_WIDTH, y: 0 }, useNativeDriver: false }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            onStatusChange(sale.id, STATUS[sale.orderStatus].next);
          });
        } else if (gs.dx < -threshold && sale.orderStatus === 'processing') {
          Animated.spring(pan, { toValue: { x: -SCREEN_WIDTH, y: 0 }, useNativeDriver: false }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            onStatusChange(sale.id, 'new');
          });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, tension: 80 }).start();
        }
      },
    })
  ).current;

  const status = STATUS[sale.orderStatus] || STATUS.new;

  const cardBg = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.3, 0, SCREEN_WIDTH * 0.3],
    outputRange: ['#4361EE18', theme.card, `${STATUS[status.next]?.color || status.color}18`],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: cardBg, borderColor: theme.cardBorder, transform: [{ translateX: pan.x }] }]}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[styles.dragHintRight, {
        backgroundColor: STATUS[status.next]?.color || status.color,
        opacity: pan.x.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' }),
      }]}>
        <Feather name="chevron-right" size={13} color="#fff" />
        <Text style={styles.dragHintText}>{status.next === 'processing' ? 'Iniciar' : 'Listo'}</Text>
      </Animated.View>

      {sale.orderStatus === 'processing' && (
        <Animated.View style={[styles.dragHintLeft, {
          backgroundColor: STATUS.new.color,
          opacity: pan.x.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' }),
        }]}>
          <Feather name="chevron-left" size={13} color="#fff" />
          <Text style={styles.dragHintText}>Nuevo</Text>
        </Animated.View>
      )}

      <View style={[styles.cardStatusBar, { backgroundColor: status.color }]} />

      <TouchableOpacity style={styles.cardMain} onPress={() => setExpanded(!expanded)} activeOpacity={0.9}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.cardOrder, { color: theme.textMuted }]}>
              #{sale.orderNumber || sale.id?.slice(-4)}
            </Text>
            <Text style={[styles.cardProduct, { color: theme.text }]} numberOfLines={1}>
              {sale.productName}
            </Text>
            <Text style={[styles.cardSub, { color: theme.textMuted }]}>
              {sale.size} · {sale.quantity}x · {sale.workerName}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusPill, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
            </View>
            {elapsed ? (
              <Text style={[styles.elapsed, { color: sale.orderStatus === 'processing' ? status.color : theme.textMuted }]}>
                ⏱ {elapsed}
              </Text>
            ) : null}
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
          </View>
        </View>
        {!expanded && sale.toppings?.length > 0 && (
          <Text style={[styles.cardToppings, { color: theme.textMuted }]} numberOfLines={1}>
            + {sale.toppings.join(', ')}
          </Text>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.cardDetail, { borderTopColor: theme.cardBorder }]}>
          {sale.units?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>UNIDADES</Text>
              {sale.units.map((unit, i) => (
                <View key={i} style={[styles.unitRow, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.unitNum, { color: theme.textMuted }]}>{i + 1}</Text>
                  <View style={styles.unitInfo}>
                    {unit.flavors?.length > 0 && (
                      <View style={styles.flavorsRow}>
                        {unit.flavors.map((f, fi) => (
                          <View key={fi} style={[styles.flavorChip, { backgroundColor: f.color || '#888' }]}>
                            <Text style={styles.flavorChipText}>{f.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {unit.toppings?.length > 0 && (
                      <Text style={[styles.unitToppings, { color: theme.textSecondary }]}>
                        + {unit.toppings.join(', ')}
                      </Text>
                    )}
                    {unit.note ? (
                      <Text style={[styles.unitNote, { color: theme.textMuted }]}>📝 {unit.note}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {!sale.units?.length && sale.toppings?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>EXTRAS</Text>
              <View style={styles.toppingsWrap}>
                {sale.toppings.map((t, i) => (
                  <View key={i} style={[styles.toppingChip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.toppingChipText, { color: theme.text }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {sale.note ? (
            <View style={[styles.noteBox, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
              <Feather name="file-text" size={13} color={theme.textMuted} />
              <Text style={[styles.noteText, { color: theme.textSecondary }]}>{sale.note}</Text>
            </View>
          ) : null}

          {status.next && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: STATUS[status.next].color }]}
              onPress={() => onStatusChange(sale.id, status.next)}
            >
              <Text style={styles.actionBtnText}>
                {status.next === 'processing' ? 'Iniciar preparación →' : 'Marcar como listo →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

export default function OrdersScreen() {
  const { getTodaySales, updateSaleStatus } = useApp();
  const { theme } = useTheme();
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeSection, setActiveSection] = useState('new');

  const sales = getTodaySales().reverse();
  const newOrders = sales.filter(s => (s.orderStatus || 'new') === 'new');
  const processingOrders = sales.filter(s => s.orderStatus === 'processing');
  const doneOrders = sales.filter(s => s.orderStatus === 'done');

  const scrollToSection = (key) => {
    setActiveSection(key);
    sectionRefs.current[key]?.measureLayout(
      scrollRef.current,
      (_, y) => scrollRef.current?.scrollTo({ y: y - 56, animated: true }),
      () => {}
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>

      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>PEDIDOS</Text>
        <View style={styles.headerIndex}>
          {SECTIONS.map(s => {
            const count = s.key === 'new' ? newOrders.length
              : s.key === 'processing' ? processingOrders.length
              : doneOrders.length;
            const isActive = activeSection === s.key;
            return (
              <TouchableOpacity key={s.key} style={styles.indexBtn} onPress={() => scrollToSection(s.key)}>
                <Text style={[styles.indexText, { color: isActive ? theme.text : theme.textMuted }]}>
                  {s.label}{count > 0 ? ` · ${count}` : ''}
                </Text>
                {isActive && <View style={[styles.indexUnderline, { backgroundColor: STATUS[s.key].color }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {(newOrders.length > 0 || processingOrders.length > 0) && (
        <View style={[styles.hintBanner, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
          <MaterialCommunityIcons name="gesture-swipe-horizontal" size={13} color={theme.textMuted} />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>Deslizá para cambiar el estado</Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* NUEVOS */}
        <View ref={ref => sectionRefs.current['new'] = ref} style={styles.section}>
          <View style={[styles.sectionHeader, { borderLeftColor: STATUS.new.color }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Nuevos</Text>
            <Text style={[styles.sectionCount, { color: STATUS.new.color }]}>{newOrders.length}</Text>
          </View>
          {newOrders.length === 0
            ? <View style={[styles.emptySection, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sin pedidos nuevos</Text>
              </View>
            : newOrders.map(sale => (
                <OrderCard key={sale.id} sale={sale} theme={theme} onStatusChange={updateSaleStatus} />
              ))
          }
        </View>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        {/* EN PROCESO */}
        <View ref={ref => sectionRefs.current['processing'] = ref} style={styles.section}>
          <View style={[styles.sectionHeader, { borderLeftColor: STATUS.processing.color }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>En proceso</Text>
            <Text style={[styles.sectionCount, { color: STATUS.processing.color }]}>{processingOrders.length}</Text>
          </View>
          {processingOrders.length === 0
            ? <View style={[styles.emptySection, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Nada en proceso</Text>
              </View>
            : processingOrders.map(sale => (
                <OrderCard key={sale.id} sale={sale} theme={theme} onStatusChange={updateSaleStatus} />
              ))
          }
        </View>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        {/* LISTOS */}
        <View ref={ref => sectionRefs.current['done'] = ref} style={styles.section}>
          <View style={[styles.sectionHeader, { borderLeftColor: STATUS.done.color }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Listos</Text>
            <Text style={[styles.sectionCount, { color: STATUS.done.color }]}>{doneOrders.length}</Text>
          </View>
          {doneOrders.length === 0
            ? <View style={[styles.emptySection, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Ninguno listo aún</Text>
              </View>
            : doneOrders.map(sale => (
                <CompactCard key={sale.id} sale={sale} theme={theme} />
              ))
          }
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3, marginBottom: 12 },
  headerIndex: { flexDirection: 'row' },
  indexBtn: { paddingRight: 20, paddingBottom: 10, position: 'relative' },
  indexText: { fontSize: 13, fontWeight: '700' },
  indexUnderline: { position: 'absolute', bottom: 0, left: 0, right: 20, height: 2, borderRadius: 1 },
  hintBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 1,
  },
  hintText: { fontSize: 11, fontWeight: '500' },
  scrollContent: { paddingTop: 8 },
  section: { paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: 10, borderLeftWidth: 3, marginBottom: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  sectionCount: { fontSize: 13, fontWeight: '800' },
  divider: { height: 6 },
  emptySection: {
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    paddingVertical: 20, alignItems: 'center',
  },
  emptyText: { fontSize: 13, fontWeight: '500' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 2 },
  cardStatusBar: { height: 3 },
  cardMain: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, marginRight: 10 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 4 },
  cardOrder: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  cardProduct: { fontSize: 15, fontWeight: '800' },
  cardSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statusPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  elapsed: { fontSize: 11, fontWeight: '700' },
  cardToppings: { fontSize: 11, fontWeight: '500', marginTop: 6 },
  dragHintRight: {
    position: 'absolute', right: 10, top: '50%', marginTop: -13,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, zIndex: 10,
  },
  dragHintLeft: {
    position: 'absolute', left: 10, top: '50%', marginTop: -13,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, zIndex: 10,
  },
  dragHintText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardDetail: { borderTopWidth: 1, padding: 14, gap: 10 },
  detailSection: { gap: 8 },
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  unitRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  unitNum: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  unitInfo: { flex: 1, gap: 4 },
  flavorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flavorChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  flavorChipText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  unitToppings: { fontSize: 12, fontWeight: '500' },
  unitNote: { fontSize: 12, fontWeight: '500', fontStyle: 'italic' },
  toppingsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toppingChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  toppingChipText: { fontSize: 12, fontWeight: '600' },
  noteBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  noteText: { fontSize: 13, fontWeight: '500', flex: 1 },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  compactCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 2,
  },
  compactBar: { width: 3, alignSelf: 'stretch' },
  compactContent: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  compactOrder: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  compactName: { fontSize: 13, fontWeight: '700', marginTop: 1 },
  compactSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  compactTime: { fontSize: 11, fontWeight: '700', paddingRight: 12 },
});